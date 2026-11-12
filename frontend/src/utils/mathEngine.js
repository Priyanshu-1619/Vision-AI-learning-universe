/**
 * Pure mathematical calculation engine for Phase 4: Mathematics Physically Visualized.
 * Zero UI or framework dependencies — all formulas return exact deterministic values.
 */

// ---------------------------------------------------------------------------
// 1. Statistics & Probability
// ---------------------------------------------------------------------------

/**
 * Compute weighted/unweighted mean (center of mass), median, and balance torques.
 * Formula: μ = (Σ wᵢ·xᵢ) / (Σ wᵢ)
 */
export function computeMeanAndMedian(items = []) {
  if (items.length === 0) {
    return { mean: 0, median: 0, totalWeight: 0, leftTorque: 0, rightTorque: 0 };
  }

  let weightedSum = 0;
  let totalWeight = 0;
  const expandedForMedian = [];

  for (const item of items) {
    const x = Number(item.value) || 0;
    const w = Math.max(0.1, Number(item.weight) || 1);
    weightedSum += x * w;
    totalWeight += w;
    const repeats = Math.max(1, Math.round(w));
    for (let r = 0; r < repeats; r += 1) {
      expandedForMedian.push(x);
    }
  }

  const mean = totalWeight > 0 ? weightedSum / totalWeight : 0;

  expandedForMedian.sort((a, b) => a - b);
  const mid = Math.floor(expandedForMedian.length / 2);
  const median =
    expandedForMedian.length % 2 === 0
      ? (expandedForMedian[mid - 1] + expandedForMedian[mid]) / 2
      : expandedForMedian[mid];

  let leftTorque = 0;
  let rightTorque = 0;
  for (const item of items) {
    const x = Number(item.value) || 0;
    const w = Math.max(0.1, Number(item.weight) || 1);
    const torque = (x - mean) * w;
    if (torque < 0) leftTorque += Math.abs(torque);
    else rightTorque += torque;
  }

  return { mean, median, totalWeight, leftTorque, rightTorque };
}

/**
 * Compute variance and physical square areas around the mean.
 * Formula: σ² = (1/n) Σ (xᵢ - μ)²,  σ = √σ²
 */
export function computeVarianceBreakdown(values = []) {
  const n = values.length;
  if (n === 0) {
    return { mean: 0, variance: 0, stdDev: 0, sumSquaredDeviations: 0, squares: [] };
  }

  const mean = values.reduce((acc, v) => acc + v, 0) / n;
  const squares = values.map((x, idx) => {
    const deviation = x - mean;
    return {
      index: idx,
      x,
      deviation,
      absDeviation: Math.abs(deviation),
      squared: deviation * deviation,
    };
  });

  const sumSquaredDeviations = squares.reduce((acc, s) => acc + s.squared, 0);
  const variance = sumSquaredDeviations / n;
  const stdDev = Math.sqrt(variance);

  return { mean, variance, stdDev, sumSquaredDeviations, squares };
}

/**
 * Evaluate Normal (Gaussian) probability density function.
 * Formula: f(x) = (1 / (σ√(2π))) · exp(-((x - μ)² / (2σ²)))
 */
