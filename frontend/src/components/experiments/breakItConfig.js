/**
 * Configuration registry for Phase 6 Break-It Mode (9 failure scenarios)
 * and Concept Engine integration helpers.
 */

export const BREAK_IT_SCENARIOS = [
  {
    id: 'high-learning-rate',
    title: 'Exploding Learning Rate',
    category: 'Optimization',
    conceptId: 'gradient-descent',
    tagline: 'Step size α overshoots the valley and catapults loss upward.',
    slider: {
      label: 'Learning Rate (α)',
      min: 0.05,
      max: 1.15,
      step: 0.05,
      brokenValue: 1.05,
      fixedValue: 0.2,
      format: (v) => v.toFixed(2),
    },
    diagnostics: {
      whatHappened:
        'Instead of rolling down toward the minimum θ* = -0.1, each update leaps farther across the opposite valley wall until loss explodes.',
      whyItHappened:
        'Gradient descent assumes local linearity within a small neighborhood. When step α exceeds 2 / L (twice the inverse curvature), updates overshoot the minimum by a factor > 1.',
      mathematics:
        'For J(θ) = θ² + 0.2θ, J\'(θ) = 2θ + 0.2 (curvature L = 2). Error grows by factor |1 - 2α| per step: α = 1.05 yields |-1.1| > 1 → exponential divergence.',
      howToFix:
        'Reduce α below 1 / L (e.g., α = 0.20), add learning-rate warmup/decay schedules, or apply gradient clipping.',
    },
  },
  {
    id: 'underfitting',
    title: 'Severe Underfitting',
    category: 'Bias-Variance',
    conceptId: 'underfitting',
    tagline: 'A rigid Degree-1 line tries to fit curved sinusoidal data.',
    slider: {
      label: 'Polynomial Degree',
      min: 1,
      max: 6,
      step: 1,
      brokenValue: 1,
      fixedValue: 4,
      format: (v) => `Degree ${v}`,
    },
    diagnostics: {
      whatHappened:
        'Both Training MSE and Test MSE remain stubbornly high—the model misses obvious bends and waves in the data.',
      whyItHappened:
        'The hypothesis family (a straight line y = w₀ + w₁x) lacks sufficient representational capacity to capture non-linear curvature (high structural bias).',
      mathematics:
        'Error decomposes as E[(y - ŷ)²] = Bias² + Variance + σ². At Degree 1, Bias² dominates total error regardless of how many training points you collect.',
      howToFix:
        'Increase model capacity (Degree 3–4 polynomial features, non-linear kernels, or deeper neural layers) until bias subsides.',
    },
  },
  {
    id: 'overfitting',
    title: 'High-Degree Overfitting',
    category: 'Bias-Variance',
    conceptId: 'overfitting',
    tagline: 'Degree-9 polynomial memorizes noise spikes and fails on new data.',
    slider: {
      label: 'Polynomial Degree',
      min: 2,
      max: 9,
      step: 1,
      brokenValue: 9,
      fixedValue: 4,
      format: (v) => `Degree ${v}`,
    },
    diagnostics: {
      whatHappened:
        'Training MSE plunges near zero as the curve violently weaves through every noisy sample, yet Test MSE spikes sharply between samples.',
      whyItHappened:
        'With high polynomial degree relative to sample size n, extreme positive and negative weights cancel locally to memorize random noise (Runge oscillation).',
      mathematics:
        'Unregularized OLS fits (XᵀX)⁻¹Xᵀy with ill-conditioned Vandermonde columns; tiny noise ε amplifies into massive ||w||₂ and exploding test variance.',
      howToFix:
        'Lower polynomial complexity (Degree 3–4), add Ridge L2 regularization (λ > 0), or gather more training samples.',
    },
  },
  {
    id: 'bad-scaling',
    title: 'Unscaled Feature Distortion',
    category: 'Preprocessing',
    conceptId: 'data-preprocessing',
    tagline: 'Feature x₂ scaled 100× hijacks Euclidean distance in KNN.',
    slider: {
      label: 'Feature x₂ Scale Multiplier',
      min: 1,
      max: 100,
      step: 5,
      brokenValue: 100,
      fixedValue: 1,
      format: (v) => `${v}×`,
    },
    diagnostics: {
      whatHappened:
        'The 2D decision boundary collapses into flat horizontal stripes—completely ignoring feature x₁ and dropping test accuracy.',
      whyItHappened:
        'Distance-based models (KNN, K-Means, SVM) treat raw numerical differences equally across axes, so a 100× larger feature scale drowns out other informative dimensions.',
      mathematics:
        'd²(a, b) = (x₁ₐ - x₁ᵦ)² + (100·(x₂ₐ - x₂ᵦ))² ≈ 10⁴(x₂ₐ - x₂ᵦ)². Feature x₁ contributes < 0.01% to nearest-neighbor selection.',
      howToFix:
        'Standardize features (z = (x - μ) / σ) or apply Min-Max scaling strictly inside the training fold so all axes share comparable scale.',
    },
  },
  {
    id: 'wrong-k',
    title: 'Wrong KNN Neighborhood (K=1)',
    category: 'Algorithms',
    conceptId: 'knn',
    tagline: 'K=1 carves fragile noise islands; balanced K smooths boundaries.',
    slider: {
      label: 'Neighbors (K)',
      min: 1,
      max: 25,
      step: 2,
      brokenValue: 1,
      fixedValue: 7,
      format: (v) => `K = ${v}`,
    },
    diagnostics: {
      whatHappened:
        'At K=1, training accuracy hits 100% while the decision grid shatters into noisy speckles around every mislabeled training point, hurting test accuracy.',
      whyItHappened:
        'Each query copies the single closest training point—giving individual noisy points infinite local veto power (extreme variance).',
      mathematics:
        'Neighborhood averaging over K samples reduces label noise variance by factor 1/K, trading low variance against smooth bias near class borders.',
      howToFix:
        'Select balanced K (e.g., K=5–9) via cross-validation—large enough to suppress noise without over-smoothing true class curves (like K=25).',
    },
  },
  {
    id: 'class-imbalance',
    title: 'The 96% Accuracy Trap',
    category: 'Evaluation',
    conceptId: 'evaluation-metrics',
    tagline: 'Severe 96%/4% skew tricks accuracy while minority Recall collapses.',
    slider: {
      label: 'Minority Class Share (%)',
      min: 2,
      max: 50,
      step: 2,
      brokenValue: 4,
      fixedValue: 50,
      format: (v) => `${v}%`,
    },
    diagnostics: {
      whatHappened:
        'Overall Accuracy reads an impressive ~96%, yet the model catches almost zero positive minority cases (collapsed Recall and F1 score).',
      whyItHappened:
        'Standard unweighted accuracy treats all errors identically, so predicting the 96% majority class minimizes raw error count without learning minority patterns.',
      mathematics:
        'Accuracy = (TP+TN)/N ≈ 0.96 even when TP = 0. Meanwhile Recall = TP/(TP+FN) = 0 and F1 = 2·P·R/(P+R) = 0.',
      howToFix:
        'Evaluate with Precision, Recall, F1, PR-AUC, and Balanced Accuracy; apply class weights, threshold tuning, or stratified resampling.',
    },
  },
  {
    id: 'data-leakage',
    title: 'Train/Test Data Leakage',
    category: 'Evaluation',
    conceptId: 'cross-validation',
    tagline: 'Leaked target info inflates offline validation while production crashes.',
    slider: {
      label: 'Leakage Strength (%)',
      min: 0,
      max: 100,
      step: 5,
      brokenValue: 90,
      fixedValue: 0,
      format: (v) => `${v}%`,
    },
    diagnostics: {
      whatHappened:
        'Offline validation accuracy soars to ~97%, creating false confidence—yet real-world production accuracy collapses below ~60%.',
      whyItHappened:
        'Target information leaked into features (via post-outcome proxy columns or fitting scalers/encoders on the entire dataset prior to splitting).',
      mathematics:
        'When feature X_leak correlates with label y only inside the historical export, model weights rely on X_leak instead of true causal predictors X_gen.',
      howToFix:
        'Split data first, wrap all scalers/imputers/encoders strictly inside cross-validation pipelines, and audit top feature importances for future proxies.',
    },
  },
  {
    id: 'vanishing-gradients',
    title: 'Vanishing Deep Gradients',
    category: 'Deep Learning',
    conceptId: 'activation-functions',
    tagline: '8-layer Sigmoid kills gradients before they reach Layer 1.',
    slider: {
      label: 'Weight Scale (σ_w)',
      min: 0.4,
      max: 1.6,
      step: 0.1,
      brokenValue: 0.9,
      fixedValue: 1.4,
      format: (v) => `${v.toFixed(1)}×`,
    },
    diagnostics: {
      whatHappened:
        'Gradient magnitudes decay exponentially from Layer 8 back to Layer 1, leaving early feature detectors completely frozen during training.',
      whyItHappened:
        'Sigmoid’s derivative σ\'(z) is at most 0.25 (and far smaller when saturated). Multiplying < 0.25 across 8 layers shrinks signals to near zero.',
      mathematics:
        '||∂L/∂W₁|| ∝ ∏ᵢ₌₂⁸ (||Wᵢ|| · σ\'(zᵢ)) ≤ (0.25 · σ_w)⁷ ≈ 0.00003 for σ_w = 0.9.',
      howToFix:
        'Switch hidden activations from Sigmoid to ReLU/GELU, use He/Kaiming initialization (σ_w = √(2/n)), and add residual skip connections.',
    },
  },
  {
    id: 'exploding-gradients',
    title: 'Exploding Deep Gradients',
    category: 'Deep Learning',
    conceptId: 'backpropagation',
    tagline: 'Large weight gain amplifies gradients exponentially across 8 layers.',
    slider: {
      label: 'Weight Scale (σ_w)',
      min: 1.1,
      max: 2.6,
      step: 0.1,
      brokenValue: 2.4,
      fixedValue: 1.4,
      format: (v) => `${v.toFixed(1)}×`,
    },
    diagnostics: {
      whatHappened:
        'Gradient norms multiply rapidly backward through layers, spiking thousands of times larger at Layer 1 and triggering NaN weight overflow.',
      whyItHappened:
        'When each layer’s Jacobian spectral gain exceeds 1.0, repeated chain-rule products amplify tiny output errors exponentially.',
      mathematics:
        '||∂L/∂W₁|| ∝ (gain)⁷. With ReLU gain ≈ 0.72 and σ_w = 2.4, per-layer factor = 1.73 → 1.73⁷ ≈ 46× (and even higher on positive paths).',
      howToFix:
        'Use proper variance-preserving initialization (He/Xavier), apply Gradient Norm Clipping (max_norm = 1.0), and add LayerNorm/BatchNorm.',
    },
  },
];

export function getBreakItScenarioById(id) {
  return BREAK_IT_SCENARIOS.find((s) => s.id === id) || BREAK_IT_SCENARIOS[0];
}

export const CONCEPT_TO_BREAK_IT = {
  overfitting: 'overfitting',
  underfitting: 'underfitting',
  'bias-variance': 'overfitting',
  'evaluation-metrics': 'class-imbalance',
  'data-preprocessing': 'bad-scaling',
  knn: 'wrong-k',
  'cross-validation': 'data-leakage',
};

export const CONCEPT_TO_WHAT_IF = {
  overfitting: 'polynomial',
  underfitting: 'polynomial',
  'bias-variance': 'polynomial',
  'data-preprocessing': 'boundary',
  knn: 'boundary',
};

export function getBreakItScenarioForConcept(conceptId) {
  return CONCEPT_TO_BREAK_IT[conceptId] || null;
}

export function getWhatIfExpForConcept(conceptId) {
  return CONCEPT_TO_WHAT_IF[conceptId] || null;
}
