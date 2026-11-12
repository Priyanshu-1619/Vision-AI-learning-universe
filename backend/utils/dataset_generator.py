"""Synthetic data generators for lab experiments."""
from __future__ import annotations

import numpy as np


def generate_linear_data(
    n: int = 50, slope: float = 2.0, intercept: float = 1.0, noise: float = 0.5, seed: int = 42
) -> dict[str, list[float]]:
    rng = np.random.default_rng(seed)
    x = rng.uniform(0, 10, n)
    y = slope * x + intercept + rng.normal(0, noise, n)
    return {"x": x.tolist(), "y": y.tolist()}


def generate_cluster_data(
    n_per_cluster: int = 30, k: int = 3, spread: float = 1.0, seed: int = 42
) -> list[list[float]]:
    rng = np.random.default_rng(seed)
    centers = rng.uniform(-10, 10, (k, 2))
    points = []
    for center in centers:
        cluster_points = rng.normal(center, spread, (n_per_cluster, 2))
        points.extend(cluster_points.tolist())
    return points