export function normalPdf(x, mu = 0, sigma = 1) {
  const safeSigma = Math.max(0.1, sigma);
  const z = (x - mu) / safeSigma;
  return (1 / (safeSigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
}

/**
 * Sample Normal curve across [xMin, xMax] and compute empirical coverage bands.
 */
export function analyzeNormalDistribution(mu = 0, sigma = 1.2, sampleCount = 80) {
  const safeSigma = Math.max(0.25, sigma);
  const xMin = -8;
  const xMax = 8;
  const steps = 160;
  const curve = [];

  for (let i = 0; i <= steps; i += 1) {
    const x = xMin + (i / steps) * (xMax - xMin);
    curve.push({ x, y: normalPdf(x, mu, safeSigma) });
  }

  // Deterministic Box-Muller z-scores so points move smoothly when mu/sigma change
  const samples = [];
  for (let i = 0; i < sampleCount; i += 1) {
    const u1 = ((i * 73 + 19) % 997 + 1) / 999;
    const u2 = ((i * 197 + 53) % 991 + 1) / 993;
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const clampedZ = Math.max(-3.6, Math.min(3.6, z));
    const x = mu + clampedZ * safeSigma;
    samples.push({
      id: i,
      x,
      z: clampedZ,
      yOffset: ((i * 37) % 100) / 100,
    });
  }

  const in1 = samples.filter((s) => Math.abs(s.z) <= 1).length;
  const in2 = samples.filter((s) => Math.abs(s.z) <= 2).length;
  const in3 = samples.filter((s) => Math.abs(s.z) <= 3).length;

  return {
    curve,
    samples,
    xMin,
    xMax,
    peakDensity: normalPdf(mu, mu, safeSigma),
    empiricalCoverage: {
      within1Sigma: (in1 / sampleCount) * 100,
      within2Sigma: (in2 / sampleCount) * 100,
      within3Sigma: (in3 / sampleCount) * 100,
    },
  };
}

/**
 * Generate a deterministic bivariate scatter dataset with target correlation r
 * and compute exact sample covariance, Pearson r, R², and OLS regression line.
 * Formula: r = Σ((xᵢ - x̄)(yᵢ - ȳ)) / √(Σ(xᵢ - x̄)² · Σ(yᵢ - ȳ)²)
 */
export function generateCorrelatedDataset(targetR = 0.75, spread = 0.55, withOutlier = false) {
  const n = 36;
  const points = [];
  const clampedR = Math.max(-0.98, Math.min(0.98, targetR));
  const noiseScale = Math.sqrt(Math.max(0.001, 1 - clampedR * clampedR)) * (0.5 + spread);

  for (let i = 0; i < n; i += 1) {
    // Deterministic Halton-like centered coordinates in [-2.6, 2.6]
    const t1 = ((i * 67 + 11) % 101) / 100 - 0.5;
    const t2 = ((i * 131 + 29) % 103) / 102 - 0.5;
    const x = t1 * 5.2;
    const y = clampedR * x + noiseScale * (t2 * 4.4);
    points.push({ id: i, x, y, isOutlier: false });
  }

  if (withOutlier) {
    points.push({
      id: n,
      x: 2.8,
      y: clampedR >= 0 ? -3.4 : 3.4,
      isOutlier: true,
    });
  }

  return computeCorrelationStats(points);
}

/**
 * Compute sample mean, covariance, Pearson r, R², and OLS regression line y = mx + b.
 */
export function computeCorrelationStats(points = []) {
  const n = points.length;
  if (n < 2) {
    return { points, meanX: 0, meanY: 0, covariance: 0, r: 0, rSquared: 0, slope: 0, intercept: 0 };
  }

  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;

  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }

  const covariance = sxy / n;
  const denom = Math.sqrt(sxx * syy);
  const r = denom > 1e-9 ? sxy / denom : 0;
  const slope = sxx > 1e-9 ? sxy / sxx : 0;
  const intercept = meanY - slope * meanX;

  return {
    points,
    meanX,
    meanY,
    covariance,
    r,
    rSquared: r * r,
    slope,
    intercept,
  };
}

// ---------------------------------------------------------------------------
// 2. Linear Algebra
// ---------------------------------------------------------------------------

/**
 * Analyze two 2D vectors a, b and scalar multiple k·a.
 * Formulas:
 *   ||a|| = √(aₓ² + aᵧ²)
 *   a · b = aₓbₓ + aᵧbᵧ = ||a||·||b||·cos(θ)
 *   proj_b(a) = ((a · b) / ||b||²) · b
 */
export function analyzeVectorPair(a = { x: 3, y: 1.5 }, b = { x: 1, y: 2.5 }, scalarK = 1.5) {
  const magA = Math.hypot(a.x, a.y);
  const magB = Math.hypot(b.x, b.y);
  const scaledA = { x: a.x * scalarK, y: a.y * scalarK };
  const sum = { x: a.x + b.x, y: a.y + b.y };

  const dot = a.x * b.x + a.y * b.y;
  const cosTheta = magA > 1e-9 && magB > 1e-9 ? Math.max(-1, Math.min(1, dot / (magA * magB))) : 0;
  const angleRad = Math.acos(cosTheta);
  const angleDeg = (angleRad * 180) / Math.PI;

  const bNormSq = b.x * b.x + b.y * b.y;
  const projScalar = bNormSq > 1e-9 ? dot / bNormSq : 0;
  const projection = { x: projScalar * b.x, y: projScalar * b.y };
  const scalarProjection = magB > 1e-9 ? dot / magB : 0;

  let alignment = 'Orthogonal (perpendicular)';
  if (magA < 1e-6 || magB < 1e-6) {
    alignment = 'Zero vector (no direction)';
  } else if (Math.abs(cosTheta) <= 0.03) {
    alignment = 'Orthogonal (perpendicular)';
  } else if (dot > 0) {
    alignment = 'Aligned (acute angle)';
  } else {
    alignment = 'Opposing (obtuse angle)';
  }

  return {
    a,
    b,
    scalarK,
    magA,
    magB,
    scaledA,
    magScaledA: Math.hypot(scaledA.x, scaledA.y),
    sum,
    magSum: Math.hypot(sum.x, sum.y),
    dot,
    cosTheta,
    angleRad,
    angleDeg,
    projection,
    scalarProjection,
    alignment,
  };
}

/**
 * Transform a 2D point (x, y) by 2x2 matrix [[a, b], [c, d]].
 */
export function transformPoint2x2(matrix, x, y) {
  return {
    x: matrix.a * x + matrix.b * y,
    y: matrix.c * x + matrix.d * y,
  };
}

/**
 * Analyze a 2x2 transformation matrix A = [[a, b], [c, d]].
 * Formulas:
 *   det(A) = a·d - b·c  (signed area scale factor of unit square)
 *   tr(A)  = a + d
 *   λ = (tr ± √(tr² - 4·det)) / 2
 */
export function analyzeMatrix2x2(a = 1, b = 0, c = 0, d = 1) {
  const det = a * d - b * c;
  const trace = a + d;
  const discriminant = trace * trace - 4 * det;

  let eigenvaluesText = '';
  let hasRealEigenvalues = true;

  if (discriminant >= 0) {
    const sqrtD = Math.sqrt(discriminant);
    const l1 = (trace + sqrtD) / 2;
    const l2 = (trace - sqrtD) / 2;
    eigenvaluesText = `λ₁ = ${l1.toFixed(2)}, λ₂ = ${l2.toFixed(2)}`;
  } else {
    hasRealEigenvalues = false;
    const real = trace / 2;
    const imag = Math.sqrt(-discriminant) / 2;
    eigenvaluesText = `${real.toFixed(2)} ± ${imag.toFixed(2)}i (rotational)`;
  }

  return {
    a,
    b,
    c,
    d,
    iHat: { x: a, y: c },
    jHat: { x: b, y: d },
    det,
    absDet: Math.abs(det),
    trace,
    isSingular: Math.abs(det) < 0.05,
    orientationFlipped: det < 0,
    hasRealEigenvalues,
    eigenvaluesText,
  };
}

/**
 * Compute Euclidean (L2), Manhattan (L1), and Cosine distance/similarity between P1 and P2.
 */
export function computeDistances(p1 = { x: 1, y: 2 }, p2 = { x: 4, y: 3 }) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const euclidean = Math.hypot(dx, dy);
  const manhattan = Math.abs(dx) + Math.abs(dy);

  const mag1 = Math.hypot(p1.x, p1.y);
  const mag2 = Math.hypot(p2.x, p2.y);
  const dot = p1.x * p2.x + p1.y * p2.y;
  const cosineSimilarity =
    mag1 > 1e-9 && mag2 > 1e-9 ? Math.max(-1, Math.min(1, dot / (mag1 * mag2))) : 0;
  const cosineDistance = 1 - cosineSimilarity;
  const angleDeg = (Math.acos(cosineSimilarity) * 180) / Math.PI;

  return {
    dx,
    dy,
    euclidean,
    manhattan,
    cosineSimilarity,
    cosineDistance,
    angleDeg,
  };
}

