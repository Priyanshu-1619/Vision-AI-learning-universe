"""Decision Tree Classification lab service using scikit-learn DecisionTreeClassifier."""
from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

from services.lab_datasets import validate_2d_array

SUPPORTED_CRITERIA = {"gini", "entropy", "log_loss"}


def _extract_tree_structure(
    clf: DecisionTreeClassifier, feature_names: list[str]
) -> dict[str, Any]:
    """Recursively extract actual trained DecisionTreeClassifier nodes and info gain."""
    tree = clf.tree_
    classes = [int(c) for c in clf.classes_.tolist()]

    def build_node(node_id: int, depth: int) -> dict[str, Any]:
        left_id = int(tree.children_left[node_id])
        right_id = int(tree.children_right[node_id])
        is_leaf = left_id == right_id

        counts = [int(v) for v in tree.value[node_id][0].tolist()]
        n_samples = int(tree.n_node_samples[node_id])
        impurity = round(float(tree.impurity[node_id]), 4)
        pred_idx = int(np.argmax(tree.value[node_id][0]))
        predicted_class = classes[pred_idx] if pred_idx < len(classes) else pred_idx

        if is_leaf:
            return {
                "node_id": int(node_id),
                "depth": depth,
                "is_leaf": True,
                "feature_idx": None,
                "feature_name": None,
                "threshold": None,
                "impurity": impurity,
                "info_gain": 0.0,
                "n_samples": n_samples,
                "value": counts,
                "predicted_class": predicted_class,
                "left": None,
                "right": None,
            }

        f_idx = int(tree.feature[node_id])
        f_name = feature_names[f_idx] if f_idx < len(feature_names) else f"x{f_idx + 1}"
        threshold = round(float(tree.threshold[node_id]), 4)

        n_left = int(tree.n_node_samples[left_id])
        n_right = int(tree.n_node_samples[right_id])
        imp_left = float(tree.impurity[left_id])
        imp_right = float(tree.impurity[right_id])

        # Exact impurity decrease (information gain) computed directly from sklearn's tree
        weighted_child_imp = (
            (n_left / max(1, n_samples)) * imp_left
            + (n_right / max(1, n_samples)) * imp_right
        )
        info_gain = round(max(0.0, float(tree.impurity[node_id]) - weighted_child_imp), 4)

        return {
            "node_id": int(node_id),
            "depth": depth,
            "is_leaf": False,
            "feature_idx": f_idx,
            "feature_name": f_name,
            "threshold": threshold,
            "impurity": impurity,
            "info_gain": info_gain,
            "n_samples": n_samples,
            "value": counts,
            "predicted_class": predicted_class,
            "left": build_node(left_id, depth + 1),
            "right": build_node(right_id, depth + 1),
        }

    return build_node(0, 0)


def _compute_boundary_2d(
    clf: DecisionTreeClassifier, X: np.ndarray, resolution: int = 44
) -> dict[str, Any] | None:
    """Compute a 2-D orthogonal decision boundary grid for Plotly heatmap/contour."""
    if X.shape[1] != 2 or len(X) == 0:
        return None

    x_min, x_max = float(X[:, 0].min()), float(X[:, 0].max())
    y_min, y_max = float(X[:, 1].min()), float(X[:, 1].max())
    pad_x = max(0.35, (x_max - x_min) * 0.12)
    pad_y = max(0.35, (y_max - y_min) * 0.12)

    xs = np.linspace(x_min - pad_x, x_max + pad_x, resolution)
    ys = np.linspace(y_min - pad_y, y_max + pad_y, resolution)
    xx, yy = np.meshgrid(xs, ys)
    grid_points = np.column_stack([xx.ravel(), yy.ravel()])

    preds = clf.predict(grid_points).reshape(resolution, resolution)

    return {
        "x_grid": [round(float(v), 4) for v in xs.tolist()],
        "y_grid": [round(float(v), 4) for v in ys.tolist()],
        "z_classes": preds.tolist(),
    }


def run_decision_tree(
    data: list[list[float]],
    labels: list[int],
    max_depth: int = 3,
    min_samples_split: int = 2,
    criterion: str = "gini",
    feature_names: list[str] | None = None,
) -> dict[str, Any]:
    """Train scikit-learn DecisionTreeClassifier and return boundary, tree structure, & metrics."""
    if max_depth <= 0 or max_depth > 15:
        raise ValueError("'max_depth' must be an integer between 1 and 15.")
    if min_samples_split < 2:
        raise ValueError("'min_samples_split' must be at least 2.")
    if criterion not in SUPPORTED_CRITERIA:
        raise ValueError(
            f"Unsupported criterion '{criterion}'. Valid: {sorted(SUPPORTED_CRITERIA)}"
        )
    if not data or not labels:
        raise ValueError("Input 'data' and 'labels' must be non-empty.")
    if len(data) != len(labels):
        raise ValueError("'data' and 'labels' must have equal length.")
    if len(data) < 10:
        raise ValueError("Need at least 10 samples for train/test evaluation.")

    X = validate_2d_array(data)
    y = np.array(labels, dtype=int)
    f_names = feature_names or [f"x{i + 1}" for i in range(X.shape[1])]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.3,
        random_state=42,
        stratify=y if len(np.unique(y)) > 1 else None,
    )

    clf = DecisionTreeClassifier(
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        criterion=criterion,
        random_state=42,
    )
    clf.fit(X_train, y_train)

    train_acc = round(float(clf.score(X_train, y_train)), 4)
    test_acc = round(float(clf.score(X_test, y_test)), 4)

    # Depth vs accuracy curve
    depth_accuracy: list[dict[str, Any]] = []
    for d in range(1, max(max_depth, 6) + 1):
        t = DecisionTreeClassifier(
            max_depth=d,
            min_samples_split=min_samples_split,
            criterion=criterion,
            random_state=42,
        )
        t.fit(X_train, y_train)
        depth_accuracy.append({
            "depth": d,
            "train_acc": round(float(t.score(X_train, y_train)), 4),
            "test_acc": round(float(t.score(X_test, y_test)), 4),
        })

    tree_root = _extract_tree_structure(clf, f_names)
    boundary = _compute_boundary_2d(clf, X, resolution=44)

    return {
        "accuracy": test_acc,
        "train_accuracy": train_acc,
        "feature_importances": [
            round(float(v), 4) for v in clf.feature_importances_.tolist()
        ],
        "tree_depth": int(clf.get_depth()),
        "n_leaves": int(clf.get_n_leaves()),
        "criterion": criterion,
        "min_samples_split": min_samples_split,
        "depth_accuracy": depth_accuracy,
        "tree_structure": tree_root,
        "boundary": boundary,
    }

