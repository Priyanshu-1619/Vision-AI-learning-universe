/**
 * Configuration & localStorage progress helpers for Phase 7: AI Challenges.
 */

const CHALLENGE_STORAGE_KEY = 'ai_universe_challenges_progress_v1';

export const CHALLENGES = [
  {
    id: 'diagnose-overfitting-curve',
    title: 'Diverging Validation Loss',
    category: 'Overfitting Diagnosis',
    difficulty: 'Intermediate',
    conceptId: 'overfitting',
    relatedPath: '/break-it?scenario=overfitting',
    relatedLabel: 'Open Overfitting in Break-It Lab',
    prompt:
      'You trained a 6-layer MLP on 400 tabular samples. Observe the training vs validation loss curve below. What is the primary diagnosis?',
    telemetry: {
      type: 'curves',
      yLabel: 'Loss',
      trainLabel: 'Train Loss',
      valLabel: 'Val Loss',
      bestEpoch: 6,
      points: [
        { epoch: 1, train: 1.15, val: 1.18 },
        { epoch: 4, train: 0.52, val: 0.58 },
        { epoch: 6, train: 0.31, val: 0.41 },
        { epoch: 10, train: 0.14, val: 0.56 },
        { epoch: 15, train: 0.06, val: 0.89 },
        { epoch: 20, train: 0.03, val: 1.24 },
      ],
    },
    hint: 'Compare what happens to Training Loss vs Validation Loss after Epoch 6.',
    options: [
      { id: 'a', label: 'Severe underfitting: model capacity is too small to reduce training loss' },
      { id: 'b', label: 'Severe overfitting: the model is memorizing training noise after Epoch 6' },
      { id: 'c', label: 'Learning rate is too small for weights to update' },
      { id: 'd', label: 'Target labels in the dataset are completely random' },
    ],
    correctOptionId: 'b',
    explanation:
      'Training loss keeps dropping smoothly toward 0.03 while Validation loss reverses upward after Epoch 6 (0.41 → 1.24)—the classic signature of high-variance memorization.',
    mathRationale:
      'Generalization error E_val = E_train + gap(complexity, n). After Epoch 6, fitting noise reduces empirical training MSE while amplifying variance on unseen validation points.',
  },
  {
    id: 'diagnose-underfitting-curve',
    title: 'Stubbornly High Error Floor',
    category: 'Overfitting Diagnosis',
    difficulty: 'Beginner',
    conceptId: 'underfitting',
    relatedPath: '/break-it?scenario=underfitting',
    relatedLabel: 'Open Underfitting in Break-It Lab',
    prompt:
      'Both training and validation MSE flatten near 0.78 on a complex sinusoidal dataset. Which condition best explains this telemetry?',
    telemetry: {
      type: 'curves',
      yLabel: 'MSE',
      trainLabel: 'Train MSE',
      valLabel: 'Val MSE',
      points: [
        { epoch: 1, train: 1.22, val: 1.25 },
        { epoch: 5, train: 0.88, val: 0.91 },
        { epoch: 10, train: 0.8, val: 0.83 },
        { epoch: 15, train: 0.78, val: 0.81 },
        { epoch: 20, train: 0.77, val: 0.8 },
      ],
    },
    hint: 'Notice there is almost zero generalization gap, yet both errors remain high.',
    options: [
      { id: 'a', label: 'Underfitting (high structural bias): the model lacks capacity for the true pattern' },
      { id: 'b', label: 'Overfitting (high variance): add stronger L2 weight decay' },
      { id: 'c', label: 'Data leakage between training and validation splits' },
      { id: 'd', label: 'Gradient explosion inflating predictions' },
    ],
    correctOptionId: 'a',
    explanation:
      'When both Train and Validation error plateau together at a high value with almost no gap, the model cannot even fit the training distribution—indicating underfitting.',
    mathRationale:
      'Under Bias-Variance decomposition, Bias² dominates total error regardless of training epochs when the hypothesis space cannot express the ground-truth curvature.',
  },
  {
    id: 'select-algorithm-tabular',
    title: 'Non-Linear Tabular Constraints',
    category: 'Algorithm Selection',
    difficulty: 'Beginner',
    conceptId: 'random-forest',
    relatedPath: '/evolution?track=trees&node=random-forest',
    relatedLabel: 'View Tree Evolution Story',
    prompt:
      'You have 2,500 structured customer rows with mixed numeric/categorical features and non-linear threshold rules. You need strong accuracy and feature importance rankings without heavy tuning. Which algorithm fits best?',
    telemetry: {
      type: 'bars',
      unit: '% Val Acc',
      items: [
        { label: 'Linear Classifier', value: 64, color: '#64748b' },
        { label: 'Single Deep Tree', value: 78, color: '#f59e0b' },
        { label: 'Candidate Model?', value: 89, color: '#06b6d4' },
      ],
    },
    hint: 'Which tabular ensemble reduces single-tree variance while retaining feature importance?',
    options: [
      { id: 'a', label: 'Vanilla Linear Regression with L2 penalty' },
      { id: 'b', label: 'K-Means Clustering (unsupervised)' },
      { id: 'c', label: 'Random Forest (bagged ensemble of decorrelated decision trees)' },
      { id: 'd', label: '2D Convolutional Neural Network (CNN)' },
    ],
    correctOptionId: 'c',
    explanation:
      'Random Forests naturally capture non-linear tabular interactions, require minimal preprocessing/scaling, resist overfitting via bagging, and output impurity-based feature importances.',
    mathRationale:
      'Averaging N decorrelated bootstrap trees lowers ensemble variance toward ρ·σ² + (1-ρ)σ²/N while preserving the low bias of deep splits.',
  },
  {
    id: 'select-algorithm-sequences',
    title: 'Long-Context Parallel Modeling',
    category: 'Algorithm Selection',
    difficulty: 'Intermediate',
    conceptId: 'transformer',
    relatedPath: '/evolution?track=sequence&node=transformer',
    relatedLabel: 'Open Sequence Evolution Simulator',
    prompt:
      'Your NLP pipeline must model dependencies across 2,000-token technical documents and utilize multi-GPU parallel training efficiently. Which architecture solves the serial bottleneck?',
    telemetry: {
      type: 'bars',
      unit: 'Signal @ t=40 (%)',
      items: [
        { label: 'Vanilla RNN (γ=0.8)', value: 1, color: '#ef4444' },
        { label: 'LSTM (Serial O(T))', value: 38, color: '#3b82f6' },
        { label: 'Target Architecture', value: 100, color: '#10b981' },
      ],
    },
    hint: 'Think of the architecture that replaced sequential hidden state recurrence with direct QKᵀ dot products.',
    options: [
      { id: 'a', label: 'Vanilla Recurrent Neural Network (RNN)' },
      { id: 'b', label: 'Bag-of-Words Logistic Regression' },
      { id: 'c', label: 'Single Decision Tree' },
      { id: 'd', label: 'Transformer with Multi-Head Self-Attention' },
    ],
    correctOptionId: 'd',
    explanation:
      'Transformers process all sequence positions simultaneously using self-attention, eliminating serial O(T) recurrence and giving every token an O(1) direct path to any other token.',
    mathRationale:
      'Attention(Q,K,V) = softmax(QKᵀ/√dₖ)V computes pairwise interactions in matrix multiplications across all tokens in parallel rather than T sequential steps.',
  },
  {
    id: 'select-metric-fraud',
    title: 'The 0.3% Fraud Detection Trap',
    category: 'Evaluation Metrics',
    difficulty: 'Intermediate',
    conceptId: 'evaluation-metrics',
    relatedPath: '/break-it?scenario=class-imbalance',
    relatedLabel: 'Test Class Imbalance in Break-It Lab',
    prompt:
      'A credit card fraud detector reports 99.7% Accuracy on 10,000 transactions (only 30 are actual fraud). Inspect the confusion matrix—which metric pair should guide model selection?',
    telemetry: {
      type: 'confusion',
      tn: 9970,
      fp: 0,
      fn: 30,
      tp: 0,
    },
    hint: 'Notice TP = 0 and FN = 30: every single fraud case was missed!',
    options: [
      { id: 'a', label: 'Overall Classification Accuracy' },
      { id: 'b', label: 'Precision-Recall AUC (PR-AUC), Recall, and F1-Score' },
      { id: 'c', label: 'Mean Squared Error (MSE)' },
      { id: 'd', label: 'R² Coefficient of Determination' },
    ],
    correctOptionId: 'b',
    explanation:
      'Because 99.7% of rows are legitimate, predicting "Not Fraud" forever scores 99.7% Accuracy while catching 0% of fraud. Recall, Precision, F1, and PR-AUC directly measure minority detection.',
    mathRationale:
      'Recall = TP/(TP+FN) = 0/30 = 0.0 and F1 = 2·P·R/(P+R) = 0.0, immediately exposing the failure masked by (TP+TN)/N = 0.997.',
  },
  {
    id: 'select-metric-outliers',
    title: 'Regression with Extreme Outliers',
    category: 'Evaluation Metrics',
    difficulty: 'Intermediate',
    conceptId: 'loss-function',
    relatedPath: '/mathematics?topic=loss-functions',
    relatedLabel: 'Compare Losses in Math Lab',
    prompt:
      'You are predicting median neighborhood home prices, where 2% of listings are mis-entered as $50M typos. Which loss / evaluation choice prevents those typos from dominating gradients?',
    telemetry: {
      type: 'bars',
      unit: 'Grad @ e=8',
      items: [
        { label: 'MSE Gradient (2e)', value: 16, color: '#ef4444' },
        { label: 'Huber (δ=1) Grad', value: 1, color: '#10b981' },
        { label: 'MAE Gradient', value: 1, color: '#06b6d4' },
      ],
    },
    hint: 'Compare quadratic error growth e² against linear |e| / Huber behavior for large errors.',
    options: [
      { id: 'a', label: 'MAE (L1) or Huber Loss (bounded linear gradient for outliers)' },
      { id: 'b', label: 'Unclipped Mean Squared Error (MSE)' },
      { id: 'c', label: 'Binary Cross-Entropy (BCE)' },
      { id: 'd', label: 'Softmax Cross-Entropy' },
    ],
    correctOptionId: 'a',
    explanation:
      'MSE squares large errors (e²) and applies gradients linear in error size (2e), pulling the regression toward extreme typos. MAE and Huber cap outlier gradients at ±1 / ±δ.',
    mathRationale:
      'For |e| > δ, Huber gradient dL/de = δ·sign(e) stays constant rather than scaling proportionally to e, protecting model weights from corrupted outliers.',
  },
  {
    id: 'choose-hyperparam-lr',
    title: 'Violent Loss Oscillation',
    category: 'Hyperparameters',
    difficulty: 'Beginner',
    conceptId: 'gradient-descent',
    relatedPath: '/break-it?scenario=high-learning-rate',
    relatedLabel: 'Trigger Oscillation in Break-It Lab',
    prompt:
      'During gradient descent, loss jumps erratically upward after Epoch 2 instead of settling into the valley. Which hyperparameter adjustment fixes this immediately?',
    telemetry: {
      type: 'curves',
      yLabel: 'Loss',
      trainLabel: 'Train Loss',
      valLabel: 'Val Loss',
      points: [
        { epoch: 1, train: 1.8, val: 1.85 },
        { epoch: 2, train: 1.1, val: 1.15 },
        { epoch: 4, train: 2.4, val: 2.5 },
        { epoch: 6, train: 3.9, val: 4.1 },
        { epoch: 8, train: 6.8, val: 7.1 },
      ],
    },
    hint: 'Updates are jumping past the valley floor onto steeper opposite walls.',
    options: [
      { id: 'a', label: 'Double learning rate α so it finishes faster' },
      { id: 'b', label: 'Increase polynomial degree to 12' },
      { id: 'c', label: 'Decrease learning rate α (e.g., from 1.05 down to 0.05–0.2)' },
      { id: 'd', label: 'Remove the validation split' },
    ],
    correctOptionId: 'c',
    explanation:
      'When step size α exceeds 2/L (where L is loss curvature), θₜ₊₁ = θₜ - α∇J overshoots across the minimum with increasing amplitude each step.',
    mathRationale:
      'Stability requires |1 - α·L| < 1 ⇒ α < 2/L. Lowering α restores monotonic contraction into the minimum.',
  },
  {
    id: 'choose-hyperparam-ridge',
    title: 'Taming Huge Polynomial Weights',
    category: 'Hyperparameters',
    difficulty: 'Advanced',
    conceptId: 'bias-variance',
    relatedPath: '/what-if?exp=polynomial',
    relatedLabel: 'Experiment with Ridge λ in What-If Studio',
    prompt:
      'A Degree-8 polynomial has Train MSE = 0.01, Validation MSE = 3.20, and weight L2 norm ||w||₂ = 48.2. Which change shrinks ||w||₂ and restores validation accuracy while keeping Degree 8?',
    telemetry: {
      type: 'bars',
      unit: 'MSE',
      max: 3.5,
      items: [
        { label: 'Train MSE', value: 0.01, displayValue: '0.01', color: '#06b6d4' },
        { label: 'Val MSE', value: 3.2, displayValue: '3.20', color: '#ef4444' },
      ],
    },
    hint: 'Which penalty term adds λ·||w||₂² directly to the loss objective?',
    options: [
      { id: 'a', label: 'Set Ridge λ = 0 to allow unconstrained weights' },
      { id: 'b', label: 'Increase Ridge (L2) regularization λ > 0 (e.g., λ = 0.5–2.0)' },
      { id: 'c', label: 'Raise polynomial degree from 8 to 15' },
      { id: 'd', label: 'Multiply feature values by 100×' },
    ],
    correctOptionId: 'b',
    explanation:
      'Adding Ridge L2 regularization penalizes massive cancelling coefficients (||w||₂ = 48.2), smoothing Runge oscillations and dropping Validation MSE dramatically.',
    mathRationale:
      'Ridge solves (XᵀX + λI)w = Xᵀy: adding λ to the diagonal shrinks small singular-value directions, directly reducing model variance.',
  },
  {
    id: 'interpret-curve-crawl',
    title: 'Glacial Training Convergence',
    category: 'Curve Interpretation',
    difficulty: 'Intermediate',
    conceptId: 'optimization',
    relatedPath: '/mathematics?topic=gradient-descent',
    relatedLabel: 'Test Step Size α in Math Lab',
    prompt:
      'After 30 epochs on a clean convex objective, Train and Val loss decrease in a nearly straight shallow line from 1.40 to 1.21. What is the most likely issue?',
    telemetry: {
      type: 'curves',
      yLabel: 'Loss',
      trainLabel: 'Train Loss',
      valLabel: 'Val Loss',
      points: [
        { epoch: 1, train: 1.4, val: 1.42 },
        { epoch: 8, train: 1.35, val: 1.37 },
        { epoch: 16, train: 1.29, val: 1.31 },
        { epoch: 24, train: 1.24, val: 1.26 },
        { epoch: 30, train: 1.21, val: 1.23 },
      ],
    },
    hint: 'Loss is steadily dropping with zero oscillation, just very slowly.',
    options: [
      { id: 'a', label: 'Learning rate α is too small (or gradients are damped); increase α modestly' },
      { id: 'b', label: 'Severe overfitting; add aggressive dropout' },
      { id: 'c', label: 'Exploding gradients; clip gradients to 0.01' },
      { id: 'd', label: 'Validation split is leaked into training' },
    ],
    correctOptionId: 'a',
    explanation:
      'A smooth, slow, linear decline with Train ≈ Val loss indicates healthy optimization direction but tiny step size (α too small or unnormalized vanishing inputs).',
    mathRationale:
      'When α ≪ 1/L, contraction factor (1 - αL) ≈ 1, requiring hundreds of extra epochs to reach the minimum.',
  },
  {
    id: 'interpret-early-stopping',
    title: 'Optimal Checkpoint Selection',
    category: 'Curve Interpretation',
    difficulty: 'Beginner',
    conceptId: 'cross-validation',
    relatedPath: '/what-if?exp=training',
    relatedLabel: 'Inspect Epoch Curves in What-If Studio',
    prompt:
      'Validation loss reaches its minimum of 0.19 at Epoch 11, then rises steadily to 0.58 by Epoch 28 while training loss keeps dropping. What action captures the best generalizing model?',
    telemetry: {
      type: 'curves',
      yLabel: 'Loss',
      trainLabel: 'Train Loss',
      valLabel: 'Val Loss',
      bestEpoch: 11,
      points: [
        { epoch: 1, train: 0.95, val: 0.98 },
        { epoch: 6, train: 0.36, val: 0.4 },
        { epoch: 11, train: 0.17, val: 0.19 },
        { epoch: 18, train: 0.09, val: 0.32 },
        { epoch: 28, train: 0.04, val: 0.58 },
      ],
    },
    hint: 'Look at the vertical marker at Epoch 11.',
    options: [
      { id: 'a', label: 'Deploy the final Epoch 28 weights since Train Loss is lowest' },
      { id: 'b', label: 'Train to Epoch 100 so Validation Loss catches back up' },
      { id: 'c', label: 'Remove all hidden layers' },
      { id: 'd', label: 'Use Early Stopping and restore the model weights saved at Epoch 11' },
    ],
    correctOptionId: 'd',
    explanation:
      'Early stopping monitors validation loss and restores the checkpoint from Epoch 11 before the model begins fitting training-set noise.',
    mathRationale:
      'Stopping early restricts effective weight travel ||w_t - w_0||₂, acting as implicit L2 regularization around the initialization.',
  },
];

export function getChallengeProgress() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { solvedIds: [], attempts: {} };
  }
  try {
    const raw = window.localStorage.getItem(CHALLENGE_STORAGE_KEY);
    if (!raw) return { solvedIds: [], attempts: {} };
    const parsed = JSON.parse(raw);
    return {
      solvedIds: Array.isArray(parsed.solvedIds) ? parsed.solvedIds : [],
      attempts: parsed.attempts && typeof parsed.attempts === 'object' ? parsed.attempts : {},
    };
  } catch {
    return { solvedIds: [], attempts: {} };
  }
}

export function saveChallengeAttempt(challengeId, selectedOptionId, isCorrect) {
  const current = getChallengeProgress();
  const solvedSet = new Set(current.solvedIds);
  if (isCorrect) solvedSet.add(challengeId);

  const next = {
    solvedIds: Array.from(solvedSet),
    attempts: {
      ...current.attempts,
      [challengeId]: { selectedOptionId, isCorrect },
    },
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}

export function resetChallengeProgress() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(CHALLENGE_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return { solvedIds: [], attempts: {} };
}
