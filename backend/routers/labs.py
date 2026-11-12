"""Lab computation endpoints — Phase 3 AI Laboratory."""
from fastapi import APIRouter, HTTPException, Query

from models.concept import (
    DatasetResponse,
    DecisionTreeRequest,
    DecisionTreeResponse,
    KMeansRequest,
    KMeansResponse,
    KNNRequest,
    KNNResponse,
    LinearRegressionRequest,
    LinearRegressionResponse,
    PCARequest,
    PCAResponse,
)
from services.lab_service import (
    generate_dataset,
    run_decision_tree,
    run_kmeans,
    run_knn,
    run_linear_regression,
    run_pca,
)

router = APIRouter(prefix="/api/labs", tags=["labs"])


@router.post("/linear-regression", response_model=LinearRegressionResponse)
async def linear_regression_lab(req: LinearRegressionRequest):
    """Run scikit-learn LinearRegression + Gradient Descent trace on 1-D (x, y) data."""
    try:
        result = run_linear_regression(req.data, req.params)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return LinearRegressionResponse(**result)


@router.post("/kmeans", response_model=KMeansResponse)
async def kmeans_lab(req: KMeansRequest):
    """Run scikit-learn KMeans and return step-by-step iteration history."""
    try:
        result = run_kmeans(
            data=req.data,
            k=req.k,
            init_method=req.init_method,
            seed=req.seed,
            max_iter=req.max_iter,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return KMeansResponse(**result)


@router.post("/knn", response_model=KNNResponse)
async def knn_lab(req: KNNRequest):
    """Run scikit-learn KNeighborsClassifier with 2-D decision boundary."""
    try:
        result = run_knn(
            data=req.data,
            labels=req.labels,
            query=req.query,
            k=req.k,
            metric=req.metric,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return KNNResponse(**result)


@router.post("/decision-tree", response_model=DecisionTreeResponse)
async def decision_tree_lab(req: DecisionTreeRequest):
    """Train scikit-learn DecisionTreeClassifier and return tree structure & boundary."""
    try:
        result = run_decision_tree(
            data=req.data,
            labels=req.labels,
            max_depth=req.maxDepth,
            min_samples_split=req.minSamplesSplit,
            criterion=req.criterion,
            feature_names=req.featureNames,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return DecisionTreeResponse(**result)


@router.post("/pca", response_model=PCAResponse)
async def pca_lab(req: PCARequest):
    """Run scikit-learn PCA with optional StandardScaler standardization."""
    try:
        result = run_pca(
            data=req.data,
            n_components=req.nComponents,
            standardize=req.standardize,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return PCAResponse(**result)


@router.get("/dataset/{name}", response_model=DatasetResponse)
async def get_dataset(
    name: str,
    n_samples: int = Query(default=200, ge=30, le=1000),
    noise: float = Query(default=0.1, ge=0.0, le=1.0),
    seed: int = Query(default=42, ge=0, le=10000),
    all_features: bool = Query(default=False),
):
    """Generate a synthetic or built-in local dataset by name."""
    try:
        result = generate_dataset(
            name=name,
            n_samples=n_samples,
            noise=noise,
            seed=seed,
            all_features=all_features,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return DatasetResponse(**result)
