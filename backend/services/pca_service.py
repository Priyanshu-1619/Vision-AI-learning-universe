"""PCA Dimensionality Reduction lab service using scikit-learn PCA."""
from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

from services.lab_datasets import validate_2d_array


def run_pca(
    data: list[list[float]],
    n_components: int = 2,
    standardize: bool = True,
) -> dict[str, Any]:
    """Fit sklearn PCA with optional StandardScaler and return full eigen-quantities."""
    if not data:
        raise ValueError("Input 'data' must be non-empty.")

    X = validate_2d_array(data)
    n_features = X.shape[1]

    if n_components <= 0:
        raise ValueError("'n_components' must be a positive integer.")
    if n_components > n_features:
        raise ValueError(
            f"'n_components' ({n_components}) cannot exceed n_features ({n_features})."
        )

    if standardize:
        scaler = StandardScaler()
        X_prepared = scaler.fit_transform(X)
    else:
        X_prepared = X - np.mean(X, axis=0)

    # Fit user-requested n_components PCA
    pca = PCA(n_components=n_components)
    projected = pca.fit_transform(X_prepared)

    # Also fit full PCA so full explained variance spectrum across all dimensions is accurate
    full_pca = PCA(n_components=n_features)
    full_pca.fit(X_prepared)

    ev = [round(float(v), 4) for v in pca.explained_variance_.tolist()]
    evr = [round(float(v), 4) for v in pca.explained_variance_ratio_.tolist()]
    cumulative = [round(sum(evr[: i + 1]), 4) for i in range(len(evr))]

    full_evr = [round(float(v), 4) for v in full_pca.explained_variance_ratio_.tolist()]
    full_ev = [round(float(v), 4) for v in full_pca.explained_variance_.tolist()]

    return {
        "projected": np.round(projected, 5).tolist(),
        "prepared_data": np.round(X_prepared, 5).tolist(),
        "explained_variance": ev,
        "explained_variance_ratio": evr,
        "components": np.round(pca.components_, 5).tolist(),
        "cumulative_variance": cumulative,
        "full_explained_variance": full_ev,
        "full_explained_variance_ratio": full_evr,
        "mean": [round(float(v), 5) for v in np.mean(X, axis=0).tolist()],
        "standardized": bool(standardize),
    }

