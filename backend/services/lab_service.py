"""Lab service facade — delegates to algorithm-specific scikit-learn modules."""
from __future__ import annotations

from services.decision_tree_service import run_decision_tree
from services.kmeans_service import run_kmeans
from services.knn_service import run_knn
from services.lab_datasets import generate_dataset
from services.pca_service import run_pca
from services.regression_service import run_linear_regression

__all__ = [
    "generate_dataset",
    "run_linear_regression",
    "run_kmeans",
    "run_knn",
    "run_decision_tree",
    "run_pca",
]
