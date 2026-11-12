/**
 * Pure neural computation engine for Phase 5: Inside the Model.
 * Covers single-neuron forward passes, 5 activation functions + derivatives,
 * softmax with temperature & entropy, and a 6-stage step-by-step backpropagation
 * state machine for a 2 -> 2 -> 1 network.
 */

export const CONCEPT_TO_INSIDE_MODEL_TAB = {
  'neural-networks': 'neuron',
  'activation-functions': 'activations',
  backpropagation: 'backprop',
};

export function getInsideModelTabForConcept(conceptId) {
  return CONCEPT_TO_INSIDE_MODEL_TAB[conceptId] || null;
}

export const ACTIVATION_SPECS = {
  sigmoid: {
    id: 'sigmoid',
    name: 'Sigmoid',
    formula: 'σ(z) = 1 / (1 + e⁻ᶻ)',
    derivativeFormula: "σ'(z) = σ(z) · (1 - σ(z))",
    rangeText: '(0, 1)',
    vanishingNote:
      'Saturates for |z| > 4 where σ\'(z) → 0, causing vanishing gradients in deep layers.',
  },
  tanh: {
    id: 'tanh',
    name: 'Tanh',
    formula: 'tanh(z) = (eᶻ - e⁻ᶻ) / (eᶻ + e⁻ᶻ)',
    derivativeFormula: "tanh'(z) = 1 - tanh²(z)",
    rangeText: '(-1, 1)',
    vanishingNote:
      'Zero-centered output helps optimization, though gradients still vanish for |z| > 3.',
  },
  relu: {
    id: 'relu',
    name: 'ReLU',
    formula: 'ReLU(z) = max(0, z)',
    derivativeFormula: "ReLU'(z) = 1 if z > 0 else 0",
    rangeText: '[0, ∞)',
    vanishingNote:
      'No vanishing gradient for z > 0, but neurons stuck at z ≤ 0 have zero gradient ("dying ReLU").',
  },
  leaky_relu: {
    id: 'leaky_relu',
    name: 'Leaky ReLU',
    formula: 'f(z) = z if z > 0 else α·z',
    derivativeFormula: "f'(z) = 1 if z > 0 else α",
    rangeText: '(-∞, ∞)',
    vanishingNote:
      'Preserves a small non-zero slope α for z ≤ 0 so inactive neurons can recover during backprop.',
  },
};

/**
 * Evaluate a scalar activation function φ(z) and its exact derivative φ'(z).
 */
export function evaluateActivation(activationId = 'sigmoid', z = 0, leakyAlpha = 0.1) {
  const clampedZ = Math.max(-60, Math.min(60, Number(z) || 0));

  switch (activationId) {
    case 'tanh': {
      const value = Math.tanh(clampedZ);
      const derivative = 1 - value * value;
      return { value, derivative };
    }
    case 'relu': {
      const value = clampedZ > 0 ? clampedZ : 0;
      const derivative = clampedZ > 0 ? 1 : 0;
      return { value, derivative };
    }
    case 'leaky_relu': {
      const alpha = Math.max(0.01, Math.min(0.5, Number(leakyAlpha) || 0.1));
      const value = clampedZ > 0 ? clampedZ : alpha * clampedZ;
      const derivative = clampedZ > 0 ? 1 : alpha;
      return { value, derivative };
    }
    case 'sigmoid':
    default: {
      const value = 1 / (1 + Math.exp(-clampedZ));
      const derivative = value * (1 - value);
      return { value, derivative };
    }
  }
}

/**
 * Numerically stable Softmax with temperature scaling.
 * Formula: pᵢ = exp((zᵢ - max(z)) / T) / Σⱼ exp((zⱼ - max(z)) / T)
 * Entropy: H(p) = -Σ pᵢ ln(pᵢ)
 * Jacobian diagonal: ∂pᵢ/∂zᵢ (at T=1) = pᵢ(1 - pᵢ)
 */
