/**
 * Pure simulation calculations for Phase 8: Algorithm Evolution.
 * Models sequence memory decay vs O(1) attention, single tree variance vs bagged forest,
 * and dense MLP parameter explosion vs shared convolutional kernels.
 */

// ---------------------------------------------------------------------------
// 1. Sequence Memory & Parallelism Lab (RNN vs LSTM vs Attention/Transformer)
// ---------------------------------------------------------------------------

/**
 * Compute gradient signal retention across token distance t = 1..T,
 * sequential step counts, and focus-token attention link profile.
 */
export function simulateSequenceMemory({
  seqLength = 24,
  gamma = 0.78,
  focusToken = 20,
}) {
  const T = Math.max(4, Math.min(40, Math.round(Number(seqLength) || 24)));
  const clampedGamma = Math.max(0.55, Math.min(0.95, Number(gamma) || 0.78));
  const clampedFocus = Math.max(1, Math.min(T, Math.round(Number(focusToken) || T)));

  // LSTM forget-gate keeps cell highway retention near ~0.95-0.985
  const lstmGate = Math.min(0.988, 0.915 + 0.075 * clampedGamma);

  const curve = [];
  for (let d = 1; d <= T; d += 1) {
    const rnnSignal = Math.pow(clampedGamma, d);
    const lstmSignal = Math.pow(lstmGate, d);
    const attentionSignal = 1.0; // Direct O(1) path independent of distance

    curve.push({
      distance: d,
      rnn: rnnSignal,
      lstm: lstmSignal,
      attention: attentionSignal,
    });
  }

  // Deterministic attention weight distribution from focusToken across all tokens 1..T
  const anchorToken = Math.max(1, Math.min(T, Math.round(T * 0.18)));
  const rawScores = [];
  for (let i = 1; i <= T; i += 1) {
    const distToAnchor = Math.abs(i - anchorToken);
    const distToSelf = Math.abs(i - clampedFocus);
    const semanticScore =
      2.6 * Math.exp(-0.35 * distToAnchor * distToAnchor) +
      1.7 * Math.exp(-0.4 * distToSelf * distToSelf) +
      0.2;
    rawScores.push(semanticScore);
  }
  const maxScore = Math.max(...rawScores);
  const exps = rawScores.map((s) => Math.exp(s - maxScore));
  const expSum = exps.reduce((a, b) => a + b, 0) || 1;
  const attentionWeights = exps.map((e, idx) => ({
    token: idx + 1,
    weight: e / expSum,
  }));

  const endPoint = curve[curve.length - 1];

  return {
    seqLength: T,
    gamma: clampedGamma,
    focusToken: clampedFocus,
    anchorToken,
    lstmGate,
    curve,
    attentionWeights,
    summary: {
      rnnEndRetention: endPoint.rnn,
      lstmEndRetention: endPoint.lstm,
      attentionRetention: 1.0,
      rnnSequentialSteps: T,
      transformerSequentialSteps: 1,
      attentionPairs: T * T,
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Overfitting & Variance Reduction Lab (Single Decision Tree vs Random Forest)
// ---------------------------------------------------------------------------

function trueWave(x) {
  return Math.sin(1.35 * x) + 0.35 * Math.cos(2.3 * x);
}

/**
 * Fit a deterministic 1D piecewise-constant regression tree by minimizing MSE.
 */
function fitRegressionTree1D(points, maxDepth = 4, minLeaf = 1) {
  function buildNode(subset, depth) {
    const mean =
      subset.length > 0
        ? subset.reduce((sum, p) => sum + p.y, 0) / subset.length
        : 0;

    if (depth >= maxDepth || subset.length <= Math.max(1, minLeaf)) {
      return { isLeaf: true, value: mean };
    }

    const sorted = [...subset].sort((a, b) => a.x - b.x);
    let bestThreshold = null;
    let bestLoss = Infinity;
    let bestLeft = null;
    let bestRight = null;

    for (let i = 0; i < sorted.length - 1; i += 1) {
      if (Math.abs(sorted[i + 1].x - sorted[i].x) < 1e-6) continue;
      const threshold = (sorted[i].x + sorted[i + 1].x) / 2;
      const left = sorted.slice(0, i + 1);
      const right = sorted.slice(i + 1);

      const leftMean = left.reduce((s, p) => s + p.y, 0) / left.length;
      const rightMean = right.reduce((s, p) => s + p.y, 0) / right.length;
      const sse =
        left.reduce((s, p) => s + (p.y - leftMean) ** 2, 0) +
        right.reduce((s, p) => s + (p.y - rightMean) ** 2, 0);

      if (sse < bestLoss) {
        bestLoss = sse;
        bestThreshold = threshold;
        bestLeft = left;
        bestRight = right;
      }
    }

    if (bestThreshold === null || !bestLeft?.length || !bestRight?.length) {
      return { isLeaf: true, value: mean };
    }

    return {
      isLeaf: false,
      threshold: bestThreshold,
      left: buildNode(bestLeft, depth + 1),
      right: buildNode(bestRight, depth + 1),
    };
  }

  const root = buildNode(points, 0);

  return function predict(x) {
    let node = root;
    while (node && !node.isLeaf) {
      node = x <= node.threshold ? node.left : node.right;
    }
    return node ? node.value : 0;
  };
}

/**
 * Simulate single Decision Tree vs N-tree bagged Random Forest on noisy 1D wave data.
 */
export function simulateTreeEnsemble({
  depth = 6,
  noiseLevel = 0.35,
  ensembleSize = 15,
}) {
  const clampedDepth = Math.max(1, Math.min(8, Math.round(Number(depth) || 6)));
  const clampedNoise = Math.max(0.05, Math.min(0.7, Number(noiseLevel) || 0.35));
  const N = Math.max(1, Math.min(30, Math.round(Number(ensembleSize) || 15)));

  const nTrain = 34;
  const trainPoints = [];
  for (let i = 0; i < nTrain; i += 1) {
    const x = -2.5 + (i / (nTrain - 1)) * 5.0;
    // Deterministic pseudo-random noise wave
    const pseudo = Math.sin(i * 17.3 + 1.9) * 0.65 + Math.cos(i * 31.7) * 0.35;
    const y = trueWave(x) + clampedNoise * 1.4 * pseudo;
    trainPoints.push({ id: i, x, y });
  }

  const nTest = 60;
  const testPoints = [];
  for (let i = 0; i < nTest; i += 1) {
    const x = -2.5 + (i / (nTest - 1)) * 5.0;
    const pseudoTest = Math.sin(i * 23.1 + 4.7) * 0.65 + Math.cos(i * 11.3) * 0.35;
    const y = trueWave(x) + clampedNoise * 0.65 * pseudoTest;
    testPoints.push({ x, y, truth: trueWave(x) });
  }

  // Fit single deep decision tree on full training set
  const singlePredict = fitRegressionTree1D(trainPoints, clampedDepth, 1);

  // Fit N bootstrap trees (random sample with replacement + small jitter/subsampling)
  const forestPredictors = [];
  for (let t = 0; t < N; t += 1) {
    const bag = [];
    for (let j = 0; j < nTrain; j += 1) {
      const idx = Math.floor(
        Math.abs(Math.sin((t + 1) * 97.13 + (j + 1) * 41.7)) * nTrain
      ) % nTrain;
      bag.push(trainPoints[idx]);
    }
    forestPredictors.push(fitRegressionTree1D(bag, clampedDepth, 2));
  }

  const forestPredict = (x) => {
    let sum = 0;
    for (let t = 0; t < forestPredictors.length; t += 1) {
      sum += forestPredictors[t](x);
    }
    return sum / forestPredictors.length;
  };

  const mseOn = (dataset, fn) =>
    dataset.reduce((s, p) => s + (fn(p.x) - p.y) ** 2, 0) / dataset.length;

  const singleTreeTrainMse = mseOn(trainPoints, singlePredict);
  const singleTreeTestMse = mseOn(testPoints, singlePredict);
  const forestTrainMse = mseOn(trainPoints, forestPredict);
  const forestTestMse = mseOn(testPoints, forestPredict);

  const curveGrid = testPoints.map((tp) => ({
    x: tp.x,
    truth: tp.truth,
    singlePred: singlePredict(tp.x),
    forestPred: forestPredict(tp.x),
  }));

  // Prediction variance across test grid vs ground truth error reduction
  const varianceReductionPct =
    singleTreeTestMse > 1e-6
      ? ((singleTreeTestMse - forestTestMse) / singleTreeTestMse) * 100
      : 0;

  return {
    depth: clampedDepth,
    noiseLevel: clampedNoise,
    ensembleSize: N,
    trainPoints,
    curveGrid,
    singleTreeTrainMse,
    singleTreeTestMse,
    forestTrainMse,
    forestTestMse,
    varianceReductionPct,
  };
}

// ---------------------------------------------------------------------------
// 3. Parameter Explosion Lab (Dense MLP vs Convolutional Layer)
// ---------------------------------------------------------------------------

/**
 * Compute exact first-layer parameters for a Dense MLP vs Conv2D layer.
 */
export function simulateVisionParameters({
  imageSize = 64,
  kernelSize = 3,
  channels = 3,
  hiddenUnits = 256,
  filters = 32,
}) {
  const S = Math.max(16, Math.min(224, Math.round(Number(imageSize) || 64)));
  const K = [3, 5, 7].includes(Number(kernelSize)) ? Number(kernelSize) : 3;
  const C = Math.max(1, Number(channels) || 3);
  const H = Math.max(16, Number(hiddenUnits) || 256);
  const F = Math.max(4, Number(filters) || 32);

  const totalInputDims = S * S * C;
  const mlpParams = totalInputDims * H + H;
  const cnnParams = K * K * C * F + F;
  const ratio = cnnParams > 0 ? mlpParams / cnnParams : 0;

  const localAreaPct = ((K * K) / (S * S)) * 100;

  return {
    imageSize: S,
    kernelSize: K,
    channels: C,
    hiddenUnits: H,
    filters: F,
    totalInputDims,
    mlpParams,
    cnnParams,
    ratio,
    localAreaPct,
  };
}
