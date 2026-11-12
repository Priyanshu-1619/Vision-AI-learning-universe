"""Customer Churn Prediction Mission Service — Phase 9 AI Mission Mode.

Reads the local CSV dataset (`backend/datasets/customer_churn.csv`) with pandas and
executes real scikit-learn ColumnTransformer + Pipeline workflows.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier

DATASET_PATH = Path(__file__).resolve().parent.parent / "datasets" / "customer_churn.csv"

NUMERIC_FEATURES = [
    "tenure",
    "monthly_charges",
    "total_charges",
    "support_calls",
    "senior_customer",
]
CATEGORICAL_FEATURES = [
    "contract_type",
    "payment_method",
    "internet_service",
]
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
TARGET_COL = "churn"


def load_churn_dataframe() -> pd.DataFrame:
    """Load the local educational churn CSV dataset cleanly."""
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Local churn dataset not found at {DATASET_PATH}")
    return pd.read_csv(DATASET_PATH)


def get_churn_summary() -> dict[str, Any]:
    """Return real pandas dataset metadata, missing counts, stats, and EDA series."""
    df = load_churn_dataframe()
    n_samples, n_cols = df.shape

    dtypes = {col: str(df[col].dtype) for col in ALL_FEATURES + [TARGET_COL]}
    missing_counts = {col: int(df[col].isna().sum()) for col in ALL_FEATURES + [TARGET_COL]}

    stats: dict[str, dict[str, Any]] = {}
    for col in NUMERIC_FEATURES:
        s = df[col].dropna()
        stats[col] = {
            "type": "numeric",
            "dtype": str(df[col].dtype),
            "mean": round(float(s.mean()), 2),
            "std": round(float(s.std()), 2),
            "min": round(float(s.min()), 2),
            "max": round(float(s.max()), 2),
            "missing": int(df[col].isna().sum()),
        }
    for col in CATEGORICAL_FEATURES:
        vc = df[col].value_counts(dropna=False).to_dict()
        stats[col] = {
            "type": "categorical",
            "dtype": str(df[col].dtype),
            "unique": int(df[col].nunique()),
            "top": str(df[col].mode().iloc[0]),
            "counts": {str(k): int(v) for k, v in vc.items()},
            "missing": int(df[col].isna().sum()),
        }

    churn_no = int((df[TARGET_COL] == 0).sum())
    churn_yes = int((df[TARGET_COL] == 1).sum())

    # EDA chart aggregations computed dynamically via pandas
    contract_rates = (
        df.groupby("contract_type")[TARGET_COL]
        .agg(["count", "mean"])
        .reset_index()
        .to_dict(orient="records")
    )
    internet_rates = (
        df.groupby("internet_service")[TARGET_COL]
        .agg(["count", "mean"])
        .reset_index()
        .to_dict(orient="records")
    )
    payment_rates = (
        df.groupby("payment_method")[TARGET_COL]
        .agg(["count", "mean"])
        .reset_index()
        .to_dict(orient="records")
    )

    eda = {
        "contract_churn": [
            {
                "label": r["contract_type"],
                "count": int(r["count"]),
                "churn_rate": round(float(r["mean"]) * 100, 1),
            }
            for r in contract_rates
        ],
        "internet_churn": [
            {
                "label": r["internet_service"],
                "count": int(r["count"]),
                "churn_rate": round(float(r["mean"]) * 100, 1),
            }
            for r in internet_rates
        ],
        "payment_churn": [
            {
                "label": r["payment_method"],
                "count": int(r["count"]),
                "churn_rate": round(float(r["mean"]) * 100, 1),
            }
            for r in payment_rates
        ],
        "tenure_by_churn": {
            "stayed": df.loc[df[TARGET_COL] == 0, "tenure"].dropna().tolist(),
            "churned": df.loc[df[TARGET_COL] == 1, "tenure"].dropna().tolist(),
        },
        "charges_by_churn": {
            "stayed": df.loc[df[TARGET_COL] == 0, "monthly_charges"].dropna().tolist(),
            "churned": df.loc[df[TARGET_COL] == 1, "monthly_charges"].dropna().tolist(),
        },
        "support_calls_by_churn": {
            "stayed": df.loc[df[TARGET_COL] == 0, "support_calls"].dropna().tolist(),
            "churned": df.loc[df[TARGET_COL] == 1, "support_calls"].dropna().tolist(),
        },
    }

    # Replace NaN with None cleanly for JSON serialization in sample rows
    sample_df = df.head(15).replace({np.nan: None})
    sample_rows = sample_df.to_dict(orient="records")

    return {
        "feature_names": ALL_FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target": TARGET_COL,
        "n_samples": int(n_samples),
        "n_features": int(len(ALL_FEATURES)),
        "n_columns": int(n_cols),
        "dtypes": dtypes,
        "missing_counts": missing_counts,
        "total_missing": int(sum(missing_counts.values())),
        "stats": stats,
        "churn_distribution": {"Stayed (0)": churn_no, "Churned (1)": churn_yes},
        "churn_rate": round(float(churn_yes / max(1, n_samples)), 4),
        "eda": eda,
        "sample_rows": sample_rows,
    }


def _build_preprocessor(
    num_cols: list[str],
    cat_cols: list[str],
    categorical_encoding: str = "onehot",
    scale_numeric: bool = True,
) -> ColumnTransformer:
    """Build a proper sklearn ColumnTransformer avoiding leakage."""
    transformers: list[tuple[str, Any, list[str]]] = []

    if num_cols:
        num_steps: list[tuple[str, Any]] = [
            ("imputer", SimpleImputer(strategy="median"))
        ]
        if scale_numeric:
            num_steps.append(("scaler", StandardScaler()))
        transformers.append(("num", Pipeline(num_steps), num_cols))

    if cat_cols:
        encoder = (
            OneHotEncoder(handle_unknown="ignore", sparse_output=False)
            if categorical_encoding == "onehot"
            else OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
        )
        cat_steps: list[tuple[str, Any]] = [
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", encoder),
        ]
        transformers.append(("cat", Pipeline(cat_steps), cat_cols))

    return ColumnTransformer(transformers=transformers, remainder="drop")


def _build_classifier(
    algorithm: str,
    max_depth: int,
    n_neighbors: int,
    n_estimators: int,
    class_weight_balanced: bool,
):
    cw = "balanced" if class_weight_balanced else None
    if algorithm == "logistic":
        return LogisticRegression(max_iter=1000, class_weight=cw, random_state=42)
    if algorithm == "knn":
        return KNeighborsClassifier(
            n_neighbors=max(1, n_neighbors),
            weights="distance" if class_weight_balanced else "uniform",
        )
    if algorithm == "tree":
        return DecisionTreeClassifier(
            max_depth=max(1, max_depth), class_weight=cw, random_state=42
        )
    if algorithm == "forest":
        return RandomForestClassifier(
            n_estimators=max(10, n_estimators),
            max_depth=max(1, max_depth),
            class_weight=cw,
            random_state=42,
            n_jobs=1,
        )
    raise ValueError(
        f"Unknown algorithm '{algorithm}'. Valid: logistic, knn, tree, forest"
    )


def preview_cleaning(
    missing_strategy: str = "median_impute",
    categorical_encoding: str = "onehot",
    scale_numeric: bool = True,
) -> dict[str, Any]:
    """Run real preprocessing preview on a 70% training slice cleanly."""
    if missing_strategy not in ("median_impute", "drop_rows"):
        raise ValueError("missing_strategy must be 'median_impute' or 'drop_rows'")
    if categorical_encoding not in ("onehot", "ordinal"):
        raise ValueError("categorical_encoding must be 'onehot' or 'ordinal'")

    df = load_churn_dataframe()
    initial_rows = len(df)
    initial_missing = int(df.isna().sum().sum())

    if missing_strategy == "drop_rows":
        df_clean = df.dropna().reset_index(drop=True)
    else:
        df_clean = df.copy()

    rows_after = len(df_clean)
    dropped_rows = initial_rows - rows_after

    X = df_clean[ALL_FEATURES]
    y = df_clean[TARGET_COL].astype(int)
    X_train, _, _, _ = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )

    pre = _build_preprocessor(
        NUMERIC_FEATURES,
        CATEGORICAL_FEATURES,
        categorical_encoding=categorical_encoding,
        scale_numeric=scale_numeric,
    )
    X_tr_matrix = pre.fit_transform(X_train)
    out_names = [str(n) for n in pre.get_feature_names_out()]

    return {
        "initial_rows": int(initial_rows),
        "rows_after_cleaning": int(rows_after),
        "dropped_rows": int(dropped_rows),
        "initial_missing": int(initial_missing),
        "remaining_missing": 0,
        "encoded_feature_count": int(X_tr_matrix.shape[1]),
        "transformed_feature_names": out_names,
        "categorical_encoding": categorical_encoding,
        "scale_numeric": bool(scale_numeric),
        "missing_strategy": missing_strategy,
    }


def _aggregate_feature_importances(
    pipeline: Pipeline,
    num_cols: list[str],
    cat_cols: list[str],
    algorithm: str,
) -> dict[str, float]:
    """Aggregate transformed ColumnTransformer importances back to raw feature names."""
    pre: ColumnTransformer = pipeline.named_steps["preprocessor"]
    clf = pipeline.named_steps["classifier"]
    raw_cols = num_cols + cat_cols
    scores = {col: 0.0 for col in raw_cols}

    try:
        out_names = [str(n) for n in pre.get_feature_names_out()]
    except Exception:
        return {col: round(1.0 / max(1, len(raw_cols)), 4) for col in raw_cols}

    if algorithm in ("tree", "forest") and hasattr(clf, "feature_importances_"):
        raw_weights = clf.feature_importances_
    elif algorithm == "logistic" and hasattr(clf, "coef_"):
        coef = np.abs(clf.coef_[0])
        total = float(coef.sum()) or 1.0
        raw_weights = coef / total
    else:
        return {col: round(1.0 / max(1, len(raw_cols)), 4) for col in raw_cols}

    for name, w in zip(out_names, raw_weights):
        # Names look like "num__tenure" or "cat__contract_type_Month-to-month"
        clean = name.split("__", 1)[-1]
        matched = None
        for col in raw_cols:
            if clean == col or clean.startswith(f"{col}_"):
                matched = col
                break
        if matched:
            scores[matched] += float(w)

    total_score = sum(scores.values()) or 1.0
    return {k: round(v / total_score, 4) for k, v in scores.items()}


def _fit_pipeline(
    algorithm: str = "logistic",
    max_depth: int = 4,
    n_neighbors: int = 5,
    n_estimators: int = 60,
    test_size: float = 0.3,
    selected_features: list[str] | None = None,
    missing_strategy: str = "median_impute",
    categorical_encoding: str = "onehot",
    scale_numeric: bool = True,
    class_weight_balanced: bool = False,
):
    df = load_churn_dataframe()
    features = selected_features if selected_features else ALL_FEATURES
    invalid = [f for f in features if f not in ALL_FEATURES]
    if invalid:
        raise ValueError(f"Unknown features: {invalid}. Valid: {ALL_FEATURES}")
    if len(features) < 1:
        raise ValueError("Must select at least 1 feature.")
    if missing_strategy not in ("median_impute", "drop_rows"):
        raise ValueError("missing_strategy must be 'median_impute' or 'drop_rows'")
    if categorical_encoding not in ("onehot", "ordinal"):
        raise ValueError("categorical_encoding must be 'onehot' or 'ordinal'")

    if missing_strategy == "drop_rows":
        df = df.dropna(subset=features + [TARGET_COL]).reset_index(drop=True)

    X = df[features]
    y = df[TARGET_COL].astype(int)

    num_cols = [f for f in features if f in NUMERIC_FEATURES]
    cat_cols = [f for f in features if f in CATEGORICAL_FEATURES]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )

    preprocessor = _build_preprocessor(
        num_cols=num_cols,
        cat_cols=cat_cols,
        categorical_encoding=categorical_encoding,
        scale_numeric=scale_numeric,
    )
    classifier = _build_classifier(
        algorithm=algorithm,
        max_depth=max_depth,
        n_neighbors=n_neighbors,
        n_estimators=n_estimators,
        class_weight_balanced=class_weight_balanced,
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier),
    ])
    pipeline.fit(X_train, y_train)
    return pipeline, X_train, X_test, y_train, y_test, num_cols, cat_cols, features


def train_churn_model(
    algorithm: str = "logistic",
    max_depth: int = 4,
    n_neighbors: int = 5,
    n_estimators: int = 60,
    test_size: float = 0.3,
    selected_features: list[str] | None = None,
    missing_strategy: str = "median_impute",
    categorical_encoding: str = "onehot",
    scale_numeric: bool = True,
    class_weight_balanced: bool = False,
) -> dict[str, Any]:
    """Train a leakage-free ColumnTransformer + Pipeline churn classifier."""
    pipeline, X_train, X_test, y_train, y_test, num_cols, cat_cols, features = _fit_pipeline(
        algorithm=algorithm,
        max_depth=max_depth,
        n_neighbors=n_neighbors,
        n_estimators=n_estimators,
        test_size=test_size,
        selected_features=selected_features,
        missing_strategy=missing_strategy,
        categorical_encoding=categorical_encoding,
        scale_numeric=scale_numeric,
        class_weight_balanced=class_weight_balanced,
    )

    y_pred = pipeline.predict(X_test)
    y_train_pred = pipeline.predict(X_train)

    acc = round(float(accuracy_score(y_test, y_pred)), 4)
    train_acc = round(float(accuracy_score(y_train, y_train_pred)), 4)
    prec = round(float(precision_score(y_test, y_pred, zero_division=0)), 4)
    rec = round(float(recall_score(y_test, y_pred, zero_division=0)), 4)
    f1 = round(float(f1_score(y_test, y_pred, zero_division=0)), 4)
    cm = confusion_matrix(y_test, y_pred).tolist()

    importances = _aggregate_feature_importances(
        pipeline, num_cols=num_cols, cat_cols=cat_cols, algorithm=algorithm
    )

    return {
        "accuracy": acc,
        "train_accuracy": train_acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "confusion_matrix": cm,
        "feature_importances": importances,
        "pipeline_steps": [
            f"SimpleImputer ({missing_strategy})",
            f"Encoding ({categorical_encoding}) + {'StandardScaler' if scale_numeric else 'Unscaled'}",
            f"Classifier ({algorithm}{', balanced' if class_weight_balanced else ''})",
        ],
        "model_params": {
            "algorithm": algorithm,
            "max_depth": max_depth,
            "n_neighbors": n_neighbors,
            "n_estimators": n_estimators,
            "test_size": test_size,
            "selected_features": features,
            "missing_strategy": missing_strategy,
            "categorical_encoding": categorical_encoding,
            "scale_numeric": scale_numeric,
            "class_weight_balanced": class_weight_balanced,
        },
    }


def run_debug_demo(scenario: str) -> dict[str, Any]:
    """Run real scikit-learn demonstrations of common ML debugging pitfalls on the churn dataset."""
    df = load_churn_dataframe()
    X = df[ALL_FEATURES]
    y = df[TARGET_COL].astype(int)

    if scenario == "overfitting":
        # Unconstrained deep tree memorizes training data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )
        pre = _build_preprocessor(NUMERIC_FEATURES, CATEGORICAL_FEATURES, "onehot", False)
        deep = Pipeline([
            ("preprocessor", pre),
            ("clf", DecisionTreeClassifier(max_depth=None, min_samples_split=2, random_state=42)),
        ])
        deep.fit(X_train, y_train)
        train_acc = round(float(deep.score(X_train, y_train)), 4)
        test_acc = round(float(deep.score(X_test, y_test)), 4)
        return {
            "scenario": "overfitting",
            "title": "Overfitting Tree (max_depth=None)",
            "metrics": {
                "train_accuracy": train_acc,
                "test_accuracy": test_acc,
                "gap": round(train_acc - test_acc, 4),
            },
            "code_snippet": (
                "clf = DecisionTreeClassifier(max_depth=None, min_samples_split=2)\n"
                "clf.fit(X_train, y_train)\n"
                f"# Train Accuracy: {train_acc:.1%}  vs  Test Accuracy: {test_acc:.1%}"
            ),
        }

    if scenario == "leakage":
        # Deliberate data leakage demo: fit StandardScaler & Imputer on ALL rows BEFORE split
        pre_leaky = _build_preprocessor(NUMERIC_FEATURES, CATEGORICAL_FEATURES, "onehot", True)
        X_leaked_all = pre_leaky.fit_transform(X)  # ← leaks test distribution & imputation!
        X_tr, X_te, y_tr, y_te = train_test_split(
            X_leaked_all, y, test_size=0.3, random_state=42, stratify=y
        )
        clf_leaked = LogisticRegression(max_iter=1000, random_state=42).fit(X_tr, y_tr)
        leaked_acc = round(float(clf_leaked.score(X_te, y_te)), 4)

        # Proper Pipeline fitted cleanly inside training split only
        clean_res = train_churn_model(algorithm="logistic", test_size=0.3)
        return {
            "scenario": "leakage",
            "title": "Preprocessing Before Split (Data Leakage)",
            "metrics": {
                "leaked_pipeline_acc": leaked_acc,
                "clean_pipeline_acc": clean_res["accuracy"],
                "full_mean_used": round(float(df["monthly_charges"].mean()), 2),
                "train_only_mean": round(float(df.iloc[:280]["monthly_charges"].mean()), 2),
            },
            "code_snippet": (
                "# BUG: fitted on full X before split!\n"
                "X_scaled = preprocessor.fit_transform(X)  # test stats leak!\n"
                "X_train, X_test = train_test_split(X_scaled, y)\n"
                "# FIX: Pipeline([('pre', preprocessor), ('clf', model)]).fit(X_train, y_train)"
            ),
        }

    if scenario == "imbalance":
        # Majority class baseline demonstrates the Accuracy Paradox
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )
        dummy = DummyClassifier(strategy="most_frequent").fit(X_train, y_train)
        y_pred = dummy.predict(X_test)
        acc = round(float(accuracy_score(y_test, y_pred)), 4)
        rec = round(float(recall_score(y_test, y_pred, zero_division=0)), 4)
        prec = round(float(precision_score(y_test, y_pred, zero_division=0)), 4)
        f1 = round(float(f1_score(y_test, y_pred, zero_division=0)), 4)
        return {
            "scenario": "imbalance",
            "title": "Imbalanced Majority Predictor (Accuracy Paradox)",
            "metrics": {
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1": f1,
            },
            "code_snippet": (
                "dummy = DummyClassifier(strategy='most_frequent').fit(X_train, y_train)\n"
                f"# Accuracy: {acc:.1%}, but Recall: {rec:.1%} (catches ZERO churners!)"
            ),
        }

    raise ValueError("scenario must be 'overfitting', 'leakage', or 'imbalance'")


def predict_customer(
    customer: dict[str, Any],
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Fit configured sklearn Pipeline and predict churn probability for a single customer."""
    cfg = config or {}
    pipeline, _, _, _, _, _, _, features = _fit_pipeline(
        algorithm=cfg.get("algorithm", "forest"),
        max_depth=int(cfg.get("max_depth", 5)),
        n_neighbors=int(cfg.get("n_neighbors", 5)),
        n_estimators=int(cfg.get("n_estimators", 60)),
        test_size=float(cfg.get("test_size", 0.3)),
        selected_features=cfg.get("selected_features") or None,
        missing_strategy=cfg.get("missing_strategy", "median_impute"),
        categorical_encoding=cfg.get("categorical_encoding", "onehot"),
        scale_numeric=bool(cfg.get("scale_numeric", True)),
        class_weight_balanced=bool(cfg.get("class_weight_balanced", False)),
    )

    tenure = float(customer.get("tenure", 12))
    monthly_charges = float(customer.get("monthly_charges", 70.0))
    row = {
        "tenure": tenure,
        "monthly_charges": monthly_charges,
        "total_charges": float(customer.get("total_charges", tenure * monthly_charges)),
        "contract_type": str(customer.get("contract_type", "Month-to-month")),
        "payment_method": str(customer.get("payment_method", "Electronic check")),
        "internet_service": str(customer.get("internet_service", "Fiber optic")),
        "support_calls": float(customer.get("support_calls", 2)),
        "senior_customer": int(customer.get("senior_customer", 0)),
    }
    row_df = pd.DataFrame([{col: row[col] for col in features}])

    pred_class = int(pipeline.predict(row_df)[0])
    if hasattr(pipeline, "predict_proba"):
        proba = float(pipeline.predict_proba(row_df)[0][1])
    else:
        proba = float(pred_class)

    risk_tier = "High Risk" if proba >= 0.6 else "Moderate Risk" if proba >= 0.35 else "Low Risk"
    return {
        "predicted_churn": pred_class,
        "churn_probability": round(proba, 4),
        "stay_probability": round(1.0 - proba, 4),
        "risk_tier": risk_tier,
        "algorithm_used": cfg.get("algorithm", "forest"),
    }
