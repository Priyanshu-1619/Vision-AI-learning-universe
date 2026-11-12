"""KNN Classification lab service using scikit-learn KNeighborsClassifier."""
from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier

from services.lab_datasets import validate_2d_array

SUPPORTED_METRICS = {"euclidean", "manhattan", "chebyshev", "minkowski"}


def _compute_boundary_2d(
    clf: KNeighborsClassifier, X: np.ndarray, resolution: int = 38
) -> dict[str, Any] | None:
    """Compute a 2-D classification decision surface grid for Plotly contour/heatmap."""
    if X.shape[1] != 2 or len(X) == 0:
        return None

    x_min, x_max = float(X[:, 0].min()), float(X[:, 0].max())
    y_min, y_max = float(X[:, 1].min()), float(X[:, 1].max())
    pad_x = max(0.35, (x_max - x_min) * 0.14)
    pad_y = max(0.35, (y_max - y_min) * 0.14)

    xs = np.linspace(x_min - pad_x, x_max + pad_x, resolution)
    ys = np.linspace(y_min - pad_y, y_max + pad_y, resolution)
    xx, yy = np.meshgrid(xs, ys)
    grid_points = np.column_stack([xx.ravel(), yy.ravel()])

    preds = clf.predict(grid_points).reshape(resolution, resolution)
    probs = clf.predict_proba(grid_points).max(axis=1).reshape(resolution, resolution)

    return {
        "x_grid": [round(float(v), 4) for v in xs.tolist()],
        "y_grid": [round(float(v), 4) for v in ys.tolist()],
        "z_classes": preds.tolist(),
        "z_confidence": np.round(probs, 3).tolist(),
    }


def run_knn(
    data: list[list[float]],
    labels: list[int],
    query: list[float],
    k: int = 5,
    metric: str = "euclidean",
) -> dict[str, Any]:
    """Run scikit-learn KNeighborsClassifier, compute 2-D boundary and query vote."""
    if k <= 0:
        raise ValueError("Parameter 'k' must be a positive integer.")
    if metric not in SUPPORTED_METRICS:
        raise ValueError(
            f"Unsupported distance metric '{metric}'. Valid: {sorted(SUPPORTED_METRICS)}"
        )
    if not data or not labels:
        raise ValueError("Input 'data' and 'labels' must be non-empty.")
    if len(data) != len(labels):
        raise ValueError("'data' and 'labels' must have equal length.")
    if not query:
        raise ValueError("'query' must be a non-empty point.")

    X = validate_2d_array(data)
    q = np.array(query, dtype=float).reshape(1, -1)
    if not np.all(np.isfinite(q)):
        raise ValueError("'query' must contain finite numbers.")
    if q.shape[1] != X.shape[1]:
        raise ValueError(
            f"'query' dimensionality ({q.shape[1]}) must match 'data' ({X.shape[1]})."
        )

    y = np.array(labels, dtype=int)
    actual_k = min(int(k), len(X))

    # Fit classifier on full dataset for interactive neighborhood & decision surface
    clf = KNeighborsClassifier(n_neighbors=actual_k, metric=metric)
    clf.fit(X, y)

    distances, neighbor_indices = clf.kneighbors(q)
    proba = clf.predict_proba(q)[0]
    predicted = int(clf.predict(q)[0])
    classes = clf.classes_.tolist()

    # Estimate validation accuracy using 70/30 split when enough samples exist
    train_acc = round(float(clf.score(X, y)), 4)
    val_acc = train_acc
    if len(X) >= 20 and len(np.unique(y)) > 1:
        X_tr, X_te, y_tr, y_te = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )
        val_k = min(actual_k, len(X_tr))
        val_clf = KNeighborsClassifier(n_neighbors=val_k, metric=metric)
        val_clf.fit(X_tr, y_tr)
        val_acc = round(float(val_clf.score(X_te, y_te)), 4)

    boundary = _compute_boundary_2d(clf, X, resolution=38)

    return {
        "predicted_class": predicted,
        "neighbors": [int(i) for i in neighbor_indices[0].tolist()],
        "neighbor_distances": [round(float(d), 4) for d in distances[0].tolist()],
        "class_probabilities": {
            str(int(c)): round(float(p), 4) for c, p in zip(classes, proba)
        },
        "train_accuracy": train_acc,
        "validation_accuracy": val_acc,
        "metric": metric,
        "boundary": boundary,
    }

