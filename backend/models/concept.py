"""Pydantic models for concepts and ML laboratory endpoints."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class MathematicsInfo(BaseModel):
    formulas: list[str] = Field(default_factory=list)
    explanation: str = ""


class VisualizationInfo(BaseModel):
    type: str = ""
    parameters: dict[str, Any] = Field(default_factory=dict)


class Concept(BaseModel):
    id: str
    title: str
    category: str
    difficulty: str  # Beginner | Intermediate | Advanced
    domain: str = "machine-learning"  # data-science | machine-learning | deep-learning
    level: str = "intermediate"  # basic | intermediate | advanced
    icon: str
    color: str
    prerequisites: list[str] = Field(default_factory=list)
    definition: str
    beginnerExplanation: str = ""
    example: str = ""
    mathematics: MathematicsInfo = Field(default_factory=MathematicsInfo)
    visualization: VisualizationInfo = Field(default_factory=VisualizationInfo)
    experiments: list[Any] = Field(default_factory=list)
    breakIt: list[Any] = Field(default_factory=list)
    challenges: list[Any] = Field(default_factory=list)
    debugging: list[Any] = Field(default_factory=list)
    relatedConcepts: list[str] = Field(default_factory=list)
    nextConcepts: list[str] = Field(default_factory=list)


class GraphNode(BaseModel):
    id: str
    title: str
    category: str
    difficulty: str
    icon: str
    color: str


class GraphEdge(BaseModel):
    source: str
    target: str
    type: str  # "prerequisite" | "related"


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class CategoryCount(BaseModel):
    category: str
    count: int
    color: str


# ── Lab models ─────────────────────────────────────────────

class LinearRegressionRequest(BaseModel):
    data: dict[str, Any] = Field(default_factory=dict)
    params: dict[str, Any] = Field(default_factory=dict)


class LinearRegressionResponse(BaseModel):
    coefficients: list[float] = Field(default_factory=list)
    slope: float = 0.0
    intercept: float = 0.0
    predictions: list[float] = Field(default_factory=list)
    actual: list[float] = Field(default_factory=list)
    residuals: list[float] = Field(default_factory=list)
    metrics: dict[str, float] = Field(default_factory=dict)
    gd_history: list[dict[str, float]] = Field(default_factory=list)


class KMeansRequest(BaseModel):
    data: list[list[float]] = Field(default_factory=list)
    k: int = 3
    init_method: str = Field(default="k-means++", alias="initMethod")
    seed: int = 42
    max_iter: int = Field(default=15, alias="maxIter")

    model_config = {"populate_by_name": True}


class KMeansResponse(BaseModel):
    clusters: list[int] = Field(default_factory=list)
    centroids: list[list[float]] = Field(default_factory=list)
    inertia: float = 0.0
    n_iter: int = 0
    converged: bool = True
    iterations: list[dict[str, Any]] = Field(default_factory=list)


class KNNRequest(BaseModel):
    data: list[list[float]] = Field(default_factory=list)
    labels: list[int] = Field(default_factory=list)
    query: list[float] = Field(default_factory=list)
    k: int = 5
    metric: str = "euclidean"


class KNNResponse(BaseModel):
    predicted_class: int
    neighbors: list[int]
    neighbor_distances: list[float]
    class_probabilities: dict[str, float]
    train_accuracy: float = 0.0
    validation_accuracy: float = 0.0
    metric: str = "euclidean"
    boundary: dict[str, Any] | None = None


class DecisionTreeRequest(BaseModel):
    data: list[list[float]] = Field(default_factory=list)
    labels: list[int] = Field(default_factory=list)
    maxDepth: int = Field(default=3, alias="maxDepth")
    minSamplesSplit: int = Field(default=2, alias="minSamplesSplit")
    criterion: str = "gini"
    featureNames: list[str] | None = Field(default=None, alias="featureNames")

    model_config = {"populate_by_name": True}


class DecisionTreeResponse(BaseModel):
    accuracy: float
    train_accuracy: float = 0.0
    feature_importances: list[float]
    tree_depth: int
    n_leaves: int
    criterion: str = "gini"
    min_samples_split: int = 2
    depth_accuracy: list[dict[str, Any]]
    tree_structure: dict[str, Any] | None = None
    boundary: dict[str, Any] | None = None


class PCARequest(BaseModel):
    data: list[list[float]] = Field(default_factory=list)
    nComponents: int = Field(default=2, alias="nComponents")
    standardize: bool = True

    model_config = {"populate_by_name": True}


class PCAResponse(BaseModel):
    projected: list[list[float]]
    prepared_data: list[list[float]] = Field(default_factory=list)
    explained_variance: list[float] = Field(default_factory=list)
    explained_variance_ratio: list[float]
    components: list[list[float]]
    cumulative_variance: list[float]
    full_explained_variance: list[float] = Field(default_factory=list)
    full_explained_variance_ratio: list[float] = Field(default_factory=list)
    mean: list[float] = Field(default_factory=list)
    standardized: bool = True


class DatasetResponse(BaseModel):
    data: list[list[float]]
    labels: list[int]
    feature_names: list[str]
    name: str
    n_samples: int
    n_features: int
