/**
 * Configuration registry for all 12 interactive Mathematics Lab topics.
 */

export const MATH_GROUPS = [
  { id: 'statistics', label: 'Statistics & Probability', color: '#06b6d4' },
  { id: 'linear-algebra', label: 'Linear Algebra', color: '#8b5cf6' },
  { id: 'calculus', label: 'Calculus & Optimization', color: '#ec4899' },
];

export const MATH_TOPICS = [
  // Statistics & Probability
  {
    id: 'mean',
    group: 'statistics',
    title: 'Mean & Center of Mass',
    conceptId: 'statistics',
    formulas: ['μ = (1/n) Σ xᵢ', 'μ_weighted = (Σ wᵢ·xᵢ) / (Σ wᵢ)'],
    physicalIntuition:
      'Think of every data point as a physical block sitting on a rigid beam. The arithmetic mean is the exact fulcrum point where left and right torques cancel out in equilibrium.',
    aiConnection:
      'Batch normalization, centroid updates in K-Means, and MSE predictions all converge toward conditional means—making models sensitive to extreme outliers.',
    defaults: { outlierValue: 4.5, outlierWeight: 1 },
  },
  {
    id: 'variance',
    group: 'statistics',
    title: 'Variance as Physical Area',
    conceptId: 'statistics',
    formulas: ['σ² = (1/n) Σ (xᵢ - μ)²', 'σ = √σ²'],
    physicalIntuition:
      'Every deviation (xᵢ - μ) forms the edge of a physical square of area (xᵢ - μ)². Doubling a point’s distance from the mean quadruples its square area.',
    aiConnection:
      'Variance explains why Mean Squared Error (MSE) heavily penalizes large prediction mistakes and why PCA searches for axes of maximum variance.',
    defaults: { outlierPos: 3.5 },
  },
  {
    id: 'standard-deviation',
    group: 'statistics',
    title: 'Standard Deviation & Bell Curve',
    conceptId: 'probability',
    formulas: ['f(x) = (1 / σ√2π) · exp(-(x - μ)² / 2σ²)', 'z = (x - μ) / σ'],
    physicalIntuition:
      'Standard deviation σ acts as the natural ruler of spread around mean μ: ~68% of samples fall inside ±1σ, ~95% inside ±2σ, and ~99.7% inside ±3σ.',
    aiConnection:
      'Z-score feature scaling transforms features to μ=0, σ=1 so gradient descent steps evenly across dimensions and distance-based models are scale-invariant.',
    defaults: { mu: 0, sigma: 1.2 },
  },
  {
    id: 'correlation',
    group: 'statistics',
    title: 'Correlation & Covariance',
    conceptId: 'statistics',
    formulas: [
      'Cov(X, Y) = (1/n) Σ (xᵢ - x̄)(yᵢ - ȳ)',
      'r = Cov(X, Y) / (σₓ · σᵧ)',
    ],
    physicalIntuition:
      'Correlation measures how tightly a cloud of points hugs a straight line, from -1 (perfect downward tilt) through 0 (unstructured cloud) to +1 (perfect upward tilt).',
    aiConnection:
      'Feature selection uses correlation to detect predictive signals and spot multicollinearity that destabilizes linear regression weights.',
    defaults: { targetR: 0.78, spread: 0.45, withOutlier: false },
  },

  // Linear Algebra
  {
    id: 'vectors',
    group: 'linear-algebra',
    title: 'Vectors, Scaling & Addition',
    conceptId: 'vectors',
    formulas: ['||a⃗|| = √(aₓ² + aᵧ²)', 'a⃗ + b⃗ = (aₓ + bₓ, aᵧ + bᵧ)', 'k·a⃗ = (k·aₓ, k·aᵧ)'],
    physicalIntuition:
      'A vector is a directed displacement arrow in space. Scaling stretches or flips its arrow; vector addition places tail-to-tip to trace the diagonal of a parallelogram.',
    aiConnection:
      'Every data sample, word embedding, and weight layer in machine learning is a vector living in high-dimensional Euclidean space.',
    defaults: { ax: 2.6, ay: 1.2, bx: 1.0, by: 2.4, scalarK: 1.4 },
  },
  {
    id: 'dot-product',
    group: 'linear-algebra',
    title: 'Dot Product & Projection',
    conceptId: 'linear-algebra',
    formulas: ['a⃗ · b⃗ = aₓbₓ + aᵧbᵧ = ||a⃗||·||b⃗||·cos(θ)', 'proj_b(a⃗) = ((a⃗ · b⃗) / ||b⃗||²)·b⃗'],
    physicalIntuition:
      'The dot product measures directional alignment by dropping the orthogonal shadow of vector a⃗ onto vector b⃗: positive when aligned, zero when perpendicular, negative when opposed.',
    aiConnection:
      'Every neuron computes w⃗ · x⃗ + b, and Transformer self-attention computes scaled query-key dot products QKᵀ to score token relevance.',
    defaults: { ax: 2.8, ay: 1.8, bx: 3.0, by: 0.4 },
  },
  {
    id: 'matrices',
    group: 'linear-algebra',
    title: 'Matrices as Space Transformations',
    conceptId: 'matrices',
    formulas: ['A = [[a, b], [c, d]]', 'det(A) = a·d - b·c'],
    physicalIntuition:
      'A 2×2 matrix warps the entire coordinate plane by sending basis vectors î → (a, c) and ĵ → (b, d). Its determinant |det(A)| is the area scaling factor of the unit square.',
    aiConnection:
      'Neural network layers apply matrix multiplications Wx to rotate, stretch, and project representations into spaces where classes become separable.',
    defaults: { a: 1.2, b: 0.6, c: 0.2, d: 1.0 },
  },
  {
    id: 'distance',
    group: 'linear-algebra',
    title: 'Distance Metrics (L₂, L₁, Cosine)',
    conceptId: 'linear-algebra',
    formulas: [
      'd_L₂ = √((x₂-x₁)² + (y₂-y₁)²)',
      'd_L₁ = |x₂-x₁| + |y₂-y₁|',
      'd_cos = 1 - (P₁·P₂) / (||P₁||·||P₂||)',
    ],
    physicalIntuition:
      'Euclidean L₂ flies straight as the crow flies, Manhattan L₁ walks along city blocks, and Cosine ignores length completely to measure only the angle between rays.',
    aiConnection:
      'KNN, K-Means clustering, and vector similarity search behave dramatically differently depending on whether Euclidean, Manhattan, or Cosine distance is used.',
    defaults: { x1: 1.5, y1: 1.2, x2: 4.0, y2: 3.2 },
  },

  // Calculus & Optimization
  {
    id: 'derivative',
    group: 'calculus',
    title: 'Derivative: Secant → Tangent',
    conceptId: 'derivative',
    formulas: ["f'(x) = lim_{Δx→0} (f(x + Δx) - f(x)) / Δx"],
    physicalIntuition:
      'The secant line connects two separated points (x, f(x)) and (x+Δx, f(x+Δx)). Shrinking step Δx toward zero snaps the secant cleanly onto the instantaneous tangent slope.',
    aiConnection:
      'Derivatives tell optimization algorithms whether increasing a parameter raises or lowers model error—and how steeply.',
    defaults: { fnId: 'x2', x: 1.4, dx: 1.2 },
  },
  {
    id: 'gradient',
    group: 'calculus',
    title: 'Gradients & Contour Landscapes',
    conceptId: 'gradient',
    formulas: ['∇f(x, y) = [∂f/∂x, ∂f/∂y]', '||∇f|| = √((∂f/∂x)² + (∂f/∂y)²)'],
    physicalIntuition:
      'Standing on a hilly landscape, the gradient vector ∇f points strictly perpendicular to contour lines in the direction of steepest uphill ascent.',
    aiConnection:
      'Backpropagation computes the high-dimensional gradient ∇L(θ) across millions of weights simultaneously so training can step opposite ∇L.',
    defaults: { landscapeId: 'bowl', probeX: 1.4, probeY: -1.1 },
  },
  {
    id: 'gradient-descent',
    group: 'calculus',
    title: 'Gradient Descent Dynamics',
    conceptId: 'gradient-descent',
    formulas: ['θₜ₊₁ = θₜ - α · ∇J(θₜ)'],
    physicalIntuition:
      'A ball rolling downhill taking discrete steps proportional to slope and learning rate α. Too small α crawls slowly; too large α overshoots the valley and diverges!',
    aiConnection:
      'Gradient descent and its momentum/Adam variants power almost all modern machine learning and deep neural network training.',
    defaults: { landscapeId: 'convex', alpha: 0.2, x0: -3.2 },
  },
  {
    id: 'loss-functions',
    group: 'calculus',
    title: 'Loss Functions & Gradients',
    conceptId: 'loss-function',
    formulas: [
      'MSE(e) = e²',
      'MAE(e) = |e|',
      'Huber_δ(e) = ½e² (|e|≤δ) or δ(|e|-½δ)',
      'BCE(y, ŷ) = -(y·ln(ŷ) + (1-y)·ln(1-ŷ))',
    ],
    physicalIntuition:
      'Loss functions turn prediction errors into penalty hills whose slopes dictate gradient force: MSE pushes quadratically on outliers, MAE pushes with constant ±1 force, and Huber blends both.',
    aiConnection:
      'Choosing the right loss determines robustness to noisy labels, gradient stability, and calibrated probabilistic predictions.',
    defaults: { errorVal: 1.4, huberDelta: 1.0, probVal: 0.72, bceTarget: 1 },
  },
];

export const CONCEPT_TO_MATH_TOPIC = {
  statistics: 'mean',
  probability: 'standard-deviation',
  'linear-algebra': 'matrices',
  vectors: 'vectors',
  matrices: 'matrices',
  derivative: 'derivative',
  gradient: 'gradient',
  'gradient-descent': 'gradient-descent',
  'loss-function': 'loss-functions',
};

export function getMathTopicById(topicId) {
  return MATH_TOPICS.find((t) => t.id === topicId) || MATH_TOPICS[0];
}

export function getMathTopicForConcept(conceptId) {
  return CONCEPT_TO_MATH_TOPIC[conceptId] || null;
}
