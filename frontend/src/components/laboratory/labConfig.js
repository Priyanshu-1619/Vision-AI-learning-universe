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
  {
    id: 'logistic-regression',
    title: 'Logistic Regression',
    icon: '📉',
    badge: 'Supervised · Classification',
    description:
      'Fit a sigmoid probability hyperplane z = wᵀx + b minimizing cross-entropy log-loss, inspect decision odds, and observe the boundary surface.',
    conceptId: 'logistic-regression',
    defaultDataset: 'moons',
    datasets: [
      { value: 'moons', label: 'Two Moons (non-linear manifold)' },
      { value: 'circles', label: 'Concentric Circles' },
      { value: 'linear', label: 'Linearly Separable Cloud' },
      { value: 'blobs', label: 'Gaussian Blobs' },
    ],
    steps: [
      'Compute linear combination z = w₁x₁ + w₂x₂ + b',
      'Pass z through logistic sigmoid function σ(z) = 1 / (1 + e⁻ᶻ)',
      'Optimize cross-entropy log-loss via scikit-learn L-BFGS solver',
      'Establish decision boundary at probability threshold P(y=1) = 0.5',
    ],
    math: {
      formulas: [
        'P(y=1|x) = σ(wᵀx + b) = 1 / (1 + e^{-(wᵀx + b)})',
        'Log-Loss = - (1/n) Σ [yᵢ log(pᵢ) + (1-yᵢ) log(1-pᵢ)]',
        'Decision Boundary: w₁x₁ + w₂x₂ + b = 0',
      ],
      explanation:
        'Logistic Regression maps arbitrary real-valued affine projections into calibrated [0, 1] probabilities via the logistic sigmoid function. Regularization C controls the penalty on large weight coefficients.',
    },
  },
  {
    id: 'random-forest',
    title: 'Random Forest',
    icon: '🌲',
    badge: 'Supervised · Ensemble',
    description:
      'Train an ensemble of bootstrap decision trees with random feature subspaces to reduce variance and compute Out-of-Bag (OOB) accuracy.',
    conceptId: 'random-forest',
    defaultDataset: 'moons',
    datasets: [
      { value: 'moons', label: 'Two Moons' },
      { value: 'circles', label: 'Concentric Circles' },
      { value: 'blobs', label: 'Gaussian Blobs' },
      { value: 'linear', label: 'Linearly Separable' },
    ],
    steps: [
      'Draw B bootstrap samples with replacement from training dataset',
      'Grow decision tree on each bootstrap sample using random feature subsets',
      'Aggregate individual tree predictions via majority voting',
      'Evaluate Out-of-Bag (OOB) generalization error and feature importances',
    ],
    math: {
      formulas: [
        'ŷ = mode({ Tree_b(x) }) for b=1..B',
        'Var(Ensemble) = ρ·σ² + ((1-ρ)/B)·σ²',
        'Feature Importance = (1/B) Σ_b ΔGini(Feature)',
      ],
      explanation:
        'Random Forest achieves lower variance than individual decision trees by bagging bootstrap replicas and de-correlating trees through random feature subset selection at each split.',
    },
  },
  {
    id: 'svm',
    title: 'Support Vector Machine',
    icon: '🛡️',
    badge: 'Supervised · Margin Classifier',
    description:
      'Optimize maximal-margin separating hyperplanes and non-linear RBF kernel projections while isolating critical support vectors.',
    conceptId: 'support-vector-machines',
    defaultDataset: 'moons',
    datasets: [
      { value: 'moons', label: 'Two Moons' },
      { value: 'circles', label: 'Concentric Circles' },
      { value: 'linear', label: 'Linearly Separable' },
      { value: 'blobs', label: 'Gaussian Blobs' },
    ],
    steps: [
      'Formulate convex quadratic program maximizing geometric margin 2 / ||w||',
      'Apply kernel function (Linear, RBF, or Polynomial) to map features',
      'Solve dual Lagrangian multipliers αᵢ for each observation',
      'Isolate support vectors (αᵢ > 0) that define the margin boundaries',
    ],
    math: {
      formulas: [
        'Geometric Margin = 2 / ||w||',
        'RBF Kernel: K(x, x\') = exp(-γ ||x - x\'||²)',
        'Dual Objective: max_α Σ αᵢ - (1/2) Σᵢ Σⱼ αᵢ αⱼ yᵢ yⱼ K(xᵢ, xⱼ)',
      ],
      explanation:
        'Support Vector Machines seek the unique decision boundary that maximizes the geometric distance to the closest training points (support vectors). Non-linear kernels project points into infinite-dimensional reproducing kernel Hilbert spaces where linear separation becomes feasible.',
    },
  },
  {
    id: 'naive-bayes',
    title: 'Naive Bayes',
    icon: '🔮',
    badge: 'Probabilistic · Classification',
    description:
      'Estimate feature class-conditional Gaussian distributions under feature independence assumptions and compute Bayesian posterior boundaries.',
    conceptId: 'naive-bayes',
    defaultDataset: 'blobs',
    datasets: [
      { value: 'blobs', label: 'Gaussian Blobs' },
      { value: 'moons', label: 'Two Moons' },
      { value: 'linear', label: 'Linearly Separable' },
    ],
    steps: [
      'Calculate class prior probabilities P(y = c)',
      'Estimate mean μ_{c,j} and variance σ²_{c,j} for each feature given class c',
      'Compute Gaussian probability density function for input features',
      'Multiply prior by conditional likelihoods to obtain maximum a posteriori class',
    ],
    math: {
      formulas: [
        'P(y=c|x) ∝ P(y=c) · ∏ⱼ P(xⱼ|y=c)',
        'P(xⱼ|y=c) = (1 / √(2πσ²)) · exp(-(xⱼ - μ)² / (2σ²))',
        'ŷ = argmax_c [ log P(y=c) + Σⱼ log P(xⱼ|y=c) ]',
      ],
      explanation:
        'Gaussian Naive Bayes assumes each feature is conditionally independent given the class label. Despite this simplifying "naive" assumption, it provides competitive classification performance with exceptionally fast training.',
    },
  },
  {
    id: 'gradient-descent',
    title: 'Gradient Descent',
    icon: '⛰️',
    badge: 'Optimization · Convergence',
    description:
      'Simulate iterative analytical gradient descent across multi-dimensional loss surfaces (quadratic, Rosenbrock banana, saddle points) with momentum.',
    conceptId: 'gradient-descent',
    defaultDataset: 'quadratic',
    datasets: [
      { value: 'quadratic', label: 'Convex Quadratic Bowl' },
      { value: 'rosenbrock', label: 'Rosenbrock Banana Valley' },
      { value: 'saddle', label: 'Saddle Point Manifold' },
    ],
    steps: [
      'Initialize parameter weights θ₀ at starting coordinate',
      'Evaluate loss f(θₜ) and analytical gradient vector ∇f(θₜ)',
      'Update velocity vector with momentum: v_{t+1} = β·v_t + α·∇f(θₜ)',
      'Step parameters in direction of steepest descent: θ_{t+1} = θₜ - v_{t+1}',
    ],
    math: {
      formulas: [
        'v_{t+1} = β·v_t + α·∇f(θ_t)',
        'θ_{t+1} = θ_t - v_{t+1}',
        'Convergence Criterion: ||∇f(θ)|| < 10⁻⁴',
      ],
      explanation:
        'Gradient Descent iteratively descends the slope of a differentiable objective function. Momentum (β) accelerates progress along consistent directions while dampening oscillations across steep narrow valleys.',
    },
  },
  {
    id: 'perceptron',
    title: 'Perceptron',
    icon: '⚡',
    badge: 'Deep Learning · Neural Unit',
    description:
      'Train Rosenblatt’s fundamental single-layer artificial neuron with step-function activation and observe online weight vector adaptation.',
    conceptId: 'perceptrons',
    defaultDataset: 'linear',
    datasets: [
      { value: 'linear', label: 'Linearly Separable' },
      { value: 'moons', label: 'Two Moons' },
      { value: 'blobs', label: 'Gaussian Blobs' },
    ],
    steps: [
      'Initialize synaptic weights w and bias b to zero',
      'Compute linear activation z = wᵀx + b',
      'Apply Heaviside step activation: ŷ = 1 if z ≥ 0 else 0',
      'If prediction is incorrect, update weights: w ← w + η(y - ŷ)x, b ← b + η(y - ŷ)',
    ],
    math: {
      formulas: [
        'z = w₁x₁ + w₂x₂ + b',
        'ŷ = 𝟙(z ≥ 0)',
        'Δw = η·(y - ŷ)·x   and   Δb = η·(y - ŷ)',
      ],
      explanation:
        'The Perceptron is the foundational building block of artificial neural networks. By Rosenblatt’s Perceptron Convergence Theorem, it is guaranteed to find a separating hyperplane in finite steps if the dataset is linearly separable.',
    },
  },
  {
    id: 'cnn',
    title: 'Convolutional Layer (CNN)',
    icon: '👁️',
    badge: 'Deep Learning · Computer Vision',
    description:
      'Apply 2D spatial cross-correlation kernels (Sobel, Laplacian, Sharpen), ReLU non-linear activations, and 2x2 max-pooling subsampling.',
    conceptId: 'convolutional-neural-networks',
    defaultDataset: 'checker',
    datasets: [
      { value: 'checker', label: 'Geometric Cross & Edges' },
    ],
    steps: [
      'Slide K×K spatial filter across padded input matrix',
      'Compute element-wise dot product and sum at each receptive window',
      'Apply Rectified Linear Unit (ReLU) activation: max(0, z)',
      'Subsample feature representations using 2×2 Max-Pooling',
    ],
    math: {
      formulas: [
        'S(i, j) = (I * K)(i, j) = Σₘ Σₙ I(i-m, j-n)·K(m, n)',
        'Output Size: ⌊(W - F + 2P)/S⌋ + 1',
        'Max-Pooling: Pool(i, j) = max_{u,v ∈ W} S(i·s + u, j·s + v)',
      ],
      explanation:
        'Convolutional layers enforce translation equivariance through shared filter weights. Max-pooling introduces spatial invariance and reduces parameter dimensionality.',
    },
  },
  {
    id: 'autoencoder',
    title: 'Autoencoder',
    icon: '🧬',
    badge: 'Deep Learning · Representation',
    description:
      'Project higher-dimensional data through an information bottleneck latent layer z and reconstruct input signals while minimizing Mean Squared Error.',
    conceptId: 'autoencoders',
    defaultDataset: 'correlated',
    datasets: [
      { value: 'correlated', label: 'Scaled Correlated Cloud' },
      { value: 'blobs', label: 'Gaussian Blobs' },
      { value: 'moons', label: 'Two Moons' },
      { value: 'circles', label: 'Concentric Circles' },
    ],
    steps: [
      'Encode high-dimensional input x into lower-dimensional bottleneck latent representation z',
      'Decode latent representation z back into reconstructed output space x̂',
      'Compute reconstruction error loss ||x - x̂||²',
      'Compare compressed variance against uncompressed dimensionality',
    ],
    math: {
      formulas: [
        'Encoder: z = f(W_e·x + b_e)',
        'Decoder: x̂ = g(W_d·z + b_d)',
        'Reconstruction MSE = (1/n) Σ ||xᵢ - x̂ᵢ||²',
      ],
      explanation:
        'Autoencoders learn self-supervised low-dimensional manifold representations. When constrained by a bottleneck layer, the network captures the dominant intrinsic coordinates of the data distribution.',
    },
  },
];

export function getLabById(id) {
  return LABS.find((lab) => lab.id === id) || LABS[0];
}