// ---------------------------------------------------------------------------
// 3. Calculus & Optimization
// ---------------------------------------------------------------------------

export const CALCULUS_FUNCTIONS = {
  x2: {
    id: 'x2',
    label: 'f(x) = x²',
    formula: 'f(x) = x²',
    derivativeFormula: "f'(x) = 2x",
    domain: [-3.5, 3.5],
    yRange: [-2, 12],
    f: (x) => x * x,
    df: (x) => 2 * x,
  },
  cubic: {
    id: 'cubic',
    label: 'f(x) = x³ - 3x',
    formula: 'f(x) = x³ - 3x',
    derivativeFormula: "f'(x) = 3x² - 3",
    domain: [-2.6, 2.6],
    yRange: [-5, 5],
    f: (x) => x * x * x - 3 * x,
    df: (x) => 3 * x * x - 3,
  },
  sin: {
    id: 'sin',
    label: 'f(x) = sin(x)',
    formula: 'f(x) = sin(x)',
    derivativeFormula: "f'(x) = cos(x)",
    domain: [-4, 4],
    yRange: [-1.8, 1.8],
    f: (x) => Math.sin(x),
    df: (x) => Math.cos(x),
  },
  sigmoid: {
    id: 'sigmoid',
    label: 'σ(x) = 1 / (1 + e⁻ˣ)',
    formula: 'σ(x) = 1 / (1 + e⁻ˣ)',
    derivativeFormula: "σ'(x) = σ(x)·(1 - σ(x))",
    domain: [-5, 5],
    yRange: [-0.2, 1.2],
    f: (x) => 1 / (1 + Math.exp(-x)),
    df: (x) => {
      const s = 1 / (1 + Math.exp(-x));
      return s * (1 - s);
    },
  },
};

