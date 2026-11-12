/**
 * Pure math & ML simulation engine for Phase 6: Break-It Mode & What-If AI Experiments.
 * Includes Gaussian elimination polynomial ridge solver, 2D KNN boundary classifier,
 * confusion matrix imbalance analyzer, data-leakage split simulator, 8-layer gradient
 * flow simulator, and gradient descent divergence simulator.
 */

// ---------------------------------------------------------------------------
// 1. Polynomial Ridge Regression Solver (Gaussian Elimination)
// ---------------------------------------------------------------------------

function truePolySignal(x) {
  return Math.sin(1.55 * x) + 0.35 * Math.cos(2.4 * x);
}

/**
 * Solve linear system A * w = b using partial-pivoted Gaussian elimination.
 */
function solveLinearSystem(matrix, rhs) {
  const n = rhs.length;
  const A = matrix.map((row, i) => [...row, rhs[i]]);

  for (let col = 0; col < n; col += 1) {
    let pivotRow = col;
    let maxVal = Math.abs(A[col][col]);
    for (let row = col + 1; row < n; row += 1) {
      const candidate = Math.abs(A[row][col]);
      if (candidate > maxVal) {
        maxVal = candidate;
        pivotRow = row;
      }
    }

    if (pivotRow !== col) {
      const tmp = A[col];
      A[col] = A[pivotRow];
      A[pivotRow] = tmp;
    }

    const pivot = Math.abs(A[col][col]) < 1e-10 ? 1e-10 : A[col][col];
    for (let j = col; j <= n; j += 1) {
      A[col][j] /= pivot;
    }

    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = A[row][col];
      for (let j = col; j <= n; j += 1) {
        A[row][j] -= factor * A[col][j];
      }
    }
  }

  return A.map((row) => row[n]);
}

function buildPolyFeatures(x, degree) {
  const feats = [1];
  let pow = x;
  for (let d = 1; d <= degree; d += 1) {
    feats.push(pow);
    pow *= x;
  }
  return feats;
}

function evalPolynomial(weights, x) {
  let sum = 0;
  let pow = 1;
  for (let i = 0; i < weights.length; i += 1) {
    sum += weights[i] * pow;
    pow *= x;
  }
  return sum;
}

export function fitPolynomialRidge(points, degree = 3, ridgeLambda = 0) {
  const d = Math.max(1, Math.min(9, Math.round(Number(degree) || 3)));
  const lam = Math.max(0, Number(ridgeLambda) || 0);
  const cols = d + 1;

  const XtX = Array.from({ length: cols }, () => Array(cols).fill(0));
  const XtY = Array(cols).fill(0);

  for (const pt of points) {
    const row = buildPolyFeatures(pt.x, d);
    for (let i = 0; i < cols; i += 1) {
      XtY[i] += row[i] * pt.y;
      for (let j = 0; j < cols; j += 1) {
        XtX[i][j] += row[i] * row[j];
      }
    }
  }

  for (let i = 0; i < cols; i += 1) {
    // Do not penalize bias w_0; add tiny ridge floor for numerical stability
    XtX[i][i] += i === 0 ? 1e-8 : lam + 1e-7;
  }

  const weights = solveLinearSystem(XtX, XtY);
  const l2Norm = Math.sqrt(
    weights.slice(1).reduce((acc, w) => acc + w * w, 0)
  );

  return { weights, l2Norm };
}

/**
 * Simulate polynomial regression across train/test points plus degree sweep.
 */
