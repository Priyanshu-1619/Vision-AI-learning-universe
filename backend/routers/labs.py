"""Lab computation endpoints — AI Laboratory ML & Deep Learning Algorithms."""
from __future__ import annotations

from typing import Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

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
    run_logistic_regression,
    run_random_forest,
    run_svm,
    run_naive_bayes,
    run_gradient_descent,
    run_perceptron,
    run_cnn_kernel,
    run_autoencoder,
)

router = APIRouter(prefix="/api/labs", tags=["labs"])


# ── Additional Request Models ──────────────────────────────────────

class LogisticRegressionRequest(BaseModel):
    data: list[list[float]] = Field(default_factory=list)
    c_param: float = Field(default=1.0, alias="cParam")
    max_iter: int = Field(default=100, alias="maxIter")
    penalty: str = "l2"

    model_config = {"populate_by_name": True}


class RandomForestRequest(BaseModel):
    data: list[list[float]] = Field(default_factory=list)
    n_estimators: int = Field(default=20, alias="nEstimators")
    max_depth: int = Field(default=4, alias="maxDepth")
    criterion: str = "gini"

    model_config = {"populate_by_name": True}


class SVMRequest(BaseModel):
    data: list[list[float]] = Field(default_factory=list)
    c_param: float = Field(default=1.0, alias="cParam")
    kernel: str = "rbf"
    gamma: str = "scale"

    model_config = {"populate_by_name": True}


class NaiveBayesRequest(BaseModel):
    data: list[list[float]] = Field(default_factory=list)
    var_smoothing: float = Field(default=1e-9, alias="varSmoothing")

    model_config = {"populate_by_name": True}


class GradientDescentRequest(BaseModel):
    function_type: str = Field(default="quadratic", alias="functionType")
    learning_rate: float = Field(default=0.1, alias="learningRate")
    epochs: int = 25
    momentum: float = 0.0
    start_point: list[float] = Field(default_factory=lambda: [4.0, 3.0], alias="startPoint")

    model_config = {"populate_by_name": True}


class PerceptronRequest(BaseModel):
    data: list[list[float]] = Field(default_factory=list)
    learning_rate: float = Field(default=0.1, alias="learningRate")
    max_epochs: int = Field(default=25, alias="maxEpochs")

    model_config = {"populate_by_name": True}


class CNNRequest(BaseModel):
    image_matrix: list[list[float]] | None = Field(default=None, alias="imageMatrix")
    kernel_type: str = Field(default="sobel_x", alias="kernelType")
    stride: int = 1
    padding: int = 0

    model_config = {"populate_by_name": True}


class AutoencoderRequest(BaseModel):
    data: list[list[float]] = Field(default_factory=list)
    latent_dim: int = Field(default=1, alias="latentDim")

    model_config = {"populate_by_name": True}


# ── Existing Lab Endpoints ──────────────────────────────────────────

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
    """Run scikit-learn DecisionTreeClassifier with split-tree structure and 2-D boundary."""
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


# ── Newly Added Lab Algorithms ───────────────────────────────────────

@router.post("/logistic-regression")
async def logistic_regression_lab(req: LogisticRegressionRequest):
    """Run scikit-learn LogisticRegression with decision boundary & odds ratio."""
    try:
        return run_logistic_regression(
            data=req.data,
            c_param=req.c_param,
            max_iter=req.max_iter,
            penalty=req.penalty,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/random-forest")
async def random_forest_lab(req: RandomForestRequest):
    """Run scikit-learn RandomForestClassifier with ensemble variance & feature importances."""
    try:
        return run_random_forest(
            data=req.data,
            n_estimators=req.n_estimators,
            max_depth=req.max_depth,
            criterion=req.criterion,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/svm")
async def svm_lab(req: SVMRequest):
    """Run scikit-learn Support Vector Classifier (SVC) with support vector margin."""
    try:
        return run_svm(
            data=req.data,
            c_param=req.c_param,
            kernel=req.kernel,
            gamma=req.gamma,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/naive-bayes")
async def naive_bayes_lab(req: NaiveBayesRequest):
    """Run scikit-learn GaussianNB with class priors and posterior probabilities."""
    try:
        return run_naive_bayes(
            data=req.data,
            var_smoothing=req.var_smoothing,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/gradient-descent")
async def gradient_descent_lab(req: GradientDescentRequest):
    """Simulate 2D analytical loss surface Gradient Descent with momentum."""
    try:
        return run_gradient_descent(
            function_type=req.function_type,
            learning_rate=req.learning_rate,
            epochs=req.epochs,
            momentum=req.momentum,
            start_point=(req.start_point[0], req.start_point[1]) if len(req.start_point) >= 2 else (4.0, 3.0),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/perceptron")
async def perceptron_lab(req: PerceptronRequest):
    """Train single-layer Perceptron with step function activation epoch-by-epoch."""
    try:
        return run_perceptron(
            data=req.data,
            learning_rate=req.learning_rate,
            max_epochs=req.max_epochs,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/cnn")
async def cnn_lab(req: CNNRequest):
    """Run 2D spatial convolution and max pooling with Sobel/Laplacian/Gaussian kernels."""
    try:
        return run_cnn_kernel(
            image_matrix=req.image_matrix,
            kernel_type=req.kernel_type,
            stride=req.stride,
            padding=req.padding,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/autoencoder")
async def autoencoder_lab(req: AutoencoderRequest):
    """Run bottleneck autoencoder latent compression and reconstruction."""
    try:
        return run_autoencoder(
            data=req.data,
            latent_dim=req.latent_dim,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ── Dataset Generator Endpoint ──────────────────────────────────────

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