export function computeSoftmax(logits = [], temperature = 1.0) {
  if (!Array.isArray(logits) || logits.length === 0) {
    return { probabilities: [], argmax: -1, entropy: 0, jacobianDiag: [], sum: 0 };
  }

  const T = Math.max(0.05, Number(temperature) || 1.0);
  const scaled = logits.map((v) => (Number(v) || 0) / T);
  const maxVal = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - maxVal));
  const expSum = exps.reduce((acc, v) => acc + v, 0) || 1;
  const probabilities = exps.map((e) => e / expSum);

  let argmax = 0;
  for (let i = 1; i < probabilities.length; i += 1) {
    if (probabilities[i] > probabilities[argmax]) argmax = i;
  }

  const entropy = probabilities.reduce(
    (acc, p) => (p > 1e-12 ? acc - p * Math.log(p) : acc),
    0
  );

  const jacobianDiag = probabilities.map((p) => p * (1 - p));
  const sum = probabilities.reduce((acc, p) => acc + p, 0);

  return { probabilities, argmax, entropy, jacobianDiag, sum };
}

/**
 * Compute single-neuron forward pass:
 * z = Σ(xᵢ · wᵢ) + b,  y = φ(z),  dy/dz = φ'(z)
 */
export function computeNeuronForward({
  inputs = [1, 0.5, -0.5],
  weights = [0.8, 0.4, -0.6],
  bias = 0.1,
  activationId = 'sigmoid',
  leakyAlpha = 0.1,
}) {
  const terms = inputs.map((rawX, idx) => {
    const input = Number(rawX) || 0;
    const weight = Number(weights[idx]) || 0;
    return {
      index: idx,
      input,
      weight,
      product: input * weight,
    };
  });

  const weightedSum = terms.reduce((acc, t) => acc + t.product, 0);
  const b = Number(bias) || 0;
  const z = weightedSum + b;
  const { value: output, derivative } = evaluateActivation(activationId, z, leakyAlpha);

  return {
    terms,
    weightedSum,
    bias: b,
    z,
    output,
    derivative,
  };
}

// ---------------------------------------------------------------------------
// Step-by-Step Backpropagation State Machine (2 -> 2 -> 1 Network)
// ---------------------------------------------------------------------------

export const BACKPROP_STAGES = [
  { id: 'forward_hidden', label: '1. Forward Hidden', phase: 'forward' },
  { id: 'prediction', label: '2. Prediction', phase: 'forward' },
  { id: 'loss', label: '3. Loss', phase: 'loss' },
  { id: 'backward_output', label: '4. Backward Output', phase: 'backward' },
  { id: 'backward_hidden', label: '5. Backward Hidden', phase: 'backward' },
  { id: 'weight_update', label: '6. Weight Update', phase: 'update' },
];

export const DEFAULT_NETWORK_CONFIG = {
  x1: 0.9,
  x2: 0.25,
  target: 0.85,
  learningRate: 0.65,
  hiddenActivation: 'sigmoid',
};

export function createInitialNetworkWeights() {
  return {
    w1: [
      [0.45, -0.35],
      [-0.4, 0.55],
    ],
    b1: [0.1, -0.1],
    w2: [0.65, -0.5],
    b2: 0.05,
  };
}

/**
 * Compute full forward pass and backpropagation gradients for a 2->2->1 network.
 * Loss: L = 0.5 · (ŷ - y)²
 */
export function computeFullPassAndGradients(weights, config) {
  const { x1, x2, target, hiddenActivation } = config;
  const inputs = [x1, x2];

  // Stage 1: Forward hidden layer
  const z_h1 = weights.w1[0][0] * x1 + weights.w1[0][1] * x2 + weights.b1[0];
  const z_h2 = weights.w1[1][0] * x1 + weights.w1[1][1] * x2 + weights.b1[1];
  const act1 = evaluateActivation(hiddenActivation, z_h1);
  const act2 = evaluateActivation(hiddenActivation, z_h2);
  const h1 = act1.value;
  const h2 = act2.value;

  // Stage 2: Output prediction (sigmoid output neuron)
  const z_out = weights.w2[0] * h1 + weights.w2[1] * h2 + weights.b2;
  const actOut = evaluateActivation('sigmoid', z_out);
  const yHat = actOut.value;

  // Stage 3: MSE Loss = 0.5 * (yHat - y)^2
  const error = yHat - target;
  const loss = 0.5 * error * error;

  // Stage 4: Backward output layer
  const dL_dyHat = error;
  const dL_dzOut = dL_dyHat * actOut.derivative;
  const dL_dw2 = [dL_dzOut * h1, dL_dzOut * h2];
  const dL_db2 = dL_dzOut;

  // Stage 5: Backward hidden layer via chain rule
  const dL_dh = [dL_dzOut * weights.w2[0], dL_dzOut * weights.w2[1]];
  const dL_dzH = [dL_dh[0] * act1.derivative, dL_dh[1] * act2.derivative];
  const dL_dw1 = [
    [dL_dzH[0] * inputs[0], dL_dzH[0] * inputs[1]],
    [dL_dzH[1] * inputs[0], dL_dzH[1] * inputs[1]],
  ];
  const dL_db1 = [dL_dzH[0], dL_dzH[1]];

  return {
    forwardHidden: { z_h1, h1, dh1_dz: act1.derivative, z_h2, h2, dh2_dz: act2.derivative },
    prediction: { z_out, yHat, dy_dz: actOut.derivative },
    lossInfo: { error, loss },
    backwardOutput: { dL_dyHat, dL_dzOut, dL_dw2, dL_db2 },
    backwardHidden: { dL_dh, dL_dzH, dL_dw1, dL_db1 },
  };
}