export function simulatePolynomialExperiment({
  degree = 3,
  ridgeLambda = 0.05,
  noise = 0.45,
  trainCount = 11,
}) {
  const d = Math.max(1, Math.min(9, Math.round(Number(degree) || 3)));
  const lam = Math.max(0, Math.min(10, Number(ridgeLambda) || 0));
  const noiseScale = Math.max(0.02, Math.min(0.9, Number(noise) || 0.45));
  const nTrain = Math.max(8, Math.min(40, Math.round(Number(trainCount) || 11)));

  const trainPoints = [];
  for (let i = 0; i < nTrain; i += 1) {
    const u = i / (nTrain - 1);
    const x = -1.8 + u * 3.6 + Math.sin(i * 2.1) * 0.06;
    const pseudo =
      (i % 2 === 0 ? 1 : -1) * 0.62 + Math.sin(i * 3.1 + 0.7) * 0.38;
    trainPoints.push({ id: i, x, y: truePolySignal(x) + noiseScale * 1.25 * pseudo });
  }

  const testPoints = [];
  const nTest = 44;
  for (let i = 0; i < nTest; i += 1) {
    const x = -2.0 + (i / (nTest - 1)) * 4.0;
    const pseudo = Math.sin(i * 23.3 + 4.1) * 0.65 + Math.cos(i * 13.7) * 0.35;
    testPoints.push({ id: i, x, y: truePolySignal(x) + noiseScale * 0.4 * pseudo });
  }

  const { weights, l2Norm } = fitPolynomialRidge(trainPoints, d, lam);

  const mse = (pts, w) =>
    pts.reduce((sum, p) => sum + (evalPolynomial(w, p.x) - p.y) ** 2, 0) / pts.length;

  const trainMse = mse(trainPoints, weights);
  const testMse = mse(testPoints, weights);

  const curveGrid = [];
  for (let i = 0; i <= 80; i += 1) {
    const x = -2.05 + (i / 80) * 4.1;
    curveGrid.push({
      x,
      truth: truePolySignal(x),
      pred: Math.max(-4.5, Math.min(4.5, evalPolynomial(weights, x))),
    });
  }

  const degreeSweep = [];
  for (let deg = 1; deg <= 9; deg += 1) {
    const fit = fitPolynomialRidge(trainPoints, deg, lam);
    degreeSweep.push({
      degree: deg,
      trainMse: mse(trainPoints, fit.weights),
      testMse: Math.min(8, mse(testPoints, fit.weights)),
    });
  }

  return {
    degree: d,
    ridgeLambda: lam,
    noise: noiseScale,
    trainCount: nTrain,
    trainPoints,
    testPoints,
    curveGrid,
    degreeSweep,
    trainMse,
    testMse,
    l2Norm,
    generalizationGap: testMse - trainMse,
  };
}

// ---------------------------------------------------------------------------
// 2. 2D KNN Decision Boundary Classifier
// ---------------------------------------------------------------------------

function generate2DDataset(noise = 0.25) {
  const train = [];
  const test = [];

  for (let i = 0; i < 64; i += 1) {
    const angle = (i / 64) * Math.PI * 2.2;
    const trueCls = i % 2;
    const r = trueCls === 0 ? 1.15 : 2.15;
    const j1 = Math.sin(i * 17.1 + 0.8) * noise * 1.35;
    const j2 = Math.cos(i * 29.3 + 1.4) * noise * 1.35;
    const x1 = r * Math.cos(angle) + j1;
    const x2 = r * Math.sin(angle) + j2;

    if (i % 4 === 0) {
      test.push({ id: i, x1, x2, label: trueCls });
    } else {
      // Deterministic ~14.5% label flips on training samples so K=1 memorizes noisy islands
      const flipped = i % 7 === 1 || i % 19 === 3;
      train.push({ id: i, x1, x2, label: flipped ? 1 - trueCls : trueCls });
    }
  }

  return { train, test };
}

function predictKnnPoint(trainPoints, x1, x2, k, x2Scale = 1) {
  const distances = trainPoints.map((pt) => {
    const dx1 = pt.x1 - x1;
    const dx2 = (pt.x2 - x2) * x2Scale;
    return { distSq: dx1 * dx1 + dx2 * dx2, label: pt.label };
  });

  distances.sort((a, b) => a.distSq - b.distSq);
  const neighbors = distances.slice(0, Math.min(k, distances.length));
  const votes1 = neighbors.reduce((s, n) => s + n.label, 0);
  const prob1 = votes1 / neighbors.length;
  return { pred: prob1 >= 0.5 ? 1 : 0, prob1 };
}

