"""Synthetic and local educational dataset generators for AI Laboratory."""
from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.datasets import load_iris, make_blobs, make_circles, make_moons


def validate_2d_array(data: list[list[float]], name: str = "data") -> np.ndarray:
    """Validate that input is a non-empty, finite 2-D float matrix."""
    if not data:
        raise ValueError(f"Input '{name}' must be non-empty.")
    X = np.array(data, dtype=float)
    if X.ndim != 2 or X.shape[1] == 0:
        raise ValueError(f"Input '{name}' must be a non-empty 2-D array.")
    if not np.all(np.isfinite(X)):
        raise ValueError(f"Input '{name}' must contain only finite numbers.")
    return X


def generate_dataset(
    name: str,
    n_samples: int = 200,
    noise: float = 0.1,
    seed: int = 42,
    all_features: bool = False,
) -> dict[str, Any]:
    """Generate a synthetic or built-in local dataset cleanly."""
    n_samples = max(30, min(int(n_samples), 1000))
    noise = max(0.0, min(float(noise), 1.0))
    seed = int(seed)
    rng = np.random.default_rng(seed)

    if name == "moons":
        X, y = make_moons(n_samples=n_samples, noise=noise, random_state=seed)
        feature_names = ["x1", "x2"]
    elif name == "circles":
        X, y = make_circles(
            n_samples=n_samples, noise=noise, factor=0.5, random_state=seed
        )
        feature_names = ["x1", "x2"]
    elif name == "blobs":
        X, y = make_blobs(
            n_samples=n_samples,
            centers=3,
            cluster_std=noise * 3.0 + 0.5,
            random_state=seed,
        )
        feature_names = ["x1", "x2"]
    elif name == "linear":
        # Works both for regression (x1 -> x2) and binary linear boundary
        x1 = rng.uniform(-3.0, 3.0, n_samples)
        line_y = 0.85 * x1 + 0.35
        x2 = line_y + rng.normal(0.0, noise * 2.5 + 0.08, n_samples)
        X = np.column_stack([x1, x2])
        y = (x2 >= line_y).astype(int)
        feature_names = ["x1", "x2"]
    elif name == "outliers":
        # Linear relationship with ~8% extreme vertical outliers
        x1 = rng.uniform(-3.0, 3.0, n_samples)
        line_y = 0.85 * x1 + 0.35
        x2 = line_y + rng.normal(0.0, noise * 2.0 + 0.08, n_samples)
        n_out = max(3, int(0.08 * n_samples))
        out_idx = rng.choice(n_samples, size=n_out, replace=False)
        x2[out_idx] += rng.choice([-1.0, 1.0], size=n_out) * rng.uniform(2.5, 4.5, size=n_out)
        X = np.column_stack([x1, x2])
        y = (x2 >= line_y).astype(int)
        feature_names = ["x1", "x2"]
    elif name == "correlated":
        # Anisotropic, differently-scaled 2D cloud — highlights PCA standardization
        z1 = rng.normal(0.0, 1.2, n_samples)
        z2 = rng.normal(0.0, 0.35, n_samples)
        theta = np.deg2rad(35.0)
        x1 = z1 * np.cos(theta) - z2 * np.sin(theta)
        # Multiply x2 by 8x so unstandardized covariance favors x2 strongly
        x2 = (z1 * np.sin(theta) + z2 * np.cos(theta)) * 8.0
        X = np.column_stack([x1, x2])
        y = (z1 >= 0.0).astype(int)
        feature_names = ["feature_1 (small scale)", "feature_2 (8x scale)"]
    elif name == "iris":
        iris = load_iris()
        if all_features:
            X = iris.data
            y = iris.target
            feature_names = [
                "sepal_length",
                "sepal_width",
                "petal_length",
                "petal_width",
            ]
        else:
            # First two discriminative features for 2-D visualization
            X = iris.data[:, [2, 3]]
            y = iris.target
            feature_names = ["petal_length", "petal_width"]
    else:
        raise ValueError(
            f"Unknown dataset '{name}'. Valid names: linear, outliers, moons, circles, blobs, correlated, iris"
        )

    return {
        "data": np.round(X, 5).tolist(),
        "labels": [int(v) for v in y.tolist()],
        "feature_names": feature_names,
        "name": name,
        "n_samples": int(len(X)),
        "n_features": int(X.shape[1]),
    }

