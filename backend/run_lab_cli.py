"""
AI Learning Universe — Command-Line Laboratory Algorithm Runner
Allows running and inspecting scikit-learn ML models directly from the terminal.

Usage Examples:
    python backend/run_lab_cli.py --model linear-regression --dataset linear
    python backend/run_lab_cli.py --model kmeans --k 3 --dataset blobs
    python backend/run_lab_cli.py --model knn --k 5 --dataset moons
    python backend/run_lab_cli.py --model decision-tree --max-depth 3 --dataset circles
    python backend/run_lab_cli.py --model pca --standardize --dataset correlated
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from services.lab_datasets import generate_dataset
from services.regression_service import run_linear_regression
from services.kmeans_service import run_kmeans
from services.knn_service import run_knn
from services.decision_tree_service import run_decision_tree
from services.pca_service import run_pca


def print_header(title: str):
    print("=" * 64)
    print(f"  AI LEARNING UNIVERSE — {title.upper()}")
    print("=" * 64)


def run_linear_regression_cli(dataset_name: str = "linear"):
    print_header("Linear Regression (OLS + Gradient Descent)")
    dataset = generate_dataset(name=dataset_name, n_samples=60, noise=0.15)
    x_vals = [pt[0] for pt in dataset["data"]]
    y_vals = [pt[1] for pt in dataset["data"]]
    print(f"Dataset generated: '{dataset_name}' with {len(x_vals)} sample points.")

    result = run_linear_regression(
        data={"x": x_vals, "y": y_vals},
        params={"learning_rate": 0.05, "epochs": 25}
    )

    print("\n--- Ordinary Least Squares (OLS) Solution ---")
    print(f"  Fitted Slope (m)     : {result.get('slope', 0):.4f}")
    print(f"  Fitted Intercept (b) : {result.get('intercept', 0):.4f}")
    print(f"  Fitted Formula       : y = {result.get('slope', 0):.4f} * x + {result.get('intercept', 0):.4f}")
    print(f"  MSE Loss             : {result.get('mse', 0):.4f}")

    history = result.get("history", [])
    if history:
        print(f"\n--- Gradient Descent Iteration Trace ({len(history)} steps) ---")
        first = history[0]
        last = history[-1]
        print(f"  Step 0  : m={first.get('m', 0):.4f}, b={first.get('b', 0):.4f}, loss={first.get('loss', 0):.4f}")
        print(f"  Step {len(history)} : m={last.get('m', 0):.4f}, b={last.get('b', 0):.4f}, loss={last.get('loss', 0):.4f}")


def run_kmeans_cli(k: int = 3, dataset_name: str = "blobs"):
    print_header(f"K-Means Clustering (K={k})")
    dataset = generate_dataset(name=dataset_name, n_samples=90, noise=0.1)
    samples = dataset["data"]
    print(f"Dataset generated: '{dataset_name}' with {len(samples)} 2-D coordinates.")

    result = run_kmeans(data=samples, k=k, init_method="k-means++", seed=42, max_iter=20)

    centroids = result.get("centroids", [])
    print(f"\n--- Converged Centroids ({len(centroids)}) ---")
    for idx, c in enumerate(centroids):
        print(f"  Cluster {idx + 1}: x={c[0]:.4f}, y={c[1]:.4f}")

    history = result.get("history", [])
    print(f"\nConvergence reached in {len(history)} centroid update iterations.")


def run_knn_cli(k: int = 5, dataset_name: str = "moons"):
    print_header(f"K-Nearest Neighbors (K={k})")
    dataset = generate_dataset(name=dataset_name, n_samples=80, noise=0.1)
    samples = [row + [label] for row, label in zip(dataset["data"], dataset["labels"])]
    print(f"Dataset generated: '{dataset_name}' with {len(samples)} labeled samples.")

    query = [0.5, 0.2]
    result = run_knn(data=samples, k=k, metric="euclidean", weights="uniform", query_point=query)

    print(f"\n--- Query Point: ({query[0]}, {query[1]}) ---")
    print(f"  Predicted Class      : {result.get('predicted_class')}")
    print(f"  Class Probabilities  : {result.get('class_probabilities')}")
    print(f"  Nearest Neighbors (K={k}) evaluated.")


def run_decision_tree_cli(max_depth: int = 3, dataset_name: str = "moons"):
    print_header(f"Decision Tree Classifier (max_depth={max_depth})")
    dataset = generate_dataset(name=dataset_name, n_samples=80, noise=0.1)
    samples = [row + [label] for row, label in zip(dataset["data"], dataset["labels"])]
    print(f"Dataset generated: '{dataset_name}' with {len(samples)} samples.")

    result = run_decision_tree(
        data=samples,
        criterion="gini",
        max_depth=max_depth,
        min_samples_split=2
    )

    print("\n--- Tree Metrics ---")
    print(f"  Tree Max Depth    : {result.get('tree_depth', max_depth)}")
    print(f"  Total Tree Leaves : {result.get('n_leaves', 'N/A')}")
    print(f"  Training Accuracy : {result.get('train_accuracy', 0) * 100:.2f}%")


def run_pca_cli(standardize: bool = True, dataset_name: str = "correlated"):
    print_header("Principal Component Analysis (PCA)")
    dataset = generate_dataset(name=dataset_name, n_samples=100, noise=0.1)
    samples = dataset["data"]
    print(f"Dataset generated: '{dataset_name}' with {len(samples)} 2-D coordinates.")

    result = run_pca(data=samples, n_components=2, standardize=standardize)

    evr = result.get("explained_variance_ratio", [])
    components = result.get("components", [])
    print(f"\n--- Principal Components & Variance Explained (Standardize={standardize}) ---")
    for idx, (ratio, comp) in enumerate(zip(evr, components)):
        print(f"  PC{idx + 1} Explained Variance : {ratio * 100:.2f}% | Eigenvector: [{comp[0]:.4f}, {comp[1]:.4f}]")


def main():
    parser = argparse.ArgumentParser(description="Run AI Learning Universe ML algorithms via CLI.")
    parser.add_argument(
        "--model",
        choices=["linear-regression", "kmeans", "knn", "decision-tree", "pca"],
        default="linear-regression",
        help="Algorithm model to execute"
    )
    parser.add_argument("--k", type=int, default=3, help="K value for KMeans or KNN")
    parser.add_argument("--max-depth", type=int, default=3, help="Max depth for Decision Tree")
    parser.add_argument("--standardize", action="store_true", default=True, help="Standardize variance for PCA")
    parser.add_argument(
        "--dataset",
        type=str,
        default="linear",
        help="Dataset manifold (linear, blobs, moons, circles, correlated, outliers, iris)"
    )

    args = parser.parse_args()

    if args.model == "linear-regression":
        run_linear_regression_cli(dataset_name=args.dataset if args.dataset != "linear" else "linear")
    elif args.model == "kmeans":
        run_kmeans_cli(k=args.k, dataset_name=args.dataset if args.dataset != "linear" else "blobs")
    elif args.model == "knn":
        run_knn_cli(k=args.k, dataset_name=args.dataset if args.dataset != "linear" else "moons")
    elif args.model == "decision-tree":
        run_decision_tree_cli(max_depth=args.max_depth, dataset_name=args.dataset if args.dataset != "linear" else "moons")
    elif args.model == "pca":
        run_pca_cli(standardize=args.standardize, dataset_name=args.dataset if args.dataset != "linear" else "correlated")


if __name__ == "__main__":
    main()