/**
 * Simulate 2D KNN boundary grid with configurable K, feature scale distortion, and noise.
 */
export function simulateKnnBoundary({
  k = 5,
  scaleFactor = 1,
  noise = 0.25,
}) {
  const clampedK = Math.max(1, Math.min(25, Math.round(Number(k) || 5)));
  const scale = Math.max(1, Math.min(100, Number(scaleFactor) || 1));
  const clampedNoise = Math.max(0.05, Math.min(0.65, Number(noise) || 0.25));

  const { train, test } = generate2DDataset(clampedNoise);

  const accuracyOn = (pts) => {
    let correct = 0;
    for (const p of pts) {
      const { pred } = predictKnnPoint(train, p.x1, p.x2, clampedK, scale);
      if (pred === p.label) correct += 1;
    }
    return (correct / Math.max(1, pts.length)) * 100;
  };

  const trainAccuracy = accuracyOn(train);
  const testAccuracy = accuracyOn(test);

  const gridN = 26;
  const minC = -3.1;
  const maxC = 3.1;
  const step = (maxC - minC) / gridN;
  const cells = [];
  const classMatrix = [];

  for (let row = 0; row < gridN; row += 1) {
    const x2 = maxC - (row + 0.5) * step;
    const rowClasses = [];
    for (let col = 0; col < gridN; col += 1) {
      const x1 = minC + (col + 0.5) * step;
      const { pred, prob1 } = predictKnnPoint(train, x1, x2, clampedK, scale);
      rowClasses.push(pred);
      cells.push({ row, col, x1, x2, pred, prob1 });
    }
    classMatrix.push(rowClasses);
  }

  // Count boundary transitions between adjacent cells as a real complexity metric
  let boundaryFlips = 0;
  for (let r = 0; r < gridN; r += 1) {
    for (let c = 0; c < gridN; c += 1) {
      if (c + 1 < gridN && classMatrix[r][c] !== classMatrix[r][c + 1]) boundaryFlips += 1;
      if (r + 1 < gridN && classMatrix[r][c] !== classMatrix[r + 1][c]) boundaryFlips += 1;
    }
  }

  return {
    k: clampedK,
    scaleFactor: scale,
    noise: clampedNoise,
    gridN,
    minC,
    maxC,
    train,
    test,
    cells,
    trainAccuracy,
    testAccuracy,
    boundaryFlips,
  };
}

// ---------------------------------------------------------------------------
// 3. Gradient Descent Divergence Simulator
// ---------------------------------------------------------------------------

/**
 * Run 1D gradient descent on J(θ) = θ² + 0.2θ from θ₀ = 2.6.
 */
export function simulateGdDynamics(learningRate = 1.05, steps = 16) {
  const alpha = Math.max(0.02, Math.min(1.2, Number(learningRate) || 0.2));
  const f = (theta) => theta * theta + 0.2 * theta;
  const df = (theta) => 2 * theta + 0.2;

  const trajectory = [];
  let theta = 2.6;
  let diverged = false;

  for (let step = 0; step <= steps; step += 1) {
    const clampedTheta = Math.max(-20, Math.min(20, theta));
    const loss = f(clampedTheta);
    trajectory.push({
      step,
      theta: clampedTheta,
      loss: Math.min(120, loss),
      diverged,
    });

    const next = theta - alpha * df(theta);
    if (!Number.isFinite(next) || Math.abs(next) > 20) {
      diverged = true;
      theta = Math.sign(next || 1) * 20;
    } else {
      theta = next;
    }
  }

  const finalPoint = trajectory[trajectory.length - 1];
  return {
    learningRate: alpha,
    trajectory,
    finalTheta: finalPoint.theta,
    finalLoss: finalPoint.loss,
    diverged: diverged || finalPoint.loss > trajectory[0].loss,
  };
}

// ---------------------------------------------------------------------------
// 4. Class Imbalance Simulator
// ---------------------------------------------------------------------------

/**
 * Simulate binary classification on 200 samples where minorityPct% are positive (1).
 * Compare naive majority-leaning classifier vs balanced class-weighted classifier.
 */