/**
 * Apply gradient descent weight update w <- w - η · grad.
 */
export function applyNetworkWeightUpdate(weights, gradients, learningRate) {
  const lr = Math.max(0.01, Number(learningRate) || 0.1);
  const { dL_dw2, dL_db2 } = gradients.backwardOutput;
  const { dL_dw1, dL_db1 } = gradients.backwardHidden;

  return {
    w1: [
      [weights.w1[0][0] - lr * dL_dw1[0][0], weights.w1[0][1] - lr * dL_dw1[0][1]],
      [weights.w1[1][0] - lr * dL_dw1[1][0], weights.w1[1][1] - lr * dL_dw1[1][1]],
    ],
    b1: [weights.b1[0] - lr * dL_db1[0], weights.b1[1] - lr * dL_db1[1]],
    w2: [weights.w2[0] - lr * dL_dw2[0], weights.w2[1] - lr * dL_dw2[1]],
    b2: weights.b2 - lr * dL_db2,
  };
}

/**
 * Create initial state for the 6-stage backpropagation stepper.
 */
export function createInitialBackpropState(config = DEFAULT_NETWORK_CONFIG) {
  const weights = createInitialNetworkWeights();
  const snapshot = computeFullPassAndGradients(weights, config);

  return {
    cycle: 1,
    stageIndex: 0, // Starts at Stage 1 (forward_hidden)
    weights,
    previousWeights: null,
    snapshot,
    lossHistory: [{ step: 0, loss: snapshot.lossInfo.loss, yHat: snapshot.prediction.yHat }],
  };
}

/**
 * Advance the backpropagation state machine by exactly one stage (1..6).
 * Advancing past stage 6 (weight_update) begins the next cycle at stage 1 (forward_hidden).
 */
export function advanceBackpropStage(state, config) {
  const nextStage = state.stageIndex + 1;

  // Moving from weight_update (5) -> start new cycle at forward_hidden (0)
  if (nextStage >= BACKPROP_STAGES.length) {
    const freshSnapshot = computeFullPassAndGradients(state.weights, config);
    return {
      ...state,
      cycle: state.cycle + 1,
      stageIndex: 0,
      previousWeights: null,
      snapshot: freshSnapshot,
    };
  }

  // Entering weight_update (5): apply gradient descent and record updated loss
  if (nextStage === BACKPROP_STAGES.length - 1) {
    const preSnapshot = computeFullPassAndGradients(state.weights, config);
    const updatedWeights = applyNetworkWeightUpdate(
      state.weights,
      preSnapshot,
      config.learningRate
    );
    const postSnapshot = computeFullPassAndGradients(updatedWeights, config);
    const nextStep = state.lossHistory.length;

    return {
      ...state,
      stageIndex: nextStage,
      previousWeights: state.weights,
      weights: updatedWeights,
      snapshot: preSnapshot,
      lossHistory: [
        ...state.lossHistory,
        { step: nextStep, loss: postSnapshot.lossInfo.loss, yHat: postSnapshot.prediction.yHat },
      ],
    };
  }

  return {
    ...state,
    stageIndex: nextStage,
  };
}

/**
 * Complete one full forward -> backward -> weight_update cycle in one action.
 * Always executes up through weight_update (stage 5) and records loss history.
 */
export function completeBackpropCycle(state, config) {
  let workingState = state;
  // If already sitting on weight_update (5), advance once to start a fresh cycle
  if (workingState.stageIndex >= BACKPROP_STAGES.length - 1) {
    workingState = advanceBackpropStage(workingState, config);
  }
  while (workingState.stageIndex < BACKPROP_STAGES.length - 1) {
    workingState = advanceBackpropStage(workingState, config);
  }
  return workingState;
}