/**
 * Evaluate secant slope over [x, x + dx] vs exact tangent slope f'(x).
 * Formula: secant = (f(x + Δx) - f(x)) / Δx
 */
export function computeSecantTangent(fnId = 'x2', x = 1, dx = 1) {
  const fn = CALCULUS_FUNCTIONS[fnId] || CALCULUS_FUNCTIONS.x2;
  const safeDx = Math.abs(dx) < 0.01 ? (dx >= 0 ? 0.01 : -0.01) : dx;

  const y = fn.f(x);
  const x2 = x + safeDx;
  const y2 = fn.f(x2);
  const secantSlope = (y2 - y) / safeDx;
  const tangentSlope = fn.df(x);

  return {
    fn,
    x,
    y,
    x2,
    y2,
    dx: safeDx,
    secantSlope,
    tangentSlope,
    error: Math.abs(secantSlope - tangentSlope),
  };
}

export const GRADIENT_LANDSCAPES = {
  bowl: {
    id: 'bowl',
    label: 'Convex Bowl: x² + y²',
    formula: 'f(x, y) = x² + y²',
    gradientFormula: '∇f(x, y) = [2x, 2y]',
    f: (x, y) => x * x + y * y,
    grad: (x, y) => [2 * x, 2 * y],
  },
  saddle: {
    id: 'saddle',
    label: 'Saddle Point: x² - y²',
    formula: 'f(x, y) = x² - y²',
    gradientFormula: '∇f(x, y) = [2x, -2y]',
    f: (x, y) => x * x - y * y,
    grad: (x, y) => [2 * x, -2 * y],
  },
  ripple: {
    id: 'ripple',
    label: 'Wave Basin: sin(x)cos(y) + 0.2(x² + y²)',
    formula: 'f(x, y) = sin(x)cos(y) + 0.2(x² + y²)',
    gradientFormula: '∇f = [cos(x)cos(y) + 0.4x, -sin(x)sin(y) + 0.4y]',
    f: (x, y) => Math.sin(x) * Math.cos(y) + 0.2 * (x * x + y * y),
    grad: (x, y) => [
      Math.cos(x) * Math.cos(y) + 0.4 * x,
      -Math.sin(x) * Math.sin(y) + 0.4 * y,
    ],
  },
};

/**
 * Sample contour grid and gradient vector field for ∇f(x, y).
 */
export function evaluateGradientField(landscapeId = 'bowl', probeX = 1.2, probeY = -0.8) {
  const spec = GRADIENT_LANDSCAPES[landscapeId] || GRADIENT_LANDSCAPES.bowl;
  const gridN = 29;
  const range = 3;
  const axis = [];
  const zMatrix = [];

  for (let i = 0; i < gridN; i += 1) {
    axis.push(-range + (i / (gridN - 1)) * (2 * range));
  }

  for (let row = 0; row < gridN; row += 1) {
    const y = axis[row];
    const zRow = [];
    for (let col = 0; col < gridN; col += 1) {
      const x = axis[col];
      zRow.push(spec.f(x, y));
    }
    zMatrix.push(zRow);
  }

  const [gx, gy] = spec.grad(probeX, probeY);
  const value = spec.f(probeX, probeY);
  const magnitude = Math.hypot(gx, gy);

  return {
    spec,
    axis,
    zMatrix,
    probe: { x: probeX, y: probeY, value, gx, gy, magnitude },
  };
}