export function simulateClassImbalance({ minorityPct = 4, balancedWeight = false }) {
  const total = 200;
  const pct = Math.max(2, Math.min(50, Math.round(Number(minorityPct) || 4)));
  const positives = Math.max(2, Math.round((pct / 100) * total));
  const negatives = total - positives;

  // Deterministic model scores p ∈ [0, 1] with overlap
  const samples = [];
  for (let i = 0; i < negatives; i += 1) {
    const noise = ((i * 37 + 11) % 100) / 100;
    const score = 0.08 + noise * 0.44; // Majority scores mostly low (0.08..0.52)
    samples.push({ actual: 0, score });
  }
  for (let i = 0; i < positives; i += 1) {
    const noise = ((i * 53 + 7) % 100) / 100;
    const score = 0.28 + noise * 0.55; // Minority scores span 0.28..0.83
    samples.push({ actual: 1, score });
  }

  // Without class weighting on severe imbalance, decision bias pushes effective threshold up
  const effectiveThreshold = balancedWeight
    ? 0.42
    : Math.min(0.88, 0.5 + ((50 - pct) / 50) * 0.36);

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (const s of samples) {
    const pred = s.score >= effectiveThreshold ? 1 : 0;
    if (s.actual === 1 && pred === 1) tp += 1;
    else if (s.actual === 0 && pred === 1) fp += 1;
    else if (s.actual === 0 && pred === 0) tn += 1;
    else fn += 1;
  }

  const accuracy = ((tp + tn) / total) * 100;
  const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0;
  const recall = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
  const specificity = tn + fp > 0 ? (tn / (tn + fp)) * 100 : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const balancedAccuracy = (recall + specificity) / 2;

  return {
    minorityPct: pct,
    balancedWeight,
    effectiveThreshold,
    total,
    positives,
    negatives,
    tp,
    fp,
    tn,
    fn,
    accuracy,
    precision,
    recall,
    f1,
    balancedAccuracy,
  };
}

// ---------------------------------------------------------------------------
// 5. Data Leakage Simulator
// ---------------------------------------------------------------------------

/**
 * Simulate validation accuracy inflation vs production deployment collapse
 * as leakage strength (target proxy / pre-split normalization) varies 0..100%.
 */
export function simulateDataLeakage({ leakagePct = 90 }) {
  const leak = Math.max(0, Math.min(100, Number(leakagePct) || 0)) / 100;
  const trueSignalAcc = 78.5;

  // Higher leakage inflates offline validation accuracy artificially while hurting real generalization
  const validationAccuracy = trueSignalAcc + leak * 20.5;
  const productionAccuracy = trueSignalAcc - leak * 23.5;
  const deploymentGap = validationAccuracy - productionAccuracy;

  // Feature importance split between genuine features and leaked proxy
  const proxyImportancePct = leak * 86;
  const genuineImportancePct = 100 - proxyImportancePct;

  return {
    leakagePct: Math.round(leak * 100),
    validationAccuracy,
    productionAccuracy,
    deploymentGap,
    proxyImportancePct,
    genuineImportancePct,
  };
}

// ---------------------------------------------------------------------------
// 6. Deep 8-Layer Gradient Flow Simulator (Vanishing & Exploding Gradients)
// ---------------------------------------------------------------------------

/**
 * Compute backward gradient magnitude across an 8-layer deep network.
 */
