// Configuration registry for AI Laboratory modules (Phase 3)

export const LABS = [
  {
    id: 'linear-regression',
    title: 'Linear Regression',
    icon: '📈',
    badge: 'Supervised · Regression',
    description:
      'Fit an optimal linear hyperplane y = mx + b minimizing Mean Squared Error via scikit-learn OLS, inspect residuals, and watch Gradient Descent converge.',
    conceptId: 'linear-regression',
    defaultDataset: 'linear',
    datasets: [
      { value: 'linear', label: 'Linear Cloud (y = 0.85x + 0.35 + ε)' },
      { value: 'outliers', label: 'Noisy with Outliers (8% extreme)' },
    ],
    steps: [
      'Generate/select 2-D continuous sample pairs (xᵢ, yᵢ)',
      'Solve Normal Equations / SVD via sklearn LinearRegression',
      'Predict ŷ = mx + b and measure residuals rᵢ = yᵢ - ŷᵢ',
      'Optionally trace iterative Gradient Descent toward OLS optimum',
      'Evaluate MSE, MAE, and explained variance R²',
    ],
    math: {
      formulas: [
        'ŷ = m·x + b',
        'MSE = (1 / n) · Σ (yᵢ - ŷᵢ)²',
        'MAE = (1 / n) · Σ |yᵢ - ŷᵢ|',
        'R² = 1 - Σ(yᵢ - ŷᵢ)² / Σ(yᵢ - ȳ)²',
      ],
      explanation:
        'Ordinary Least Squares finds the unique slope m and intercept b that minimize squared vertical distances (residuals) between observations and the regression line. Because errors are squared, extreme outliers exert strong leverage on OLS (increasing MSE relative to MAE).',
    },
  },
  {
    id: 'kmeans',
    title: 'K-Means Clustering',
    icon: '🎯',
    badge: 'Unsupervised · Clustering',
    description:
      'Partition unlabeled data into K Voronoi regions with scikit-learn KMeans and animate centroid updates iteration-by-iteration.',
    conceptId: 'k-means',
    defaultDataset: 'blobs',
    datasets: [
      { value: 'blobs', label: 'Gaussian Blobs (3 isotropic clusters)' },
      { value: 'moons', label: 'Two Interleaved Moons (non-convex)' },
      { value: 'circles', label: 'Concentric Circles (non-convex)' },
    ],
    steps: [
      'Initialize K centroids via k-means++ or random sampling',
      'Assign each observation xᵢ to its nearest centroid μₖ',
      'Update each centroid μₖ to the mean of its assigned points',
      'Repeat assignment and update until Δμ < 10⁻⁴ (convergence)',
    ],
    math: {
      formulas: [
        'J = WCSS = Σₖ₌₁ᴷ Σₓ∈Cₖ ||x - μₖ||²₂',
        'Assign: cᵢ = argminₖ ||xᵢ - μₖ||²',
        'Update: μₖ = (1 / |Cₖ|) Σₓ∈Cₖ x',
      ],
      explanation:
        'K-Means minimizes Within-Cluster Sum of Squares (Inertia / WCSS) by alternating assignment and centroid mean updates. k-means++ spreads initial centroids apart for faster, more reliable convergence than uniform random initialization, though non-convex manifolds (Moons/Circles) remain linearly partitioned.',
    },
  },
  {
    id: 'knn',
    title: 'K-Nearest Neighbors',
    icon: '👥',
    badge: 'Instance-Based · Classification',
    description:
      'Click anywhere on the 2-D surface to place a query point, explore real scikit-learn decision boundaries, and see how K and distance metrics reshape regions.',
    conceptId: 'knn',
    defaultDataset: 'moons',
    datasets: [
      { value: 'moons', label: 'Two Moons (non-linear boundary)' },
      { value: 'circles', label: 'Concentric Circles (radial boundary)' },
      { value: 'linear', label: 'Linearly Separable Cloud' },
      { value: 'blobs', label: 'Multi-Class Blobs (3 classes)' },
      { value: 'iris', label: 'Iris Flowers (Petal Length vs Width)' },
    ],
    steps: [
      'Store all labeled training samples in feature space (no parametric weights)',
      'Place or click a query coordinate q = (x₁, x₂)',
      'Measure distance d(q, xᵢ) using Euclidean, Manhattan, or Chebyshev metric',
      'Majority vote among the K closest neighbors yields class & P(y|q)',
    ],
    math: {
      formulas: [
        'Euclidean (L₂): d(q, x) = √( Σⱼ (qⱼ - xⱼ)² )',
        'Manhattan (L₁): d(q, x) = Σⱼ |qⱼ - xⱼ|',
        'Chebyshev (L∞): d(q, x) = maxⱼ |qⱼ - xⱼ|',
        'ŷ(q) = argmax_c (1 / K) Σᵢ∈N_K(q) 𝟙(yᵢ = c)',
      ],
      explanation:
        'KNN makes zero parametric assumptions: the decision surface emerges purely from local training neighborhoods. Small K (e.g., K=1) yields jagged, high-variance boundaries sensitive to noise, whereas larger K smooths boundaries (higher bias, lower variance).',
    },
  },
  {
    id: 'decision-tree',
    title: 'Decision Tree',
    icon: '🌳',
    badge: 'Supervised · Tree Rules',
    description:
      'Train a real scikit-learn DecisionTreeClassifier, inspect the actual split tree nodes & information gain, and visualize axis-aligned boundaries.',
    conceptId: 'decision-tree',
    defaultDataset: 'moons',
    datasets: [
      { value: 'moons', label: 'Two Moons (2 classes)' },
      { value: 'circles', label: 'Concentric Circles (2 classes)' },
      { value: 'blobs', label: 'Gaussian Blobs (3 classes)' },
      { value: 'linear', label: 'Linearly Separable (2 classes)' },
      { value: 'iris', label: 'Iris Dataset (3 classes)' },
    ],
    steps: [
      'Measure node impurity via Gini, Entropy, or Log-Loss',
      'Scan all features & thresholds to find the best split maximizing Information Gain',
      'Partition data recursively: left (xⱼ ≤ t) vs right (xⱼ > t)',
      'Halt splitting at max_depth or when samples < min_samples_split',
    ],
    math: {
      formulas: [
        'Gini(D) = 1 - Σ_c p_c²',
        'Entropy / Log-Loss: H(D) = - Σ_c p_c · log₂(p_c)',
        'Information Gain = Impurity(parent) - [ (n_L/n)·Impurity(L) + (n_R/n)·Impurity(R) ]',
      ],
      explanation:
        'Each internal node tests one feature threshold xⱼ ≤ t, creating orthogonal axis-aligned splits across 2-D space. Deeper trees (high max_depth) and tiny min_samples_split capture finer bends—risking overfitting (high Train, lower Validation accuracy).',
    },
  },
  {
    id: 'pca',
    title: 'Principal Component Analysis',
    icon: '📊',
    badge: 'Unsupervised · Subspace',
    description:
      'Decompose variance into orthogonal Principal Components via scikit-learn SVD, compare StandardScaler impact, and inspect real eigenvectors and eigenvalues.',
    conceptId: 'pca',
    defaultDataset: 'correlated',
    datasets: [
      { value: 'correlated', label: 'Scaled Tilted Ellipse (2D, 8x scale gap)' },
      { value: 'iris_4d', label: 'Iris 4-D → Subspace Reduction (4D → kD)' },
      { value: 'blobs', label: 'Gaussian Blobs (2D)' },
      { value: 'moons', label: 'Two Moons (2D)' },
      { value: 'circles', label: 'Concentric Circles (2D)' },
    ],
    steps: [
      'Original Data → Center means to 0 (and optionally Standardize variance to 1)',
      'Compute feature Covariance / Correlation matrix Σ = (1/(n-1)) XᵀX',
      'Extract orthogonal eigenvectors (components_) ordered by eigenvalues (explained_variance_)',
      'Project data Z = X · Wₖ onto top K Principal Components',
    ],
    math: {
      formulas: [
        'Covariance: Σ·vᵢ = λᵢ·vᵢ   (where λ₁ ≥ λ₂ ≥ ... ≥ λ_d)',
        'Explained Variance Ratio: EVRᵢ = λᵢ / Σⱼ λⱼ',
        'Subspace Projection: Z = X_std · V_Kᵀ',
      ],
      explanation:
        'PCA rotates axes to align with orthogonal directions of maximum variance. Without StandardScaler standardization, a single high-magnitude feature (like 8x scale) dominates PC1; enabling standardization treats every feature on equal variance footing.',
    },
  },
];

export function getLabById(id) {
  return LABS.find((lab) => lab.id === id) || LABS[0];
}