export const DESCENT_LANDSCAPES = {
  convex: {
    id: 'convex',
    label: 'Convex Bowl (x²)',
    formula: 'J(x) = x²',
    gradFormula: "J'(x) = 2x",
    domain: [-4, 4],
    defaultX0: -3.2,
    f: (x) => x * x,
    df: (x) => 2 * x,
  },
  steep: {
    id: 'steep',
    label: 'Steep Valley (3x²)',
    formula: 'J(x) = 3x²',
    gradFormula: "J'(x) = 6x",
    domain: [-3.5, 3.5],
    defaultX0: -2.6,
    f: (x) => 3 * x * x,
    df: (x) => 6 * x,
  },
  multi: {
    id: 'multi',
    label: 'Multi-Minima (0.1x⁴ - 0.8x² + 0.25x + 2)',
    formula: 'J(x) = 0.1x⁴ - 0.8x² + 0.25x + 2',
    gradFormula: "J'(x) = 0.4x³ - 1.6x + 0.25",
    domain: [-3.8, 3.8],
    defaultX0: -3.3,
    f: (x) => 0.1 * x ** 4 - 0.8 * x * x + 0.25 * x + 2,
    df: (x) => 0.4 * x ** 3 - 1.6 * x + 0.25,
  },
};

/**
 * Compute one gradient descent update step: xₜ₊₁ = xₜ - α · J'(xₜ)
 */
export function stepGradientDescent(landscapeId = 'convex', history = [], alpha = 0.15) {
  const spec = DESCENT_LANDSCAPES[landscapeId] || DESCENT_LANDSCAPES.convex;
  const last = history[history.length - 1];
  if (!last) {
    const x0 = spec.defaultX0;
    return [{ step: 0, x: x0, loss: spec.f(x0), grad: spec.df(x0), diverged: false }];
  }

  if (last.diverged || Math.abs(last.x) > 50) {
    return history;
  }

  const grad = spec.df(last.x);
  const nextX = last.x - alpha * grad;
  const diverged = !Number.isFinite(nextX) || Math.abs(nextX) > 25;
  const clampedX = diverged ? Math.sign(nextX || 1) * 25 : nextX;

  return [
    ...history,
    {
      step: last.step + 1,
      x: clampedX,
      loss: spec.f(clampedX),
      grad: spec.df(clampedX),
      diverged,
    },
  ];
}

/**
 * Evaluate regression losses (MSE, MAE, Huber) for error e = y - ŷ
 * and Binary Cross-Entropy for predicted probability p = ŷ ∈ (0, 1).
 */
export function evaluateLossCurves(huberDelta = 1.0, bceTarget = 1) {
  const errors = [];
  const mseLoss = [];
  const mseGrad = [];
  const maeLoss = [];
  const maeGrad = [];
  const huberLoss = [];
  const huberGrad = [];

  for (let i = 0; i <= 120; i += 1) {
    const e = -3 + (i / 120) * 6;
    errors.push(e);

    mseLoss.push(e * e);
    mseGrad.push(2 * e);

    maeLoss.push(Math.abs(e));
    maeGrad.push(Math.abs(e) < 1e-6 ? 0 : Math.sign(e));

    const absE = Math.abs(e);
    if (absE <= huberDelta) {
      huberLoss.push(0.5 * e * e);
      huberGrad.push(e);
    } else {
      huberLoss.push(huberDelta * (absE - 0.5 * huberDelta));
      huberGrad.push(huberDelta * Math.sign(e));
    }
  }

  const probs = [];
  const bceLoss = [];
  const bceGrad = [];
  for (let i = 1; i < 99; i += 1) {
    const p = i / 100;
    probs.push(p);
    if (bceTarget === 1) {
      bceLoss.push(-Math.log(p));
      bceGrad.push(-1 / p);
    } else {
      bceLoss.push(-Math.log(1 - p));
      bceGrad.push(1 / (1 - p));
    }
  }

  return {
    errors,
    mseLoss,
    mseGrad,
    maeLoss,
    maeGrad,
    huberLoss,
    huberGrad,
    probs,
    bceLoss,
    bceGrad,
  };
}

/**
 * Evaluate single-point loss and gradient values for interactive readouts.
 */
export function evaluateSingleLossPoint(errorVal = 1.2, huberDelta = 1.0, probVal = 0.7, bceTarget = 1) {
  const e = errorVal;
  const absE = Math.abs(e);
  const mse = e * e;
  const mseG = 2 * e;
  const mae = absE;
  const maeG = absE < 1e-6 ? 0 : Math.sign(e);
  const huber =
    absE <= huberDelta ? 0.5 * e * e : huberDelta * (absE - 0.5 * huberDelta);
  const huberG = absE <= huberDelta ? e : huberDelta * Math.sign(e);

  const p = Math.max(0.01, Math.min(0.99, probVal));
  const bce = bceTarget === 1 ? -Math.log(p) : -Math.log(1 - p);
  const bceG = bceTarget === 1 ? -1 / p : 1 / (1 - p);

  return {
    mse,
    mseG,
    mae,
    maeG,
    huber,
    huberG,
    bce,
    bceG,
  };
}
