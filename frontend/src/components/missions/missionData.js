// Mission Data — Customer Churn Prediction Mission (Phase 9)
// Grounded directly on backend/datasets/customer_churn.csv & sklearn ColumnTransformer/Pipeline.

export const CHURN_MISSION = {
  id: 'customer-churn',
  title: 'Customer Churn Prediction',
  subtitle: 'Build an end-to-end leakage-free ML pipeline for customer retention',
  difficulty: 'Intermediate',
  estimatedTime: '25–40 min',
  xpReward: 600,
  description:
    'You are an ML engineer tackling telecom customer attrition on 400 customer accounts. Complete the entire lifecycle from understanding the CSV schema to deploying live churn risk scoring.',
  skills: [
    'Schema Audit',
    'Exploratory Analysis',
    'Data Cleaning',
    'Leakage-Free Pipelines',
    'Model Evaluation',
    'ML Debugging',
  ],
  steps: [
    {
      id: 'brief',
      title: 'Mission Brief',
      icon: '🎯',
      objective: 'Understand the retention objective and evaluation priorities.',
      content:
        'A subscription business is losing ~25% of customers each cycle. Retaining an existing customer costs far less than acquiring a new one, so missing high-risk churners (False Negatives) is especially expensive.\n\nYour workflow follows strict ML discipline: inspect raw data, visualize drivers, clean missing values without leakage, train with scikit-learn ColumnTransformer + Pipeline, debug common failures, optimize F1/Recall, and deploy predictions.',
      interactiveType: 'info',
      successCriteria: { type: 'action', action: 'click-continue' },
      hints: [
        'Focus on distinguishing classification from regression before choosing metrics.',
        'Watch closely for missing values and class imbalance (~75% stayed vs ~25% churned).',
      ],
      relatedConcepts: ['machine-learning', 'classification', 'evaluation-metrics'],
      relatedLabs: [],
      xp: 25,
    },
    {
      id: 'understand',
      title: 'Stage 1: Understand Dataset',
      icon: '🔍',
      objective: 'Inspect row count, column schema, data types, missing values, and target balance.',
      content:
        'Audit the local CSV dataset loaded with pandas below. Notice mixed numeric columns (tenure, monthly_charges, total_charges, support_calls), categorical columns (contract_type, payment_method, internet_service), and binary target `churn` (0 = Stayed, 1 = Churned).',
      interactiveType: 'data-explorer',
      successCriteria: {
        type: 'quiz',
        question: 'What is the target variable, and what type of supervised ML problem is this?',
        options: [
          'monthly_charges — a continuous Regression problem',
          'churn (0 or 1) — an imbalanced Binary Classification problem (~25% positive)',
          'contract_type — an Unsupervised Clustering problem',
          'tenure — a Time-Series Forecasting problem',
        ],
        answer: 1,
        explanation:
          'Correct! `churn` is a discrete binary target (0 = Stayed, 1 = Churned) with ~25.3% churners vs ~74.8% non-churners, making this a moderately imbalanced binary classification problem.',
      },
      hints: [
        'Check the Target & Churn Rate stat tiles in the Overview tab.',
        'Check the Features tab to inspect dtypes and missing counts across columns.',
      ],
      relatedConcepts: ['data', 'classification'],
      relatedLabs: [],
      xp: 45,
    },
    {
      id: 'explore',
      title: 'Stage 2: Explore Data (EDA)',
      icon: '📊',
      objective: 'Visualize categorical churn rates and numeric feature distributions via Plotly.',
      content:
        'Switch between interactive charts generated directly from the CSV via pandas to discover which customer segments churn at the highest rates.',
      interactiveType: 'eda-explorer',
      successCriteria: {
        type: 'quiz',
        question: 'From the interactive EDA charts, which customer segment shows the highest churn risk?',
        options: [
          'Two-year contract customers with low monthly charges',
          'Customers with no internet service and long tenure',
          'Month-to-month contracts, Fiber optic service, shorter tenure, and frequent support calls',
          'Credit card automatic payments with 60+ months tenure',
        ],
        answer: 2,
        explanation:
          'Right! Month-to-month subscribers lack long-term commitment, and short tenure combined with higher monthly charges and frequent support calls drives sharply higher churn.',
      },
      hints: [
        'Inspect the "By Contract Type" and "Tenure vs Churn" tabs in the chart.',
        'Compare churn % on Month-to-month vs Two year contracts.',
      ],
      relatedConcepts: ['statistics', 'data'],
      relatedLabs: [],
      xp: 45,
    },
    {
      id: 'clean',
      title: 'Stage 3: Clean & Preprocess',
      icon: '🧹',
      objective: 'Configure pandas/sklearn handling for missing values, categorical encoding, and scaling.',
      content:
        'Raw data has real NaNs (`total_charges`: 14 missing, `support_calls`: 10 missing) and mixed numeric/categorical types. Configure a leakage-free `ColumnTransformer + Pipeline` below so `SimpleImputer`, encoders, and `StandardScaler` fit ONLY on training splits.',
      interactiveType: 'cleaning-pipeline',
      successCriteria: {
        type: 'clean-check',
        explanation:
          'Great pipeline configuration! Running imputation, encoding, and scaling inside a sklearn Pipeline after splitting ensures zero test-set statistics leak into training.',
      },
      hints: [
        'Median imputation keeps all 400 customers instead of discarding 24 rows.',
        'One-Hot Encoding prevents models from assuming artificial ordinal order among payment methods.',
      ],
      relatedConcepts: ['data-preprocessing', 'feature-engineering'],
      relatedLabs: [],
      xp: 55,
    },
    {
      id: 'features',
      title: 'Stage 4: Select Features',
      icon: '🧩',
      objective: 'Select informative predictors while balancing dimensionality.',
      content:
        'Choose which of the 8 dataset features enter your `ColumnTransformer`. Include core behavioral predictors (`tenure`, `monthly_charges`, `contract_type`) plus supporting risk signals.',
      interactiveType: 'feature-selector',
      successCriteria: {
        type: 'feature-check',
        required: ['tenure', 'monthly_charges', 'contract_type'],
        minSelected: 5,
        explanation:
          'Strong feature set! Including tenure, monthly_charges, and contract_type along with support/internet context equips classifiers with both loyalty and friction signals.',
      },
      hints: [
        'Include at least tenure, monthly_charges, and contract_type.',
        'support_calls and internet_service also carry clear churn separation from Stage 2 EDA.',
      ],
      relatedConcepts: ['feature-engineering'],
      relatedLabs: [],
      xp: 45,
    },
    {
      id: 'algorithm',
      title: 'Stage 5: Choose Algorithm',
      icon: '🤖',
      objective: 'Pick an initial classification family and inspect its inductive bias.',
      content:
        'Choose between four scikit-learn classifiers. Remember you can revisit models later during Stage 9 Improvement to compare baseline vs tuned F1 scores.',
      interactiveType: 'algorithm-selector',
      successCriteria: {
        type: 'action',
        action: 'select-algorithm',
        explanation: 'Model family selected. Proceed to configure your train/test split and fit it.',
      },
      hints: [
        'Logistic Regression gives an interpretable linear baseline.',
        'Random Forest handles non-linear interactions across encoded categories effectively.',
      ],
      relatedConcepts: ['logistic-regression', 'knn', 'decision-tree', 'random-forest'],
      relatedLabs: ['knn', 'decision-tree'],
      xp: 40,
    },
    {
      id: 'train',
      title: 'Stage 6: Train Pipeline',
      icon: '⚙️',
      objective: 'Run stratified train/test split and fit your sklearn Pipeline on the backend.',
      content:
        'Configure test split fraction and model hyperparameters, then click **Train Pipeline** to fit a real `ColumnTransformer + Classifier` via scikit-learn on the backend.',
      interactiveType: 'train-config',
      successCriteria: {
        type: 'value-check',
        field: 'accuracy',
        threshold: 0.70,
        comparison: 'gte',
        explanation: 'Baseline pipeline trained cleanly with stratified validation!',
      },
      hints: [
        'A 25%–30% holdout test split (`test_size = 0.25–0.30`) gives a reliable evaluation slice.',
        'For Decision Tree or Random Forest, max_depth 3–6 avoids severe overfitting.',
      ],
      relatedConcepts: ['cross-validation', 'decision-tree'],
      relatedLabs: ['decision-tree'],
      xp: 60,
    },
    {
      id: 'evaluate',
      title: 'Stage 7: Evaluate & Interpret',
      icon: '📈',
      objective: 'Analyze Precision, Recall, F1, and Confusion Matrix costs.',
      content:
        'Inspect your real model confusion matrix (TN, FP, FN, TP) and classification metrics below. Remember: in churn retention, a False Negative means losing a customer with zero intervention.',
      interactiveType: 'confusion-matrix',
      successCriteria: {
        type: 'quiz',
        question: 'Why is Accuracy alone insufficient on this ~25% churn dataset?',
        options: [
          'Accuracy ignores training time',
          'Predicting "No Churn" for every single customer achieves ~75% accuracy while catching 0% of churners (Recall = 0)',
          'Accuracy is always higher than Precision',
          'Confusion matrices only apply to regression problems',
        ],
        answer: 1,
        explanation:
          'Exactly! The Accuracy Paradox tricks teams on imbalanced data. Recall (catching true churners) and F1 (balancing false alarms vs missed churners) reveal whether the model is actually useful.',
      },
      hints: [
        'Ask: what accuracy would a trivial model get if it always guessed class 0 (Stayed)?',
        'Look at the False Negative (FN) quadrant in your confusion matrix.',
      ],
      relatedConcepts: ['evaluation-metrics'],
      relatedLabs: [],
      xp: 60,
    },
    {
      id: 'debug',
      title: 'Stage 8: Debug Broken Pipelines',
      icon: '🐛',
      objective: 'Run real bug simulations on the backend and diagnose Overfitting, Data Leakage, and Imbalance.',
      content:
        'Trigger all three live scikit-learn failure demos below (Overfitting Tree, Leakage Before Split, Majority Dummy Predictor), observe their actual output numbers, and verify your diagnosis of each.',
      interactiveType: 'debug-lab',
      successCriteria: {
        type: 'debug-check',
        explanation:
          'All 3 classic ML failures diagnosed accurately! Recognizing overfitting gaps, preprocessing leakage, and accuracy paradoxes saves production pipelines.',
      },
      hints: [
        'Overfitting shows ~100% Train accuracy paired with much lower Test accuracy.',
        'Calling fit_transform before train_test_split leaks test distribution mean/variance into training.',
      ],
      relatedConcepts: ['overfitting', 'data-preprocessing', 'evaluation-metrics'],
      relatedLabs: ['decision-tree'],
      xp: 80,
    },
    {
      id: 'improve',
      title: 'Stage 9: Improve the Model',
      icon: '🚀',
      objective: 'Experiment with Random Forest / depth / class_weight="balanced" to maximize Recall & F1.',
      content:
        'Now iterate scientifically! Try switching to **Random Forest** or **Logistic Regression**, enable **Class Weight Balancing** (`class_weight="balanced"`), and tune tree depth to push validation F1 ≥ 0.60 while inspecting feature importances.',
      interactiveType: 'improve-config',
      successCriteria: {
        type: 'value-check',
        field: 'f1',
        threshold: 0.60,
        comparison: 'gte',
        explanation:
          'Excellent optimization! Balancing class weights and tuning complexity substantially lifts churner Recall and F1 score.',
      },
      hints: [
        'Enable "Balance Class Weights (class_weight=balanced)" to penalize missed minority churners.',
        'Random Forest (depth 4–6, 60–100 trees) with balanced weights typically exceeds F1 = 0.65 on this dataset.',
      ],
      relatedConcepts: ['random-forest', 'bias-variance'],
      relatedLabs: ['decision-tree'],
      xp: 75,
    },
    {
      id: 'predict',
      title: 'Stage 10: Live Inference',
      icon: '⚡',
      objective: 'Test your trained sklearn Pipeline on custom customer profiles.',
      content:
        'Adjust customer attributes below and click **Predict Churn Risk** to invoke `/api/missions/churn/predict` using your exact configured preprocessing + model pipeline.',
      interactiveType: 'live-predict',
      successCriteria: {
        type: 'action',
        action: 'run-predict',
        explanation: 'Live inference verified with real sklearn class probabilities!',
      },
      hints: [
        'Try contrasting a 3-month Month-to-month customer with 5 support calls against a 48-month Two-year contract customer.',
      ],
      relatedConcepts: ['logistic-regression', 'random-forest'],
      relatedLabs: [],
      xp: 50,
    },
    {
      id: 'report',
      title: 'Stage 11: Mission Report',
      icon: '🏆',
      objective: 'Review your full ML workflow, verified model scorecard, and earned Mission Score.',
      content:
        'You have completed every stage from raw pandas schema inspection through live pipeline inference. Finalize to view your personalized scorecard computed directly from your pipeline decisions and metrics.',
      interactiveType: 'final-report',
      successCriteria: { type: 'action', action: 'view-report' },
      hints: [],
      relatedConcepts: [],
      relatedLabs: [],
      xp: 20,
    },
  ],
};

