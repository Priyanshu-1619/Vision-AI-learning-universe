// Concept Engine: fallback data, graph builder, link resolution, and local progress tracking

const EXPLORED_STORAGE_KEY = 'ai_universe_explored_concepts';
export const EXPLORED_UPDATED_EVENT = 'ai-universe:explored-updated';

// Fallback mock data for when the backend is not available
export const MOCK_CONCEPTS = [
  {
    id: 'gradient-descent',
    title: 'Gradient Descent',
    category: 'Optimization',
    difficulty: 'Intermediate',
    icon: '🔻',
    color: '#ef4444',
    prerequisites: ['derivative', 'loss-function'],
    definition:
      'An iterative optimization algorithm that finds the minimum of a function by repeatedly moving in the direction of steepest descent.',
    mathematics: {
      formulas: ['θₜ₊₁ = θₜ - α · ∇J(θₜ)'],
      explanation:
        'At each step, parameters θ are updated in the opposite direction of the loss gradient ∇J(θ) scaled by the learning rate α.',
    },
    visualization: { type: 'gradient-descent', parameters: { learningRate: 0.1, steps: 30 } },
    relatedConcepts: ['loss-function', 'backpropagation', 'optimization'],
    nextConcepts: ['backpropagation', 'neural-networks'],
  },
  {
    id: 'neural-networks',
    title: 'Neural Networks',
    category: 'Deep Learning',
    difficulty: 'Intermediate',
    icon: '🧠',
    color: '#ec4899',
    prerequisites: ['linear-algebra', 'machine-learning'],
    definition:
      'Computing systems inspired by biological neural networks that learn to perform tasks by considering examples.',
    mathematics: {
      formulas: ['y = σ(W · x + b)'],
      explanation:
        'Each layer applies an affine transformation Wx + b followed by a non-linear activation function σ.',
    },
    visualization: { type: 'neural-network', parameters: { layers: [3, 4, 2] } },
    relatedConcepts: ['backpropagation', 'cnn', 'attention'],
    nextConcepts: ['backpropagation', 'cnn', 'attention'],
  },
  {
    id: 'linear-regression',
    title: 'Linear Regression',
    category: 'Algorithms',
    difficulty: 'Beginner',
    icon: '📈',
    color: '#f59e0b',
    prerequisites: ['statistics', 'linear-algebra'],
    definition:
      'A linear approach to modelling the relationship between a dependent variable and one or more independent variables.',
    mathematics: {
      formulas: ['ŷ = wᵀx + b', 'L(w, b) = (1/n) Σ (yᵢ - ŷᵢ)²'],
      explanation:
        'Predicts a continuous target as a weighted sum of inputs, typically fit by minimizing Mean Squared Error.',
    },
    visualization: { type: 'regression-line', parameters: { noise: 0.2 } },
    relatedConcepts: ['supervised-learning', 'loss-function'],
    nextConcepts: ['gradient-descent', 'overfitting'],
  },
  {
    id: 'backpropagation',
    title: 'Backpropagation',
    category: 'Deep Learning',
    difficulty: 'Advanced',
    icon: '🔄',
    color: '#ec4899',
    prerequisites: ['neural-networks', 'gradient-descent'],
    definition:
      'An algorithm for training neural networks by computing the gradient of the loss function with respect to each weight.',
    mathematics: {
      formulas: ['∂L/∂Wˡ = (∂L/∂aˡ) · (∂aˡ/∂zˡ) · (∂zˡ/∂Wˡ)'],
      explanation:
        'Applies the calculus chain rule backward from the output layer to propagate error signals through all weights.',
    },
    visualization: { type: 'backprop-flow', parameters: {} },
    relatedConcepts: ['neural-networks', 'gradient-descent', 'loss-function'],
    nextConcepts: ['cnn', 'attention'],
  },
  {
    id: 'transformer',
    title: 'Transformer',
    category: 'Deep Learning',
    difficulty: 'Advanced',
    icon: '⚡',
    color: '#ec4899',
    prerequisites: ['attention', 'neural-networks'],
    definition:
      'An architecture that relies entirely on attention mechanisms to draw global dependencies between input and output.',
    mathematics: {
      formulas: ['MultiHead(Q, K, V) = Concat(head₁, ..., headₕ)Wᴼ'],
      explanation:
        'Processes tokens in parallel using stacked self-attention and feed-forward sublayers with positional encodings.',
    },
    visualization: { type: 'transformer-architecture', parameters: { heads: 8 } },
    relatedConcepts: ['attention', 'neural-networks'],
    nextConcepts: [],
  },
  {
    id: 'k-means',
    title: 'K-Means Clustering',
    category: 'Algorithms',
    difficulty: 'Beginner',
    icon: '🎯',
    color: '#f59e0b',
    prerequisites: ['statistics', 'linear-algebra'],
    definition:
      'A partitioning method that divides n observations into k clusters, each belonging to the cluster with the nearest mean.',
    mathematics: {
      formulas: ['J = Σₖ Σₓ∈Cₖ ||x - μₖ||²'],
      explanation:
        'Alternates between assigning points to the nearest centroid μₖ and recomputing centroids as cluster means.',
    },
    visualization: { type: 'clustering-2d', parameters: { k: 3 } },
    relatedConcepts: ['unsupervised-learning', 'pca'],
    nextConcepts: ['pca'],
  },
  {
    id: 'cnn',
    title: 'Convolutional Neural Networks',
    category: 'Deep Learning',
    difficulty: 'Advanced',
    icon: '🖼️',
    color: '#ec4899',
    prerequisites: ['neural-networks', 'linear-algebra'],
    definition:
      'A class of deep neural networks most commonly applied to analyzing visual imagery using convolutional layers.',
    mathematics: {
      formulas: ['(I * K)(i, j) = Σₘ Σₙ I(i + m, j + n) · K(m, n)'],
      explanation:
        'Learnable spatial filters K slide across input feature maps I to extract local patterns with weight sharing.',
    },
    visualization: { type: 'convolution-grid', parameters: { kernelSize: 3 } },
    relatedConcepts: ['neural-networks', 'backpropagation'],
    nextConcepts: ['transformer'],
  },
  {
    id: 'decision-tree',
    title: 'Decision Trees',
    category: 'Algorithms',
    difficulty: 'Beginner',
    icon: '🌳',
    color: '#f59e0b',
    prerequisites: ['statistics', 'supervised-learning'],
    definition:
      'A tree-structured classifier where internal nodes represent features, branches represent decision rules, and leaves represent outcomes.',
    mathematics: {
      formulas: ['Gini(D) = 1 - Σ pᵢ²', 'H(D) = -Σ pᵢ log₂(pᵢ)'],
      explanation:
        'Splits data recursively on the feature threshold that maximizes impurity reduction (Gini or Information Gain).',
    },
    visualization: { type: 'decision-boundary', parameters: { maxDepth: 4 } },
    relatedConcepts: ['supervised-learning', 'overfitting'],
    nextConcepts: ['overfitting'],
  },
  {
    id: 'pca',
    title: 'Principal Component Analysis',
    category: 'Algorithms',
    difficulty: 'Intermediate',
    icon: '📊',
    color: '#f59e0b',
    prerequisites: ['linear-algebra', 'statistics'],
    definition:
      'A dimensionality reduction technique that transforms data into a new coordinate system of orthogonal principal components.',
    mathematics: {
      formulas: ['Σv = λv', 'Z = XWₖ'],
      explanation:
        'Finds eigenvectors of the covariance matrix Σ ordered by largest eigenvalue λ to preserve maximum variance.',
    },
    visualization: { type: 'pca-projection', parameters: { components: 2 } },
    relatedConcepts: ['linear-algebra', 'unsupervised-learning'],
    nextConcepts: ['k-means'],
  },
  {
    id: 'overfitting',
    title: 'Overfitting',
    category: 'Evaluation',
    difficulty: 'Beginner',
    icon: '📉',
    color: '#f97316',
    prerequisites: ['machine-learning'],
    definition:
      'When a model learns the training data too well, including noise and fluctuations, reducing its ability to generalize.',
    mathematics: {
      formulas: ['E[(y - ŷ)²] = Bias² + Variance + σ²'],
      explanation:
        'High model complexity reduces bias on training data but increases variance on unseen validation samples.',
    },
    visualization: { type: 'bias-variance-curve', parameters: { degree: 9 } },
    relatedConcepts: ['decision-tree', 'loss-function'],
    nextConcepts: [],
  },
  {
    id: 'attention',
    title: 'Attention Mechanism',
    category: 'Deep Learning',
    difficulty: 'Advanced',
    icon: '👁️',
    color: '#ec4899',
    prerequisites: ['neural-networks'],
    definition:
      'A mechanism that allows models to focus on relevant parts of the input sequence when producing output.',
    mathematics: {
      formulas: ['Attention(Q, K, V) = softmax(QKᵀ / √dₖ) · V'],
      explanation:
        'Computes similarity weights between queries Q and keys K, then forms a weighted sum over values V.',
    },
    visualization: { type: 'attention-heatmap', parameters: {} },
    relatedConcepts: ['transformer', 'neural-networks'],
    nextConcepts: ['transformer'],
  },
  {
    id: 'loss-function',
    title: 'Loss Function',
    category: 'Optimization',
    difficulty: 'Intermediate',
    icon: '📐',
    color: '#ef4444',
    prerequisites: ['statistics', 'derivative'],
    definition:
      'A function that maps values of one or more variables onto a real number representing some "cost" associated with those values.',
    mathematics: {
      formulas: ['MSE = (1/n) Σ (yᵢ - ŷᵢ)²', 'BCE = -(y log(p) + (1 - y) log(1 - p))'],
      explanation:
        'Quantifies prediction error so optimization algorithms have a scalar objective surface to minimize.',
    },
    visualization: { type: 'loss-surface', parameters: {} },
    relatedConcepts: ['gradient-descent', 'linear-regression'],
    nextConcepts: ['gradient-descent', 'backpropagation'],
  },
  {
    id: 'data',
    title: 'Data',
    category: 'Foundations',
    difficulty: 'Beginner',
    icon: '💾',
    color: '#06b6d4',
    prerequisites: [],
    definition: 'Raw facts, figures, and observations that are collected and stored for analysis.',
    mathematics: {
      formulas: ['D = {(x₁, y₁), (x₂, y₂), ..., (xₙ, yₙ)}'],
      explanation:
        'A dataset is modeled as n observations where each xᵢ is a feature vector and yᵢ is an optional target label.',
    },
    visualization: { type: 'data-table', parameters: {} },
    relatedConcepts: ['statistics', 'probability'],
    nextConcepts: ['statistics', 'probability'],
  },
  {
    id: 'statistics',
    title: 'Statistics',
    category: 'Foundations',
    difficulty: 'Beginner',
    icon: '📊',
    color: '#06b6d4',
    prerequisites: ['data'],
    definition: 'The science of collecting, analyzing, interpreting, and presenting data.',
    mathematics: {
      formulas: ['μ = (1/n) Σ xᵢ', 'σ² = (1/n) Σ (xᵢ - μ)²'],
      explanation:
        'Mean μ captures central tendency while variance σ² measures spread around the mean.',
    },
    visualization: { type: 'histogram', parameters: {} },
    relatedConcepts: ['probability', 'data'],
    nextConcepts: ['probability', 'machine-learning'],
  },
  {
    id: 'probability',
    title: 'Probability',
    category: 'Foundations',
    difficulty: 'Beginner',
    icon: '🎲',
    color: '#06b6d4',
    prerequisites: ['data', 'statistics'],
    definition:
      'The branch of mathematics concerning numerical descriptions of how likely an event is to occur.',
    mathematics: {
      formulas: ['P(A|B) = P(B|A) · P(A) / P(B)'],
      explanation:
        'Bayes theorem updates prior belief P(A) into posterior probability P(A|B) after observing evidence B.',
    },
    visualization: { type: 'distribution', parameters: {} },
    relatedConcepts: ['statistics', 'data'],
    nextConcepts: ['machine-learning'],
  },
  {
    id: 'linear-algebra',
    title: 'Linear Algebra',
    category: 'Foundations',
    difficulty: 'Intermediate',
    icon: '🔢',
    color: '#06b6d4',
    prerequisites: [],
    definition:
      'The branch of mathematics concerning linear equations, linear maps, and their representations in vector spaces.',
    mathematics: {
      formulas: ['y = Ax', 'a · b = Σ aᵢbᵢ'],
      explanation:
        'Matrices act as linear transformations on vectors; dot products measure alignment and projection.',
    },
    visualization: { type: 'vector-transform', parameters: {} },
    relatedConcepts: ['pca', 'neural-networks'],
    nextConcepts: ['machine-learning', 'neural-networks', 'pca'],
  },
  {
    id: 'machine-learning',
    title: 'Machine Learning',
    category: 'Core ML',
    difficulty: 'Beginner',
    icon: '🤖',
    color: '#3b82f6',
    prerequisites: ['statistics', 'linear-algebra'],
    definition:
      'A subset of AI that enables systems to learn and improve from experience without being explicitly programmed.',
    mathematics: {
      formulas: ['θ* = argmin_θ L(f(X; θ), y)'],
      explanation:
        'Learning adjusts parameters θ of a hypothesis function f to minimize empirical loss over training examples.',
    },
    visualization: { type: 'ml-pipeline', parameters: {} },
    relatedConcepts: ['supervised-learning', 'unsupervised-learning'],
    nextConcepts: ['supervised-learning', 'unsupervised-learning', 'overfitting'],
  },
  {
    id: 'supervised-learning',
    title: 'Supervised Learning',
    category: 'Core ML',
    difficulty: 'Beginner',
    icon: '🏷️',
    color: '#3b82f6',
    prerequisites: ['machine-learning'],
    definition: 'A type of machine learning where the model is trained on labeled data.',
    mathematics: {
      formulas: ['f : X → Y'],
      explanation:
        'Learns a mapping from input features X to known target outputs Y using paired training examples.',
    },
    visualization: { type: 'scatter-labeled', parameters: {} },
    relatedConcepts: ['machine-learning', 'linear-regression', 'decision-tree'],
    nextConcepts: ['linear-regression', 'decision-tree'],
  },
  {
    id: 'unsupervised-learning',
    title: 'Unsupervised Learning',
    category: 'Core ML',
    difficulty: 'Beginner',
    icon: '🔍',
    color: '#3b82f6',
    prerequisites: ['machine-learning'],
    definition: 'A type of machine learning where the model finds patterns in unlabeled data.',
    mathematics: {
      formulas: ['p(x) or C = {C₁, ..., Cₖ}'],
      explanation:
        'Discovers latent clusters, manifolds, or density structure directly from unlabeled feature vectors X.',
    },
    visualization: { type: 'clustering-2d', parameters: {} },
    relatedConcepts: ['machine-learning', 'k-means', 'pca'],
    nextConcepts: ['k-means', 'pca'],
  },
  {
    id: 'derivative',
    title: 'Derivatives',
    category: 'Mathematics',
    difficulty: 'Intermediate',
    icon: '∂',
    color: '#8b5cf6',
    prerequisites: [],
    definition:
      'A measure of how a function changes as its input changes — the instantaneous rate of change.',
    mathematics: {
      formulas: ["f'(x) = lim_{h→0} (f(x + h) - f(x)) / h"],
      explanation:
        'The derivative gives the slope of the tangent line at x, guiding optimization toward local minima.',
    },
    visualization: { type: 'tangent-slope', parameters: {} },
    relatedConcepts: ['gradient-descent', 'loss-function'],
    nextConcepts: ['loss-function', 'gradient-descent'],
  },
];