export function simulateLayerGradients({
  layers = 8,
  weightScale = 0.9,
  activationId = 'sigmoid',
  clipThreshold = 0,
}) {
  const L = Math.max(4, Math.min(10, Math.round(Number(layers) || 8)));
  const scale = Math.max(0.3, Math.min(2.8, Number(weightScale) || 1.0));

  // Mean derivative gain per layer
  let actGain = 0.23; // Sigmoid max derivative is 0.25, average ~0.20-0.23
  if (activationId === 'tanh') actGain = 0.65;
  else if (activationId === 'relu') actGain = 0.72; // ~half units active; He init sqrt(2) compensates

  const perLayerFactor = scale * actGain;
  const results = [];
  let norm = 1.0;

  for (let layer = L; layer >= 1; layer -= 1) {
    const clippedNorm =
      clipThreshold > 0 ? Math.min(clipThreshold, norm) : norm;
    results.unshift({
      layer,
      norm: Math.min(5000, norm),
      clippedNorm: Math.min(5000, clippedNorm),
    });
    norm *= perLayerFactor;
  }

  const layer1Norm = results[0].clippedNorm;
  const layerEndNorm = results[results.length - 1].clippedNorm;
  const regime =
    layer1Norm < 0.02
      ? 'Vanishing'
      : layer1Norm > 20
      ? 'Exploding'
      : 'Healthy Flow';

  return {
    layers: L,
    weightScale: scale,
    activationId,
    clipThreshold,
    perLayerFactor,
    layerNorms: results,
    layer1Norm,
    layerEndNorm,
    regime,
  };
}

// ---------------------------------------------------------------------------
// 7. Training Curves & Gradient What-If Studio Simulator
// ---------------------------------------------------------------------------

/**
 * Simulate 28 epochs of Train vs Validation loss and 8-layer gradient flow.
 */
export function simulateTrainingWhatIf({
  learningRate = 0.25,
  initScale = 1.2,
  activationId = 'relu',
  regLambda = 0.05,
}) {
  const lr = Math.max(0.02, Math.min(1.2, Number(learningRate) || 0.25));
  const reg = Math.max(0, Math.min(0.5, Number(regLambda) || 0.05));

  const gradSim = simulateLayerGradients({
    layers: 8,
    weightScale: initScale,
    activationId,
    clipThreshold: 0,
  });

  // Effective learning speed depends on both LR and Layer 1 gradient flow
  const gradFactor = Math.min(2.2, Math.max(0.04, Math.pow(gradSim.layer1Norm, 0.22)));
  const effectiveSpeed = lr * gradFactor;
  const unstable = lr > 0.88 || gradSim.layer1Norm > 65;

  const epochs = 26;
  const epochCurves = [];
  let trainLoss = 1.45;
  let valLoss = 1.52;

  for (let ep = 0; ep <= epochs; ep += 1) {
    epochCurves.push({
      epoch: ep,
      trainLoss: Math.min(4.5, trainLoss),
      valLoss: Math.min(4.5, valLoss),
    });

    if (unstable) {
      const osc = 1 + (lr - 0.72) * 0.45 + (gradSim.layer1Norm > 65 ? 0.15 : 0);
      trainLoss = Math.min(4.5, trainLoss * osc + 0.04 * Math.sin(ep * 1.7));
      valLoss = Math.min(4.5, trainLoss + 0.18);
    } else {
      const decay = Math.exp(-0.18 * effectiveSpeed * (1 - reg * 0.4));
      const floor = 0.08 + reg * 0.35 + (activationId === 'sigmoid' ? 0.14 : 0);
      trainLoss = floor + (trainLoss - floor) * decay;

      // Without regularization, late epochs overfit slightly and val loss rises
      const overfitBump = reg < 0.04 && ep > 12 ? (ep - 12) * (0.04 - reg) * 0.65 : 0;
      valLoss = trainLoss + 0.07 + overfitBump + reg * 0.06;
    }
  }

  const finalPt = epochCurves[epochCurves.length - 1];
  const generalizationGap = finalPt.valLoss - finalPt.trainLoss;

  let status = 'Converging Cleanly';
  if (unstable) status = 'Unstable / Diverging';
  else if (gradSim.layer1Norm < 0.02) status = 'Stalled (Vanishing Gradients)';
  else if (generalizationGap > 0.28) status = 'Overfitting (High Gap)';

  return {
    epochCurves,
    layerNorms: gradSim.layerNorms,
    finalTrainLoss: finalPt.trainLoss,
    finalValLoss: finalPt.valLoss,
    generalizationGap,
    layer1Grad: gradSim.layer1Norm,
    status,
  };
}
