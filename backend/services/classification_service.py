"""
Classification algorithms service — Logistic Regression, Random Forest, SVM, Naive Bayes.
All computations run locally via scikit-learn without external AI APIs.
"""
from __future__ import annotations

from typing import Any
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, log_loss

from services.lab_datasets import validate_2d_array


def _build_decision_mesh(model, X: np.ndarray, grid_size: int = 40):
    """Generate a 2-D decision boundary mesh for visual rendering."""
    x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
    y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5

    xx, yy = np.meshgrid(
        np.linspace(x_min, x_max, grid_size),
        np.linspace(y_min, y_max, grid_size)
    )
    grid_points = np.c_[xx.ravel(), yy.ravel()]

    try:
        preds = model.predict(grid_points).reshape(xx.shape)
        probs = (
            model.predict_proba(grid_points)[:, 1].reshape(xx.shape)
            if hasattr(model, "predict_proba")
            else None
        )
    except Exception:
        preds = np.zeros(xx.shape, dtype=int)
        probs = None

    return {
        "x_range": [round(float(x_min), 3), round(float(x_max), 3)],
        "y_range": [round(float(y_min), 3), round(float(y_max), 3)],
        "grid_size": grid_size,
        "predictions": np.round(preds, 1).tolist(),
        "probabilities": np.round(probs, 3).tolist() if probs is not None else None,
    }


def run_logistic_regression(
    data: list[list[float]],
    c_param: float = 1.0,
    max_iter: int = 100,
    penalty: str = "l2"
) -> dict[str, Any]:
    """Train scikit-learn LogisticRegression and return decision boundary & odds."""
    arr = validate_2d_array(data, "data")
    if arr.shape[1] < 3:
        raise ValueError("Each sample must have at least [x1, x2, label].")

    X = arr[:, :2]
    y = arr[:, 2].astype(int)

    c_val = max(0.01, min(float(c_param), 100.0))
    model = LogisticRegression(C=c_val, max_iter=max_iter, penalty=penalty, solver="lbfgs")
    model.fit(X, y)

    y_pred = model.predict(X)
    acc = float(accuracy_score(y, y_pred))

    try:
        y_prob = model.predict_proba(X)
        loss = float(log_loss(y, y_prob))
    except Exception:
        loss = 0.0

    coef = model.coef_[0].round(4).tolist()
    intercept = float(np.round(model.intercept_[0], 4))

    return {
        "accuracy": round(acc, 4),
        "log_loss": round(loss, 4),
        "coefficients": coef,
        "intercept": intercept,
        "formula": f"z = {coef[0]:.3f}·x₁ + {coef[1]:.3f}·x₂ + ({intercept:.3f})",
        "mesh": _build_decision_mesh(model, X),
        "classes": [int(c) for c in model.classes_],
    }


def run_random_forest(
    data: list[list[float]],
    n_estimators: int = 20,
    max_depth: int = 4,
    criterion: str = "gini"
) -> dict[str, Any]:
    """Train scikit-learn RandomForestClassifier and return ensemble variance & splits."""
    arr = validate_2d_array(data, "data")
    if arr.shape[1] < 3:
        raise ValueError("Each sample must have at least [x1, x2, label].")

    X = arr[:, :2]
    y = arr[:, 2].astype(int)

    n_trees = max(5, min(int(n_estimators), 100))
    depth = max(1, min(int(max_depth), 12))

    model = RandomForestClassifier(
        n_estimators=n_trees,
        max_depth=depth,
        criterion=criterion,
        random_state=42,
        oob_score=True if n_trees >= 15 else False
    )
    model.fit(X, y)

    acc = float(accuracy_score(y, model.predict(X)))
    importances = model.feature_importances_.round(4).tolist()
    oob = float(round(model.oob_score_, 4)) if hasattr(model, "oob_score_") and model.oob_score_ else None

    return {
        "accuracy": round(acc, 4),
        "n_estimators": n_trees,
        "max_depth": depth,
        "feature_importances": {"feature_1": importances[0], "feature_2": importances[1]},
        "oob_score": oob,
        "mesh": _build_decision_mesh(model, X),
    }


def run_svm(
    data: list[list[float]],
    c_param: float = 1.0,
    kernel: str = "rbf",
    gamma: str = "scale"
) -> dict[str, Any]:
    """Train scikit-learn SVC and return support vectors, margin, and boundary."""
    arr = validate_2d_array(data, "data")
    if arr.shape[1] < 3:
        raise ValueError("Each sample must have at least [x1, x2, label].")

    X = arr[:, :2]
    y = arr[:, 2].astype(int)

    c_val = max(0.01, min(float(c_param), 100.0))
    model = SVC(C=c_val, kernel=kernel, gamma=gamma, probability=True, random_state=42)
    model.fit(X, y)

    acc = float(accuracy_score(y, model.predict(X)))
    support_vectors = model.support_vectors_.round(3).tolist()

    return {
        "accuracy": round(acc, 4),
        "kernel": kernel,
        "c_param": c_val,
        "n_support_vectors": len(support_vectors),
        "support_vectors": support_vectors[:40],  # cap to top 40 for UI
        "mesh": _build_decision_mesh(model, X),
    }


def run_naive_bayes(
    data: list[list[float]],
    var_smoothing: float = 1e-9
) -> dict[str, Any]:
    """Train GaussianNB and return feature distribution parameters and posterior boundary."""
    arr = validate_2d_array(data, "data")
    if arr.shape[1] < 3:
        raise ValueError("Each sample must have at least [x1, x2, label].")

    X = arr[:, :2]
    y = arr[:, 2].astype(int)

    model = GaussianNB(var_smoothing=var_smoothing)
    model.fit(X, y)

    acc = float(accuracy_score(y, model.predict(X)))
    class_priors = model.class_prior_.round(4).tolist()
    theta = model.theta_.round(3).tolist()  # mean of each feature per class
    var = model.var_.round(3).tolist()      # variance of each feature per class

    return {
        "accuracy": round(acc, 4),
        "class_priors": class_priors,
        "feature_means": theta,
        "feature_variances": var,
        "mesh": _build_decision_mesh(model, X),
    }