export const MOCK_CATEGORIES = [
  { name: 'Foundations', count: 4, color: '#06b6d4' },
  { name: 'Mathematics', count: 4, color: '#8b5cf6' },
  { name: 'Data Science', count: 2, color: '#10b981' },
  { name: 'Core ML', count: 3, color: '#3b82f6' },
  { name: 'Algorithms', count: 7, color: '#f59e0b' },
  { name: 'Optimization', count: 3, color: '#ef4444' },
  { name: 'Deep Learning', count: 7, color: '#ec4899' },
  { name: 'Evaluation', count: 5, color: '#f97316' },
];

/**
 * Build a graph { nodes, edges } from a concept list, matching the backend
 * `/api/concepts/graph` response contract.
 */
export function buildGraphFromConcepts(concepts = []) {
  const conceptIds = new Set(concepts.map((c) => c.id));

  const nodes = concepts.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    difficulty: c.difficulty,
    icon: c.icon,
    color: c.color,
  }));

  const edges = [];
  const seen = new Set();

  for (const c of concepts) {
    for (const prereq of c.prerequisites || []) {
      if (conceptIds.has(prereq)) {
        const key = `${prereq}->${c.id}:prerequisite`;
        if (!seen.has(key)) {
          edges.push({ source: prereq, target: c.id, type: 'prerequisite' });
          seen.add(key);
        }
      }
    }

    for (const rel of c.relatedConcepts || []) {
      if (conceptIds.has(rel)) {
        const fwd = `${c.id}<->${rel}:related`;
        const rev = `${rel}<->${c.id}:related`;
        if (!seen.has(fwd) && !seen.has(rev)) {
          edges.push({ source: c.id, target: rel, type: 'related' });
          seen.add(fwd);
          seen.add(rev);
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * Resolve prerequisite, related, and next concept IDs on a concept into full
 * concept objects from `allConcepts`.
 */
export function resolveConceptLinks(concept, allConcepts = []) {
  if (!concept) {
    return { prerequisites: [], relatedConcepts: [], nextConcepts: [] };
  }

  const byId = new Map(allConcepts.map((c) => [c.id, c]));
  const resolveList = (ids = []) =>
    Array.from(new Set(ids))
      .map((id) => byId.get(id))
      .filter(Boolean);

  const prerequisites = resolveList(concept.prerequisites);
  const relatedConcepts = resolveList(concept.relatedConcepts);

  let nextConcepts = resolveList(concept.nextConcepts);
  if (nextConcepts.length === 0) {
    nextConcepts = allConcepts.filter(
      (c) => c.id !== concept.id && (c.prerequisites || []).includes(concept.id)
    );
  }

  return { prerequisites, relatedConcepts, nextConcepts };
}

/**
 * Return the list of concept IDs the user has explored (stored in localStorage).
 */
export function getExploredIds() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(EXPLORED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.filter((id) => typeof id === 'string' && id.trim())));
  } catch {
    return [];
  }
}

/**
 * Persist a concept ID as explored in localStorage and notify listeners.
 */
export function markConceptExplored(id) {
  if (!id || typeof window === 'undefined' || !window.localStorage) return [];
  const current = getExploredIds();
  if (!current.includes(id)) {
    const next = [...current, id];
    try {
      window.localStorage.setItem(EXPLORED_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(EXPLORED_UPDATED_EVENT, { detail: next }));
    } catch {
      // Ignore storage quota errors
    }
    return next;
  }
  return current;
}

/**
 * Remove a concept ID from explored concepts in localStorage and notify listeners.
 */
export function unmarkConceptExplored(id) {
  if (!id || typeof window === 'undefined' || !window.localStorage) return [];
  const current = getExploredIds();
  if (current.includes(id)) {
    const next = current.filter((item) => item !== id);
    try {
      window.localStorage.setItem(EXPLORED_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(EXPLORED_UPDATED_EVENT, { detail: next }));
    } catch {
      // Ignore storage quota errors
    }
    return next;
  }
  return current;
}

/**
 * Toggle explored status for a concept ID in localStorage.
 */
export function toggleConceptExplored(id) {
  const current = getExploredIds();
  if (current.includes(id)) {
    return { exploredIds: unmarkConceptExplored(id), isExplored: false };
  }
  return { exploredIds: markConceptExplored(id), isExplored: true };
}

/**
 * Compute full upstream prerequisite lineage, downstream unlock descendants,
 * and direct related concept IDs for a given concept from graph edges.
 *
 * @returns {{ ancestorIds: Set<string>, descendantIds: Set<string>, relatedIds: Set<string> }}
 */
export function getConceptLineage(conceptId, edges = []) {
  const ancestorIds = new Set();
  const descendantIds = new Set();
  const relatedIds = new Set();

  if (!conceptId || !Array.isArray(edges)) {
    return { ancestorIds, descendantIds, relatedIds };
  }

  const parentsMap = new Map();
  const childrenMap = new Map();

  for (const edge of edges) {
    const rawSource = edge.source ?? edge.sourceId;
    const rawTarget = edge.target ?? edge.targetId;
    const source = typeof rawSource === 'object' ? rawSource?.id : rawSource;
    const target = typeof rawTarget === 'object' ? rawTarget?.id : rawTarget;
    if (!source || !target) continue;

    if (edge.type === 'prerequisite') {
      if (!childrenMap.has(source)) childrenMap.set(source, []);
      childrenMap.get(source).push(target);

      if (!parentsMap.has(target)) parentsMap.set(target, []);
      parentsMap.get(target).push(source);
    } else if (edge.type === 'related') {
      if (source === conceptId && target !== conceptId) relatedIds.add(target);
      if (target === conceptId && source !== conceptId) relatedIds.add(source);
    }
  }

  const walk = (startMap, visited) => {
    const queue = [...(startMap.get(conceptId) || [])];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur === conceptId || visited.has(cur)) continue;
      visited.add(cur);
      for (const next of startMap.get(cur) || []) {
        if (!visited.has(next) && next !== conceptId) {
          queue.push(next);
        }
      }
    }
  };

  walk(parentsMap, ancestorIds);
  walk(childrenMap, descendantIds);

  return { ancestorIds, descendantIds, relatedIds };
}

/**
 * Compute real exploration progress stats based on localStorage and total concepts.
 */
export function getProgressStats(totalCount, validConceptIds = null) {
  const exploredIds = getExploredIds();
  const filteredIds = validConceptIds
    ? exploredIds.filter((id) => validConceptIds.has(id))
    : exploredIds;

  const safeTotal = Math.max(0, Number(totalCount) || 0);
  const exploredCount = safeTotal > 0 ? Math.min(filteredIds.length, safeTotal) : filteredIds.length;
  const percentage = safeTotal > 0 ? Math.min(100, Math.round((exploredCount / safeTotal) * 100)) : 0;

  return {
    exploredCount,
    totalCount: safeTotal,
    percentage,
  };
}
