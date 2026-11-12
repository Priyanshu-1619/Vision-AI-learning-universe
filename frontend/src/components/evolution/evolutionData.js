/**
 * Configuration-driven Evolution Tracks for Phase 8: Algorithm Evolution.
 * Every milestone strictly models:
 * Previous Algorithm -> Why It Failed (Limitation) -> Breakthrough Idea -> New Algorithm -> New Limitation
 */

export const EVOLUTION_TRACKS = [
  {
    id: 'sequence',
    title: 'Sequence Models',
    subtitle: 'From order-blind vectors to parallel self-attention Transformers',
    accentColor: '#ec4899',
    nodes: [
      {
        id: 'bow',
        name: 'Bag-of-Words / Linear',
        conceptId: 'linear-regression',
        era: 'Pre-Neural NLP',
        previousAlgorithm: 'Bag-of-Words / Linear',
        limitation:
          'Word frequency vectors are completely blind to token order ("dog bites man" equals "man bites dog") and cannot track context over time.',
        breakthroughIdea:
          'Pass sequence tokens one by one through a shared recurrent hidden state hₜ = tanh(Wₕhₜ₋₁ + Wₓxₜ) so memory carries forward.',
        newAlgorithm: 'Recurrent Neural Network (RNN)',
        newLimitation:
          'Repeated matrix multiplications across time cause gradients to vanish exponentially (γᵗ → 0) or explode over long sequences.',
        metrics: [
          { label: 'Order Awareness', before: 'None', after: 'Sequential hₜ' },
          { label: 'Path Length', before: 'N/A', after: 'O(T) steps' },
        ],
      },
      {
        id: 'rnn',
        name: 'RNN',
        conceptId: 'rnn',
        era: '1986–1997',
        previousAlgorithm: 'Vanilla RNN',
        limitation:
          'Vanilla RNNs compress history through multiplicative tanh updates, erasing long-range dependencies after ~10–15 steps.',
        breakthroughIdea:
          'Introduce an additive cell-state highway guarded by learnable Forget, Input, and Output gates that preserve gradients across time.',
        newAlgorithm: 'LSTM',
        newLimitation:
          'Still processes tokens strictly sequentially (step t waits for t−1), preventing parallel GPU training across long documents.',
        metrics: [
          { label: 'Gradient Reach', before: '~10 tokens', after: '100+ tokens' },
          { label: 'Memory Highway', before: 'Multiplicative', after: 'Additive Gates' },
        ],
      },
      {
        id: 'lstm',
        name: 'LSTM',
        conceptId: 'lstm',
        era: '1997–2014',
        previousAlgorithm: 'LSTM',
        limitation:
          'Even gated recurrent nets bottleneck an entire source sentence into a fixed-width hidden vector and cannot skip distant tokens directly.',
        breakthroughIdea:
          'Compute dynamic pairwise similarity weights softmax(QKᵀ/√dₖ)V so every output position directly queries every input token.',
        newAlgorithm: 'Attention Mechanism',
        newLimitation:
          'When attached onto an RNN/LSTM encoder-decoder, sequence encoding remains bound to serial recurrent steps.',
        metrics: [
          { label: 'Bottleneck', before: 'Fixed vector h_T', after: 'Dynamic Context' },
          { label: 'Max Path', before: 'O(T) hops', after: 'O(1) direct' },
        ],
      },
      {
        id: 'attention',
        name: 'Attention Mechanism',
        conceptId: 'attention',
        era: '2014–2017',
        previousAlgorithm: 'Seq2Seq + Attention',
        limitation:
          'Recurrent encoders still process token t after t−1 serially, slowing training on massive corpora.',
        breakthroughIdea:
          'Discard recurrence completely: stack Multi-Head Self-Attention + Positional Encodings to attend across all tokens in parallel.',
        newAlgorithm: 'Transformer',
        newLimitation:
          'All-to-all pairwise attention scales quadratically O(n²) in memory and compute with context window length n.',
        metrics: [
          { label: 'Sequential Steps', before: 'O(T) serial', after: 'O(1) parallel' },
          { label: 'Complexity', before: 'O(T · d²)', after: 'O(T² · d)' },
        ],
      },
      {
        id: 'transformer',
        name: 'Transformer',
        conceptId: 'transformer',
        era: '2017–Present',
        previousAlgorithm: 'Standard Transformer',
        limitation:
          'Standard dense self-attention incurs O(n²) memory/compute as context scales to tens of thousands of tokens.',
        breakthroughIdea:
          'Multi-head parallel self-attention unifies long-range token interaction with massive hardware parallelism.',
        newAlgorithm: 'Modern Foundation Transformers',
        newLimitation:
          'Active frontier research addresses O(n²) scaling via FlashAttention, sparse/linear attention, and state-space hybrids.',
        metrics: [
          { label: 'Parallelism', before: 'Sequential', after: 'Full Matrix Parallel' },
          { label: 'Direct Reach', before: 'T hops', after: '1 Attention Hop' },
        ],
      },
    ],
  },
  {
    id: 'trees',
    title: 'Tabular Trees',
    subtitle: 'From rigid linear cuts to variance-reducing forests and residual boosting',
    accentColor: '#f59e0b',
    nodes: [
      {
        id: 'linear',
        name: 'Linear Classifier',
        conceptId: 'logistic-regression',
        era: 'Classical Stats',
        previousAlgorithm: 'Linear Classifier',
        limitation:
          'Restricted to a single straight decision boundary wᵀx + b = 0; fails whenever features interact non-linearly.',
        breakthroughIdea:
          'Recursively split the feature space along informative axis thresholds using Gini impurity or MSE reduction.',
        newAlgorithm: 'Decision Tree',
        newLimitation:
          'Deep single trees memorize noise spikes—small perturbations in training data flip early splits (high variance).',
        metrics: [
          { label: 'Decision Boundary', before: 'Single Hyperplane', after: 'Axis-Aligned Regions' },
          { label: 'Bias / Variance', before: 'High Bias', after: 'Low Bias / High Var' },
        ],
      },
      {
        id: 'decision-tree',
        name: 'Decision Tree',
        conceptId: 'decision-tree',
        era: '1984–2001',
        previousAlgorithm: 'Decision Tree',
        limitation:
          'Unconstrained single trees overfit training noise with jagged high-variance step boundaries.',
        breakthroughIdea:
          'Train N decorrelated trees on bootstrap resamples + random feature subsets and average their predictions (Bagging).',
        newAlgorithm: 'Random Forest',
        newLimitation:
          'Independent parallel averaging reduces variance cleanly, but cannot iteratively correct systematic residual bias.',
        metrics: [
          { label: 'Primary Fix', before: 'Single High-Var Tree', after: 'Averaged N Trees' },
          { label: 'Parallelizable', before: '1 tree', after: 'Embarrassingly Parallel' },
        ],
      },
      {
        id: 'random-forest',
        name: 'Random Forest',
        conceptId: 'random-forest',
        era: '2001',
        previousAlgorithm: 'Random Forest',
        limitation:
          'Each tree trains independently without knowing where previous trees still make systematic errors.',
        breakthroughIdea:
          'Train shallow trees sequentially where each new tree fits the negative gradient (residuals) of the ensemble loss.',
        newAlgorithm: 'Gradient Boosted Trees',
        newLimitation:
          'Sequential residual fitting reduces bias sharply, but is harder to parallelize and sensitive to outliers without small learning rates.',
        metrics: [
          { label: 'Training Style', before: 'Parallel Bagging', after: 'Sequential Residuals' },
          { label: 'Bias Reduction', before: 'Moderate', after: 'Strong Additive' },
        ],
      },
      {
        id: 'gbdt',
        name: 'Gradient Boosted Trees',
        conceptId: 'gradient-descent',
        era: '2001–Present',
        previousAlgorithm: 'Gradient Boosted Trees',
        limitation:
          'Unregularized sequential boosting can overfit noisy labels and takes longer to tune than bagging.',
        breakthroughIdea:
          'Combine shallow weak learners via gradient descent in function space with shrinkage η and subsampling.',
        newAlgorithm: 'Regularized GBDT (XGBoost / LightGBM)',
        newLimitation:
          'Excels on structured tabular data, though lacks end-to-end representation learning for raw images, audio, and text.',
        metrics: [
          { label: 'Error Focus', before: 'Uniform Bagging', after: 'Loss Gradient Residuals' },
          { label: 'Tabular Accuracy', before: 'Strong Baseline', after: 'State-of-the-Art' },
        ],
      },
    ],
  },
  {
    id: 'vision',
    title: 'Spatial & Vision',
    subtitle: 'From dense pixel explosion to convolutional kernels and visual attention',
    accentColor: '#06b6d4',
    nodes: [
      {
        id: 'mlp',
        name: 'Dense MLP',
        conceptId: 'neural-networks',
        era: '1986–1998',
        previousAlgorithm: 'Dense MLP',
        limitation:
          'Connecting every pixel to every hidden neuron explodes parameters (H×W×C × hidden) and loses 2D spatial neighborhood & translation invariance.',
        breakthroughIdea:
          'Replace global dense weights with small k×k sliding kernels shared across all spatial locations.',
        newAlgorithm: 'Convolutional Neural Network (CNN)',
        newLimitation:
          'Small local kernels see only tiny patches in early layers and impose a rigid rectangular grid bias.',
        metrics: [
          { label: 'Weight Sharing', before: 'None (Per-Pixel)', after: 'Shared k×k Kernel' },
          { label: 'Translation Bias', before: 'Position-Locked', after: 'Equivariant' },
        ],
      },
      {
        id: 'cnn',
        name: 'CNN',
        conceptId: 'cnn',
        era: '1998–2020',
        previousAlgorithm: 'CNN',
        limitation:
          'Early convolutional layers cannot directly compare distant image regions without stacking many pooling/conv stages.',
        breakthroughIdea:
          'Tokenize images into patches (or hybrid conv stems) and let every patch attend globally to every other patch via Self-Attention.',
        newAlgorithm: 'Vision Transformer / Hybrid Attention',
        newLimitation:
          'Pure attention removes built-in local translation bias, requiring more training data or hybrid convolutional stages.',
        metrics: [
          { label: 'Early Context', before: 'Local k×k Window', after: 'Global Patch-to-Patch' },
          { label: 'Inductive Bias', before: 'Strong Spatial Grid', after: 'Data-Driven Relations' },
        ],
      },
      {
        id: 'vit',
        name: 'Vision Transformer / Hybrid',
        conceptId: 'transformer',
        era: '2020–Present',
        previousAlgorithm: 'Vision Transformer (ViT)',
        limitation:
          'Global patch attention scales quadratically with image resolution and benefits from convolutional stems on smaller datasets.',
        breakthroughIdea:
          'Unify local convolutional feature extraction with global self-attention across visual tokens.',
        newAlgorithm: 'Hybrid Conv-Attention Architectures',
        newLimitation:
          'Balances higher compute cost at high resolutions against superior global reasoning and multimodal alignment.',
        metrics: [
          { label: 'Receptive Field', before: 'Grows with Depth', after: 'Global from Layer 1' },
          { label: 'Multimodal Fit', before: 'Vision-Specific', after: 'Unified Token Space' },
        ],
      },
    ],
  },
];

export const CONCEPT_TO_EVOLUTION_TARGET = {
  'decision-tree': { track: 'trees', node: 'decision-tree' },
  'random-forest': { track: 'trees', node: 'random-forest' },
  cnn: { track: 'vision', node: 'cnn' },
  rnn: { track: 'sequence', node: 'rnn' },
  lstm: { track: 'sequence', node: 'lstm' },
  attention: { track: 'sequence', node: 'attention' },
  transformer: { track: 'sequence', node: 'transformer' },
};

export function getEvolutionTargetForConcept(conceptId) {
  return CONCEPT_TO_EVOLUTION_TARGET[conceptId] || null;
}

export function getEvolutionTrackById(trackId) {
  return EVOLUTION_TRACKS.find((t) => t.id === trackId) || EVOLUTION_TRACKS[0];
}
