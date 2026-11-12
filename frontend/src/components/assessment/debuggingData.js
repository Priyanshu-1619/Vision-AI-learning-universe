/**
 * Configuration & localStorage progress helpers for Phase 7: AI Debugging Simulator.
 * Implements all 8 broken pipeline scenarios with strict pre-diagnosis gating.
 */

const DEBUGGING_STORAGE_KEY = 'ai_universe_debugging_progress_v1';

export const DEBUGGING_CASES = [
  {
    id: 'data-leakage',
    title: '98% Validation, 56% Production Collapse',
    severity: 'Critical',
    category: 'Data Pipeline',
    conceptId: 'cross-validation',
    relatedPath: '/break-it?scenario=data-leakage',
    relatedLabel: 'Inspect Data Leakage in Break-It Lab',
    pipelineSteps: [
      '1. Load raw customer table X, y',
      '2. Fit global scaler & target encoder on full X, y',
      '3. Split into X_train, X_val via train_test_split',
      '4. Train LogisticRegression & score X_val → 98.4%',
    ],
    brokenCode: `X["mean_target_by_zip"] = y.groupby(X["zip"]).transform("mean")
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_train, X_val, y_train, y_val = train_test_split(X_scaled, y, test_size=0.2)`,
    telemetry: {
      type: 'bars',
      unit: '% Accuracy',
      items: [
        { label: 'Offline Val Accuracy', value: 98.4, color: '#06b6d4' },
        { label: 'Live Prod Accuracy', value: 56.2, color: '#ef4444' },
      ],
    },
    hint: 'Look at the order of preprocessing/target encoding relative to train_test_split.',
    options: [
      { id: 'leak', label: 'Data leakage: scaler & target encoding used validation labels/stats before splitting' },
      { id: 'lr', label: 'Learning rate is too low during training' },
      { id: 'dim', label: 'Matrix dimension mismatch inside LogisticRegression' },
      { id: 'underfit', label: 'Severe underfitting requiring polynomial degree 10' },
    ],
    correctOptionId: 'leak',
    rootCauseExplanation:
      'Fitting StandardScaler and target encoding on the entire dataset BEFORE train_test_split leaks validation distributions and target labels directly into training features. In production, unseen rows lack those future statistics.',
    fixedDiff: [
      { type: 'remove', text: '- X["mean_target_by_zip"] = y.groupby(X["zip"]).transform("mean")' },
      { type: 'remove', text: '- scaler = StandardScaler(); X_scaled = scaler.fit_transform(X)' },
      { type: 'remove', text: '- X_train, X_val, y_train, y_val = train_test_split(X_scaled, y)' },
      { type: 'add', text: '+ X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2)' },
      { type: 'add', text: '+ pipe = make_pipeline(StandardScaler(), TargetEncoder(), LogisticRegression())' },
      { type: 'add', text: '+ pipe.fit(X_train, y_train)  # Fit stats strictly on train fold!' },
    ],
  },
  {
    id: 'wrong-preprocessing',
    title: 'Distance Classifier Ignores Half the Features',
    severity: 'High',
    category: 'Preprocessing',
    conceptId: 'data-preprocessing',
    relatedPath: '/break-it?scenario=bad-scaling',
    relatedLabel: 'See Scale Distortion in Break-It Lab',
    pipelineSteps: [
      '1. Features: age (18..75) & annual_salary (25,000..220,000)',
      '2. Split X_train, X_test',
      '3. Call fit_transform independently on X_test OR skip scaling',
      '4. Fit KNeighborsClassifier(k=5) → Test Acc drops to 54%',
    ],
    brokenCode: `scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s = scaler.fit_transform(X_test)  # New fit on test!
knn = KNeighborsClassifier(n_neighbors=5).fit(X_train_s, y_train)`,
    telemetry: {
      type: 'bars',
      unit: '% Test Acc',
      items: [
        { label: 'Current Broken Pipeline', value: 54.0, color: '#ef4444' },
        { label: 'Train Acc', value: 89.5, color: '#06b6d4' },
      ],
    },
    hint: 'Check what fit_transform(X_test) does to test feature coordinates compared to X_train.',
    options: [
      { id: 'act', label: 'Wrong activation function inside KNN' },
      { id: 'prep', label: 'Wrong preprocessing: test split was re-fit with its own mean/std instead of scaler.transform()' },
      { id: 'imbal', label: '99% class imbalance hiding minority recall' },
      { id: 'clip', label: 'Exploding gradients in Euclidean distance' },
    ],
    correctOptionId: 'prep',
    rootCauseExplanation:
      'Calling fit_transform(X_test) computes a separate mean and standard deviation on the test set—shifting test points into a completely different coordinate frame from X_train_s (especially fatal on small test batches).',
    fixedDiff: [
      { type: 'keep', text: '  scaler = StandardScaler()' },
      { type: 'keep', text: '  X_train_s = scaler.fit_transform(X_train)' },
      { type: 'remove', text: '- X_test_s = scaler.fit_transform(X_test)' },
      { type: 'add', text: '+ X_test_s = scaler.transform(X_test)  # Reuse training mean & std!' },
    ],
  },
  {
    id: 'wrong-labels',
    title: 'Clean Loss Stalls at Random Chance (50%)',
    severity: 'Critical',
    category: 'Labels & Alignment',
    conceptId: 'supervised-learning',
    relatedPath: '/concept/supervised-learning',
    relatedLabel: 'Review Supervised Learning',
    pipelineSteps: [
      '1. Load paired samples X, y (50/50 balanced binary)',
      '2. Shuffle X_train rows before batching',
      '3. Keep y_train in original unshuffled order',
      '4. Train MLPClassifier → Loss freezes near ln(2) = 0.693',
    ],
    brokenCode: `rng = np.random.default_rng(42)
X_train = rng.permutation(X_train)  # Shuffles features only!
model.fit(X_train, y_train)`,
    telemetry: {
      type: 'curves',
      yLabel: 'BCE Loss',
      trainLabel: 'Train Loss',
      valLabel: 'Val Loss',
      points: [
        { epoch: 1, train: 0.71, val: 0.72 },
        { epoch: 5, train: 0.695, val: 0.698 },
        { epoch: 10, train: 0.693, val: 0.695 },
        { epoch: 20, train: 0.692, val: 0.696 },
      ],
    },
    hint: 'Loss stalls at ln(2) ≈ 0.693—maximum binary entropy where input features carry zero mutual information with y.',
    options: [
      { id: 'dim', label: 'Dimension mismatch between X_train and model input' },
      { id: 'ridge', label: 'Missing L2 Ridge regularization' },
      { id: 'labels', label: 'Misaligned labels: X_train was shuffled independently without permuting y_train identically' },
      { id: 'k', label: 'K-Means clusters initialized too close' },
    ],
    correctOptionId: 'labels',
    rootCauseExplanation:
      'Permuting X_train without applying the exact same index permutation to y_train destroys the feature-label pairing (Xᵢ, yᵢ). The network can only predict the marginal class prior p = 0.5, locking BCE loss at ln(2) ≈ 0.693.',
    fixedDiff: [
      { type: 'remove', text: '- X_train = rng.permutation(X_train)' },
      { type: 'add', text: '+ perm = rng.permutation(len(X_train))' },
      { type: 'add', text: '+ X_train, y_train = X_train[perm], y_train[perm]' },
    ],
  },
  {
    id: 'incorrect-activation',
    title: 'Dead / Vanishing Gradient Output Stall',
    severity: 'High',
    category: 'Neural Architecture',
    conceptId: 'activation-functions',
    relatedPath: '/inside-model?tab=activations',
    relatedLabel: 'Inspect Activations in Inside the Model',
    pipelineSteps: [
      '1. Build 8-layer deep MLP with Sigmoid hidden activations',
      '2. Place ReLU at final binary logit output before BCEWithLogitsLoss',
      '3. Run backward() pass across 8 layers',
      '4. Layer 1 gradient norm drops to 0.00002; negative logits die',
    ],
    brokenCode: `layers = [layer for _ in range(7) for layer in (nn.Linear(32, 32), nn.Sigmoid())]
model = nn.Sequential(*layers, nn.Linear(32, 1), nn.ReLU())
loss = nn.BCEWithLogitsLoss()(model(x), y)`,
    telemetry: {
      type: 'bars',
      unit: 'Grad Norm',
      items: [
        { label: 'Layer 8 Grad', value: 1.0, color: '#06b6d4' },
        { label: 'Layer 5 Grad', value: 0.06, color: '#f59e0b' },
        { label: 'Layer 1 Grad (×1000)', value: 0.02, color: '#ef4444' },
      ],
    },
    hint: 'Check both the 7 stacked Sigmoid hidden layers AND why ReLU on output logits clips negative class scores.',
    options: [
      { id: 'act', label: 'Incorrect activations: ReLU clips negative logits (<0.5 prob) and deep Sigmoid vanishes gradients' },
      { id: 'leak', label: 'Target leakage in train_test_split' },
      { id: 'imbal', label: 'Minority class weighting is reversed' },
      { id: 'scale', label: 'Manhattan distance used instead of Cosine' },
    ],
    correctOptionId: 'act',
    rootCauseExplanation:
      'Putting ReLU after the final linear logit layer prevents the model from ever predicting negative logits (so σ(0) = 0.5 becomes the hard floor for class 0!). Meanwhile, 7 stacked Sigmoid hidden layers multiply σ\' ≤ 0.25 repeatedly, starving Layer 1 of gradients.',
    fixedDiff: [
      { type: 'remove', text: '- layers = [layer for _ in range(7) for layer in (nn.Linear(32, 32), nn.Sigmoid())]' },
      { type: 'remove', text: '- model = nn.Sequential(*layers, nn.Linear(32, 1), nn.ReLU())' },
      { type: 'add', text: '+ layers = [layer for _ in range(7) for layer in (nn.Linear(32, 32), nn.ReLU())]' },
      { type: 'add', text: '+ model = nn.Sequential(*layers, nn.Linear(32, 1))  # Raw logits for BCEWithLogitsLoss' },
    ],
  },
  {
    id: 'incorrect-loss',
    title: 'Continuous Regression Crashes with Probability Error',
    severity: 'High',
    category: 'Loss Function',
    conceptId: 'loss-function',
    relatedPath: '/mathematics?topic=loss-functions',
    relatedLabel: 'Compare Losses in Math Lab',
    pipelineSteps: [
      '1. Task: Predict continuous house prices ($120k .. $850k)',
      '2. Model final layer: nn.Linear(64, 1) (unbounded output)',
      '3. Criterion: nn.BCELoss() (Binary Cross-Entropy)',
      '4. Runtime fails / gradients blow up on targets > 1.0',
    ],
    brokenCode: `model = nn.Sequential(nn.Linear(12, 64), nn.ReLU(), nn.Linear(64, 1))
criterion = nn.BCELoss()
loss = criterion(model(x_batch), y_house_price)`,
    telemetry: {
      type: 'traceback',
      errorType: 'RuntimeError: invalid probability domain in BCELoss',
      detail:
        'Expected predictions ∈ [0, 1] and binary targets ∈ {0, 1}, received model(x) = [-14.2, 342.8] and y = [245.0, 510.0].',
    },
    hint: 'Match the output range and target task (continuous regression) to the loss function.',
    options: [
      { id: 'dim', label: 'Linear layer input dimension 12 does not match 64' },
      { id: 'leak', label: 'StandardScaler fitted before split' },
      { id: 'overfit', label: 'Model has too many hidden units for 12 features' },
      { id: 'loss', label: 'Incorrect loss function: BCELoss requires probabilities ∈ [0,1]; regression requires MSELoss or HuberLoss' },
    ],
    correctOptionId: 'loss',
    rootCauseExplanation:
      'Binary Cross-Entropy computes -(y·ln(p) + (1-y)·ln(1-p)), which is undefined outside p ∈ (0, 1) and invalid for unbounded continuous dollar targets. Continuous regression requires MSELoss, L1Loss, or HuberLoss.',
    fixedDiff: [
      { type: 'keep', text: '  model = nn.Sequential(nn.Linear(12, 64), nn.ReLU(), nn.Linear(64, 1))' },
      { type: 'remove', text: '- criterion = nn.BCELoss()' },
      { type: 'add', text: '+ criterion = nn.HuberLoss(delta=1.0)  # Or nn.MSELoss() for continuous regression' },
    ],
  },
  {
    id: 'dimension-mismatch',
    title: 'Tensor Matrix Multiplication Crash',
    severity: 'Critical',
    category: 'Tensor Shapes',
    conceptId: 'matrices',
    relatedPath: '/mathematics?topic=matrices',
    relatedLabel: 'Review Matrix Dimensions in Math Lab',
    pipelineSteps: [
      '1. Input batch tensor X has shape [32, 12]',
      '2. Layer 1: nn.Linear(12, 64) → output [32, 64]',
      '3. Layer 2: nn.Linear(16, 10) → expects 16 input features',
      '4. Forward pass aborts on matmul [32, 64] @ [16, 10]',
    ],
    brokenCode: `model = nn.Sequential(
    nn.Linear(12, 64),
    nn.ReLU(),
    nn.Linear(16, 10)  # Expected in_features=64, got 16!
)`,
    telemetry: {
      type: 'traceback',
      errorType: 'RuntimeError: mat1 and mat2 shapes cannot be multiplied (32x64 and 16x10)',
      detail:
        'Input X: [32, 12] → Linear1(12→64): [32, 64] → Linear2(16→10): inner dim 64 ≠ 16!',
    },
    hint: 'Check the inner dimensions between Layer 1 out_features and Layer 2 in_features.',
    options: [
      { id: 'act', label: 'ReLU cannot follow a Linear layer' },
      { id: 'dim', label: 'Dimension mismatch: Layer 1 outputs 64 features while Layer 2 expects 16 input features' },
      { id: 'loss', label: 'Batch size 32 is too small for matrix multiplication' },
      { id: 'leak', label: 'Validation batch leaked into Layer 1' },
    ],
    correctOptionId: 'dim',
    rootCauseExplanation:
      'Matrix multiplication (m × k) · (k × n) requires matching inner dimensions k. Layer 1 produces activations of shape [32, 64], so Layer 2 must accept in_features=64 rather than 16.',
    fixedDiff: [
      { type: 'keep', text: '  model = nn.Sequential(' },
      { type: 'keep', text: '      nn.Linear(12, 64),' },
      { type: 'keep', text: '      nn.ReLU(),' },
      { type: 'remove', text: '-     nn.Linear(16, 10)' },
      { type: 'add', text: '+     nn.Linear(64, 10)  # Matches previous layer out_features=64' },
      { type: 'keep', text: '  )' },
    ],
  },
  {
    id: 'class-imbalance',
    title: '99% Accuracy with Zero Minority Detections',
    severity: 'High',
    category: 'Evaluation & Data',
    conceptId: 'evaluation-metrics',
    relatedPath: '/break-it?scenario=class-imbalance',
    relatedLabel: 'Inspect Class Imbalance in Break-It Lab',
    pipelineSteps: [
      '1. Dataset contains 1,980 negative and 20 positive rare-disease cases (1%)',
      '2. Train LogisticRegression() with default class_weight=None',
      '3. Evaluate with accuracy_score(y_val, preds) → 99.0%',
      '4. Hospital deployment misses 20 out of 20 sick patients',
    ],
    brokenCode: `clf = LogisticRegression()  # Unweighted on 99:1 skew
clf.fit(X_train, y_train)
print("Score:", accuracy_score(y_val, clf.predict(X_val)))  # 0.990`,
    telemetry: {
      type: 'confusion',
      tn: 396,
      fp: 0,
      fn: 4,
      tp: 0,
    },
    hint: 'Look at TP = 0 and FN = 4 in the validation confusion matrix.',
    options: [
      { id: 'imbal', label: 'Severe class imbalance: unweighted loss + raw accuracy ignore the 1% positive class (0% Recall)' },
      { id: 'dim', label: 'LogisticRegression output dimension mismatch' },
      { id: 'lr', label: 'Gradient explosion inside LogisticRegression' },
      { id: 'labels', label: 'All labels in y_train are NaN' },
    ],
    correctOptionId: 'imbal',
    rootCauseExplanation:
      'With a 99:1 class skew, predicting class 0 for every sample achieves 99.0% accuracy with minimal unweighted loss—yielding 0% Recall on the critical positive cases.',
    fixedDiff: [
      { type: 'remove', text: '- clf = LogisticRegression()' },
      { type: 'add', text: '+ clf = LogisticRegression(class_weight="balanced")' },
      { type: 'keep', text: '  clf.fit(X_train, y_train)' },
      { type: 'remove', text: '- print("Score:", accuracy_score(y_val, clf.predict(X_val)))' },
      { type: 'add', text: '+ print(classification_report(y_val, clf.predict(X_val)))  # Track Recall, F1 & PR-AUC' },
    ],
  },
  {
    id: 'overfitting',
    title: '99.8% Train Accuracy, 53% Validation Collapse',
    severity: 'High',
    category: 'Generalization',
    conceptId: 'overfitting',
    relatedPath: '/break-it?scenario=overfitting',
    relatedLabel: 'Trigger Overfitting in Break-It Lab',
    pipelineSteps: [
      '1. Small dataset: 80 noisy tabular samples',
      '2. Model: DecisionTreeClassifier(max_depth=None) (or unregularized 512-unit MLP)',
      '3. Fit on X_train with zero regularization or pruning',
      '4. Train Acc = 99.8%, Val Acc = 53.0%',
    ],
    brokenCode: `tree = DecisionTreeClassifier(max_depth=None, min_samples_leaf=1)
tree.fit(X_train, y_train)
# Train Acc: 99.8% | Val Acc: 53.0%`,
    telemetry: {
      type: 'bars',
      unit: '% Accuracy',
      items: [
        { label: 'Train Accuracy', value: 99.8, color: '#06b6d4' },
        { label: 'Validation Accuracy', value: 53.0, color: '#ef4444' },
      ],
    },
    hint: 'Compare unconstrained memorization on 80 samples (99.8%) against unseen validation generalization (53.0%).',
    options: [
      { id: 'underfit', label: 'Severe underfitting: increase max_depth to fit training set' },
      { id: 'dim', label: 'Input dimension mismatch' },
      { id: 'overfit', label: 'Severe overfitting: unconstrained tree depth memorizes training noise on small n=80 data' },
      { id: 'loss', label: 'Wrong loss function for binary labels' },
    ],
    correctOptionId: 'overfit',
    rootCauseExplanation:
      'Allowing unlimited tree depth (max_depth=None, min_samples_leaf=1) lets the tree create single-sample leaf partitions memorizing noise spikes, destroying generalization on validation data.',
    fixedDiff: [
      { type: 'remove', text: '- tree = DecisionTreeClassifier(max_depth=None, min_samples_leaf=1)' },
      { type: 'add', text: '+ tree = RandomForestClassifier(n_estimators=100, max_depth=5, min_samples_leaf=4)' },
      { type: 'keep', text: '  tree.fit(X_train, y_train)' },
    ],
  },
];

export function getDebuggingProgress() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { solvedIds: [], attempts: {} };
  }
  try {
    const raw = window.localStorage.getItem(DEBUGGING_STORAGE_KEY);
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

export function saveDebuggingAttempt(caseId, selectedOptionId, isCorrect) {
  const current = getDebuggingProgress();
  const solvedSet = new Set(current.solvedIds);
  if (isCorrect) solvedSet.add(caseId);

  const next = {
    solvedIds: Array.from(solvedSet),
    attempts: {
      ...current.attempts,
      [caseId]: { selectedOptionId, isCorrect },
    },
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(DEBUGGING_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}

export function resetDebuggingProgress() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(DEBUGGING_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return { solvedIds: [], attempts: {} };
}