export const ALL_CHURN_FEATURES = [
  { key: 'tenure', label: 'Tenure', description: 'Months with company (1–72)', type: 'numeric' },
  { key: 'monthly_charges', label: 'Monthly Charges', description: 'Monthly bill $ (18–120)', type: 'numeric' },
  { key: 'total_charges', label: 'Total Charges', description: 'Cumulative billed $ (has 14 NaNs)', type: 'numeric' },
  { key: 'support_calls', label: 'Support Calls', description: 'Recent tickets 0–8 (has 10 NaNs)', type: 'numeric' },
  { key: 'senior_customer', label: 'Senior Customer', description: 'Binary age flag (0/1)', type: 'numeric' },
  { key: 'contract_type', label: 'Contract Type', description: 'Month-to-month / One year / Two year', type: 'categorical' },
  { key: 'internet_service', label: 'Internet Service', description: 'Fiber optic / DSL / No', type: 'categorical' },
  { key: 'payment_method', label: 'Payment Method', description: 'Electronic check / Mailed / Bank / Card', type: 'categorical' },
];

export const ALGORITHMS = [
  {
    id: 'logistic',
    name: 'Logistic Regression',
    icon: '📉',
    description: 'Linear probability boundary with Sigmoid output. Benefits heavily from StandardScaler and OneHotEncoder.',
    pros: ['Interpretable feature weights', 'Well-calibrated probabilities', 'Strong baseline'],
    cons: ['Linear boundary only', 'Sensitive to unscaled features'],
  },
  {
    id: 'knn',
    name: 'K-Nearest Neighbors',
    icon: '👥',
    description: 'Non-parametric distance classifier. Requires scaling numeric features so large dollar totals do not dominate.',
    pros: ['Captures local clusters', 'Zero training assumptions'],
    cons: ['Sensitive to feature scale', 'Can struggle with high-dim one-hot noise'],
  },
  {
    id: 'tree',
    name: 'Decision Tree',
    icon: '🌳',
    description: 'Learns explicit if/else threshold rules from Gini impurity. Naturally handles non-linear splits.',
    pros: ['Human-readable split rules', 'Handles non-linear boundaries'],
    cons: ['Prone to overfitting if depth unconstrained'],
  },
  {
    id: 'forest',
    name: 'Random Forest',
    icon: '🌲',
    description: 'Bootstrap ensemble of decorrelated trees. Averages variance while preserving strong non-linear accuracy.',
    pros: ['Best F1 & generalization balance', 'Robust to outliers', 'Ranks feature importances'],
    cons: ['Less transparent than a single tree'],
  },
];

