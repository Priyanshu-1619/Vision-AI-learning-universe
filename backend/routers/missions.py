"""Mission endpoints — Phase 9 AI Mission Mode (Customer Churn Prediction)."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.churn_service import (
    get_churn_summary,
    predict_customer,
    preview_cleaning,
    run_debug_demo,
    train_churn_model,
)

router = APIRouter(prefix="/api/missions", tags=["missions"])


# ── Request/Response models ────────────────────────────────

class CleanPreviewRequest(BaseModel):
    missing_strategy: str = "median_impute"
    categorical_encoding: str = "onehot"
    scale_numeric: bool = True


class MissionTrainRequest(BaseModel):
    algorithm: str = "logistic"
    max_depth: int = Field(default=4, ge=1, le=12)
    n_neighbors: int = Field(default=5, ge=1, le=25)
    n_estimators: int = Field(default=60, ge=10, le=200)
    test_size: float = Field(default=0.3, ge=0.1, le=0.5)
    selected_features: list[str] = Field(default_factory=list)
    missing_strategy: str = "median_impute"
    categorical_encoding: str = "onehot"
    scale_numeric: bool = True
    class_weight_balanced: bool = False


class MissionTrainResponse(BaseModel):
    accuracy: float
    train_accuracy: float
    precision: float
    recall: float
    f1: float
    confusion_matrix: list[list[int]]
    feature_importances: dict[str, float]
    pipeline_steps: list[str]
    model_params: dict[str, Any]


class DebugDemoRequest(BaseModel):
    scenario: str


class PredictCustomerRequest(BaseModel):
    customer: dict[str, Any]
    config: dict[str, Any] = Field(default_factory=dict)


# ── Endpoints ──────────────────────────────────────────────

@router.get("/churn/dataset")
async def get_churn_dataset():
    """Return local CSV churn dataset metadata, missing values, stats, & EDA data."""
    try:
        return get_churn_summary()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/churn/clean-preview")
async def churn_clean_preview(req: CleanPreviewRequest):
    """Run real pandas + ColumnTransformer preprocessing preview."""
    try:
        return preview_cleaning(
            missing_strategy=req.missing_strategy,
            categorical_encoding=req.categorical_encoding,
            scale_numeric=req.scale_numeric,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/churn/train", response_model=MissionTrainResponse)
async def train_churn(req: MissionTrainRequest):
    """Train a leakage-free ColumnTransformer + Pipeline churn classifier."""
    if req.algorithm not in ("logistic", "knn", "tree", "forest"):
        raise HTTPException(
            status_code=400,
            detail="algorithm must be one of: logistic, knn, tree, forest",
        )

    try:
        result = train_churn_model(
            algorithm=req.algorithm,
            max_depth=req.max_depth,
            n_neighbors=req.n_neighbors,
            n_estimators=req.n_estimators,
            test_size=req.test_size,
            selected_features=req.selected_features or None,
            missing_strategy=req.missing_strategy,
            categorical_encoding=req.categorical_encoding,
            scale_numeric=req.scale_numeric,
            class_weight_balanced=req.class_weight_balanced,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return MissionTrainResponse(**result)


@router.post("/churn/debug-demo")
async def churn_debug_demo(req: DebugDemoRequest):
    """Execute real sklearn overfitting, data leakage, or imbalance diagnostics."""
    try:
        return run_debug_demo(req.scenario)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/churn/predict")
async def churn_predict_customer(req: PredictCustomerRequest):
    """Run live inference with the learner's configured sklearn Pipeline."""
    try:
        return predict_customer(customer=req.customer, config=req.config)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
