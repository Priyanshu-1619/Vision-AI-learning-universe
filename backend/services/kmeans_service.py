"""K-Means Clustering lab service using scikit-learn with iteration snapshots."""
from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.cluster import KMeans, kmeans_plusplus

from services.lab_datasets import validate_2d_array


def run_kmeans(
    data: list[list[float]],
    k: int = 3,
    init_method: str = "k-means++",
    seed: int = 42,
    max_iter: int = 15,
) -> dict[str, Any]:
    """Run scikit-learn KMeans and record real step-by-step centroid snapshots."""
    if k <= 0:
        raise ValueError("Parameter 'k' must be a positive integer.")
    if init_method not in ("k-means++", "random"):
        raise ValueError("Parameter 'init_method' must be 'k-means++' or 'random'.")
    if not data:
        return {
            "clusters": [],
            "centroids": [],
            "inertia": 0.0,
            "n_iter": 0,
            "converged": True,
            "iterations": [],
        }

    X = validate_2d_array(data)
    n = len(X)
    actual_k = min(int(k), n)
    seed = int(seed)
    max_iter = max(1, min(int(max_iter), 50))

    # Compute genuine initial centroids matching sklearn's init mode
    if init_method == "k-means++":
        centroids, _ = kmeans_plusplus(X, n_clusters=actual_k, random_state=seed)
    else:
        rng = np.random.default_rng(seed)
        indices = rng.choice(n, size=actual_k, replace=False)
        centroids = X[indices].copy()

    # Step 0: initial assignment before any centroid movement
    dists_0 = np.linalg.norm(X[:, None, :] - centroids[None, :, :], axis=2)
    labels_0 = np.argmin(dists_0, axis=1)
    inertia_0 = float(np.sum((X - centroids[labels_0]) ** 2))

    iterations: list[dict[str, Any]] = [
        {
            "iteration": 0,
            "centroids": np.round(centroids, 5).tolist(),
            "clusters": [int(c) for c in labels_0.tolist()],
            "inertia": round(inertia_0, 4),
            "centroid_shift": 0.0,
        }
    ]

    converged = False
    final_labels = labels_0
    final_centroids = centroids
    final_inertia = inertia_0

    # Iterate 1 step at a time via sklearn.cluster.KMeans(max_iter=1, n_init=1)
    prev_centroids = centroids
    for it in range(1, max_iter + 1):
        km = KMeans(
            n_clusters=actual_k,
            init=prev_centroids,
            n_init=1,
            max_iter=1,
            random_state=seed,
        )
        km.fit(X)
        new_centroids = km.cluster_centers_.copy()
        shift = float(np.linalg.norm(new_centroids - prev_centroids))

        # Assign points to the updated centroids cleanly so labels match centers shown
        dists = np.linalg.norm(X[:, None, :] - new_centroids[None, :, :], axis=2)
        assigned = np.argmin(dists, axis=1)
        step_inertia = float(np.sum((X - new_centroids[assigned]) ** 2))

        iterations.append({
            "iteration": it,
            "centroids": np.round(new_centroids, 5).tolist(),
            "clusters": [int(c) for c in assigned.tolist()],
            "inertia": round(step_inertia, 4),
            "centroid_shift": round(shift, 6),
        })

        final_labels = assigned
        final_centroids = new_centroids
        final_inertia = step_inertia
        prev_centroids = new_centroids

        if shift < 1e-4:
            converged = True
            break

    return {
        "clusters": [int(c) for c in final_labels.tolist()],
        "centroids": np.round(final_centroids, 5).tolist(),
        "inertia": round(final_inertia, 4),
        "n_iter": len(iterations) - 1,
        "converged": converged,
        "iterations": iterations,
    }