/**
 * Compute genuine 0..100 Mission Score strictly from observed actions and model metrics.
 */
export function computeMissionScore({
  completedCount,
  totalSteps,
  hintsUsed,
  cleaningConfig,
  bestF1,
  bestRecall,
  debugScoreCount,
}) {
  // 1. Stage Completion: up to 40 pts
  const completionPts = (completedCount / Math.max(1, totalSteps)) * 40;

  // 2. Preprocessing Discipline (no leakage / proper imputation & encoding): up to 15 pts
  let prepPts = 0;
  if (cleaningConfig?.previewed) {
    prepPts += 5;
    if (cleaningConfig.missing_strategy === 'median_impute') prepPts += 4;
    if (cleaningConfig.categorical_encoding === 'onehot') prepPts += 3;
    if (cleaningConfig.scale_numeric) prepPts += 3;
  }

  // 3. Debugging Mastery (3 scenarios diagnosed): up to 15 pts
  const debugPts = Math.min(3, debugScoreCount || 0) * 5;

  // 4. Real Model Quality (best F1 + Recall on holdout test set): up to 30 pts
  const f1Pts = Math.min(20, Math.round((bestF1 || 0) * 30));
  const recallPts = Math.min(10, Math.round((bestRecall || 0) * 12));

  // 5. Hint Penalty: -2 pts per hint opened (capped at -10)
  const hintPenalty = Math.min(10, (hintsUsed || 0) * 2);

  const total = completionPts + prepPts + debugPts + f1Pts + recallPts - hintPenalty;
  return {
    total: Math.max(0, Math.min(100, Math.round(total))),
    breakdown: {
      completion: Math.round(completionPts),
      preprocessing: prepPts,
      debugging: debugPts,
      modelQuality: Math.min(30, f1Pts + recallPts),
      hintPenalty,
    },
  };
}
