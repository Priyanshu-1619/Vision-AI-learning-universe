"""Linear Regression lab service using scikit-learn + real Gradient Descent trace."""
from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def run_linear_regression(
    data: dict[str, Any], params: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Fit LinearRegression (sklearn) on 1-D (x, y) and compute residuals + GD trajectory."""
    params = params or {}
    raw_x = data.get("x", [1, 2, 3, 4, 5])
    raw_y = data.get("y", [2, 4, 5, 4, 5])

    if len(raw_x) == 0 or len(raw_y) == 0:
        raise ValueError("Input arrays 'x' and 'y' must be non-empty.")
    if len(raw_x) != len(raw_y):
        raise ValueError(
            f"Input arrays 'x' ({len(raw_x)}) and 'y' ({len(raw_y)}) must have equal length."
        )

    x = np.array(raw_x, dtype=float)
    y = np.array(raw_y, dtype=float)
    if not (np.all(np.isfinite(x)) and np.all(np.isfinite(y))):
        raise ValueError("Input arrays 'x' and 'y' must contain only finite numbers.")

    # Fit using scikit-learn LinearRegression
    X_col = x.reshape(-1, 1)
    model = LinearRegression()
    model.fit(X_col, y)

    y_pred = model.predict(X_col)
    residuals = y - y_pred
    slope = float(model.coef_[0])
    intercept = float(model.intercept_)

    mse = float(mean_squared_error(y, y_pred))
    mae = float(mean_absolute_error(y, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y, y_pred)) if len(y) > 1 and np.var(y) > 0 else 0.0

    # Compute optional genuine Gradient Descent optimization trajectory in Python
    # Optimize on zero-centered / unit-std x for numerical stability, then map back to raw (m, b)
    include_gd = bool(params.get("include_gd", True))
    gd_history: list[dict[str, float]] = []
    if include_gd:
        lr = float(params.get("gd_lr", 0.12))
        lr = max(0.01, min(lr, 0.9))
        n_epochs = int(params.get("gd_epochs", 40))
        n_epochs = max(5, min(n_epochs, 150))

        x_mean = float(np.mean(x))
        x_std = float(np.std(x)) or 1.0
        x_norm = (x - x_mean) / x_std

        w_norm = 0.0
        b_norm = 0.0
        n = float(len(x))

        # Record step 0 + evenly spaced steps up to n_epochs
        sample_every = max(1, n_epochs // 25)
        for epoch in range(n_epochs + 1):
            pred_norm = w_norm * x_norm + b_norm
            err = pred_norm - y
            epoch_mse = float(np.mean(err ** 2))
            # Convert standardized parameters back to raw coordinate space:
            # y = w_norm * (x - x_mean)/x_std + b_norm = (w_norm/x_std)*x + (b_norm - w_norm*x_mean/x_std)
            m_raw = w_norm / x_std
            b_raw = b_norm - m_raw * x_mean

            if epoch % sample_every == 0 or epoch == n_epochs:
                gd_history.append({
                    "epoch": int(epoch),
                    "slope": round(float(m_raw), 4),
                    "intercept": round(float(b_raw), 4),
                    "mse": round(epoch_mse, 4),
                })

            if epoch < n_epochs:
                grad_w = float((2.0 / n) * np.dot(err, x_norm))
                grad_b = float((2.0 / n) * np.sum(err))
                w_norm -= lr * grad_w
                b_norm -= lr * grad_b

    return {
        "coefficients": [round(slope, 5), round(intercept, 5)],
        "slope": round(slope, 5),
        "intercept": round(intercept, 5),
        "predictions": [round(float(v), 5) for v in y_pred.tolist()],
        "actual": [round(float(v), 5) for v in y.tolist()],
        "residuals": [round(float(v), 5) for v in residuals.tolist()],
        "metrics": {
            "r_squared": round(r2, 4),
            "mse": round(mse, 4),
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
        },
        "gd_history": gd_history,
    }

