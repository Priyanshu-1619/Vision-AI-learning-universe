/**
 * AI Learning Universe — Master Visualization Registry
 * Central configuration schema for all interactive educational visualizations across
 * Data Science, Machine Learning, and Deep Learning domains.
 */

export const VISUALIZATION_REGISTRY = {
  // =========================================================================
  // DOMAIN 1: DEEP LEARNING
  // =========================================================================
  'artificial-neuron': {
    id: 'artificial-neuron',
    domain: 'deep-learning',
    title: 'Artificial Neuron (Perceptron)',
    subtitle: 'Trace how inputs are multiplied by weights, summed with bias, and mapped through an activation function.',
    visualizationType: 'perceptron',
    formula: 'y = σ(w₁x₁ + w₂x₂ + w₃x₃ + b)',
    parameters: [
      { name: 'w1', label: 'Weight w₁', min: -3, max: 3, step: 0.1, default: 1.2 },
      { name: 'w2', label: 'Weight w₂', min: -3, max: 3, step: 0.1, default: 0.8 },
      { name: 'w3', label: 'Weight w₃', min: -3, max: 3, step: 0.1, default: -1.1 },
      { name: 'bias', label: 'Bias b', min: -4, max: 4, step: 0.1, default: 0.1 },
    ],
    presets: [
      {
        id: 'and-gate',
        label: 'AND Logic Gate',
        params: { w1: 2.5, w2: 2.5, w3: 0.0, bias: -3.5 },
        description: 'Requires both inputs to be active for output to exceed threshold.',
      },
      {
        id: 'or-gate',
        label: 'OR Logic Gate',
        params: { w1: 2.6, w2: 2.6, w3: 0.0, bias: -1.2 },
        description: 'Fires if either input is active.',
      },
      {
        id: 'inhibitory',
        label: 'Inhibitory Connection',
        params: { w1: 1.0, w2: 1.0, w3: -2.5, bias: 0.0 },
        description: 'Third input acts as an inhibitory brake, shutting off the neuron.',
      },
    ],
    datasets: [
      { id: 'standard', label: 'Balanced Signals', inputs: [1.0, 0.6, -0.4] },
      { id: 'high-signal', label: 'High Excitation', inputs: [2.0, 1.5, 0.2] },
      { id: 'quiescent', label: 'Low/Negative', inputs: [-1.0, -0.5, 0.8] },
    ],
    compute: (params, dataset) => {
      const inputs = dataset?.inputs || [1.0, 0.6, -0.4];
      const weights = [params.w1 ?? 1.2, params.w2 ?? 0.8, params.w3 ?? -1.1];
      const b = params.bias ?? 0.1;

      const weightedSum = inputs[0] * weights[0] + inputs[1] * weights[1] + inputs[2] * weights[2] + b;
      // Sigmoid activation
      const output = 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, weightedSum))));

      return {
        graphData: {
          inputs,
          weights,
          bias: b,
          weightedSum,
          activation: output,
          activationName: 'Sigmoid',
        },
        metrics: [
          { id: 'sum', label: 'Net Sum (z)', value: weightedSum, color: 'var(--accent-icy, #65CFFF)', formula: 'z = W·x + b' },
          { id: 'output', label: 'Neuron Output (y)', value: output, color: 'var(--accent-yellow, #FFD928)', formula: 'σ(z)' },
          { id: 'state', label: 'Firing State', value: output >= 0.5 ? 'ACTIVE (1)' : 'INACTIVE (0)', color: output >= 0.5 ? 'var(--accent-emerald, #10b981)' : 'var(--accent-red, #ef4444)' },
        ],
        substituted: `z = (${weights[0].toFixed(1)}·${inputs[0]}) + (${weights[1].toFixed(1)}·${inputs[1]}) + (${weights[2].toFixed(1)}·${inputs[2]}) + (${b.toFixed(1)}) = ${weightedSum.toFixed(2)} → σ(${weightedSum.toFixed(2)}) = ${output.toFixed(3)}`,
        explanation: {
          whatChanged: `Net pre-activation input is z = ${weightedSum.toFixed(2)}, yielding final squashed output ${output.toFixed(3)}.`,
          why: 'Each weight acts as an amplifier: positive weights stimulate firing, negative weights suppress it, and bias sets the threshold.',
          mathematics: 'The affine transformation Wᵀx + b projects inputs into 1D scalar space before non-linear squashing.',
          takeaway: 'A single artificial neuron is a linear classifier with a smooth probabilistic threshold.',
        },
      };
    },
  },

  'activation-functions': {
    id: 'activation-functions',
    domain: 'deep-learning',
    title: 'Non-Linear Activation Functions',
    subtitle: 'Compare Sigmoid, Tanh, ReLU, and Leaky ReLU alongside their derivatives.',
    visualizationType: 'function-graph',
    formula: 'σ(x) = 1 / (1 + e⁻ˣ)  |  tanh(x)  |  ReLU(x) = max(0, x)',
    parameters: [
      { name: 'inputX', label: 'Evaluation Point (x)', min: -6, max: 6, step: 0.1, default: 1.5 },
      { name: 'leakyAlpha', label: 'Leaky Slope (α)', min: 0.01, max: 0.5, step: 0.02, default: 0.1 },
    ],
    presets: [
      { id: 'saturation-high', label: 'Saturation Zone (+5)', params: { inputX: 5.0, leakyAlpha: 0.1 }, description: 'Sigmoid gradient vanishes near 0.' },
      { id: 'linear-region', label: 'Linear Center (0)', params: { inputX: 0.0, leakyAlpha: 0.1 }, description: 'Steepest gradient region.' },
      { id: 'dead-relu', label: 'Dead ReLU Zone (-4)', params: { inputX: -4.0, leakyAlpha: 0.1 }, description: 'Standard ReLU derivative is exactly zero.' },
    ],
    compute: (params) => {
      const x = params.inputX ?? 1.5;
      const _alpha = params.leakyAlpha ?? 0.1;

      // Primary function: Sigmoid
      const sigmoid = (v) => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, v))));
      // Derivative: d/dx sigmoid = σ(x)(1 - σ(x))
      const sigDeriv = (v) => {
        const s = sigmoid(v);
        return s * (1 - s);
      };

      const curVal = sigmoid(x);
      const curGrad = sigDeriv(x);

      return {
        graphData: {
          xMin: -6,
          xMax: 6,
          yMin: -0.2,
          yMax: 1.2,
          fn: sigmoid,
          secFn: sigDeriv,
          points: [
            { x, y: curVal, color: 'var(--accent-icy, #65CFFF)', label: `σ(${x.toFixed(1)})=${curVal.toFixed(2)}` },
            { x, y: curGrad, color: 'var(--accent-yellow, #FFD928)', label: `σ'=${curGrad.toFixed(3)}` },
          ],
        },
        metrics: [
          { id: 'val', label: 'Activation Output σ(x)', value: curVal, color: 'var(--accent-icy, #65CFFF)' },
          { id: 'grad', label: 'Gradient σ\'(x)', value: curGrad, color: 'var(--accent-yellow, #FFD928)', formula: "σ(x)·(1 - σ(x))" },
          { id: 'zone', label: 'Gradient Regime', value: curGrad < 0.05 ? 'VANISHING (< 0.05)' : 'HEALTHY FLOW', color: curGrad < 0.05 ? 'var(--accent-red, #ef4444)' : 'var(--accent-emerald, #10b981)' },
        ],
        substituted: `x = ${x.toFixed(2)} → σ(${x.toFixed(2)}) = ${curVal.toFixed(4)}, Gradient = ${curGrad.toFixed(4)}`,
        explanation: {
          whatChanged: `At input x = ${x.toFixed(2)}, the output is ${curVal.toFixed(3)} with gradient ${curGrad.toFixed(4)}.`,
          why: 'When x is far from 0, the curve flattens completely into the saturation plateau.',
          mathematics: "Maximum derivative of Sigmoid is only 0.25 at x=0. Cascading multiple layers exponentially multiplies values < 0.25 toward 0.",
          takeaway: 'Non-linearities allow neural networks to fit complex shapes, but bounded functions suffer from vanishing gradients in deep networks.',
        },
      };
    },
  },

  'forward-propagation': {
    id: 'forward-propagation',
    domain: 'deep-learning',
    title: 'Forward Signal Propagation (MLP)',
    subtitle: 'Trace forward activations flowing from inputs through hidden layers to produce a final prediction.',
    visualizationType: 'neural-network',
    formula: 'h₁ = σ(w₁₁x₁ + w₂₁x₂ + b₁),  ŷ = σ(v₁h₁ + v₂h₂ + c)',
    parameters: [
      { name: 'x1', label: 'Input x₁', min: 0.0, max: 2.0, step: 0.1, default: 1.0 },
      { name: 'x2', label: 'Input x₂', min: 0.0, max: 2.0, step: 0.1, default: 0.5 },
      { name: 'w11', label: 'Hidden Weight w₁₁', min: -3, max: 3, step: 0.2, default: 1.5 },
      { name: 'v1', label: 'Output Weight v₁', min: -3, max: 3, step: 0.2, default: 1.2 },
    ],
    presets: [
      { id: 'high-firing', label: 'High Excitation', params: { x1: 1.8, x2: 1.5, w11: 2.5, v1: 2.0 }, description: 'Strong signals triggering high output probability.' },
      { id: 'balanced', label: 'Balanced Signals', params: { x1: 1.0, x2: 0.5, w11: 1.5, v1: 1.2 }, description: 'Normal operation regime.' },
      { id: 'inhibited', label: 'Inhibited Pathway', params: { x1: 1.0, x2: 1.0, w11: -2.0, v1: -1.5 }, description: 'Negative weights dampening signal transmission.' },
    ],
    compute: (params) => {
      const x1 = params.x1 ?? 1.0;
      const x2 = params.x2 ?? 0.5;
      const w11 = params.w11 ?? 1.5;
      const v1 = params.v1 ?? 1.2;

      const sig = (v) => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, v))));

      const z_h1 = x1 * w11 + x2 * 0.8 - 0.5;
      const z_h2 = x1 * 0.5 - x2 * 1.2 + 0.2;
      const h1 = sig(z_h1);
      const h2 = sig(z_h2);

      const z_out = h1 * v1 + h2 * 0.9 - 0.3;
      const yPred = sig(z_out);

      const loss = 0.5 * Math.pow(1.0 - yPred, 2);

      return {
        graphData: {
          layers: [
            { name: 'Input', nodes: [{ id: 'x1', label: 'x₁', val: x1 }, { id: 'x2', label: 'x₂', val: x2 }] },
            { name: 'Hidden', nodes: [{ id: 'h1', label: 'h₁', val: h1 }, { id: 'h2', label: 'h₂', val: h2 }] },
            { name: 'Output', nodes: [{ id: 'y', label: 'ŷ', val: yPred }] },
          ],
          isBackprop: false,
        },
        metrics: [
          { id: 'h1', label: 'Hidden h₁ Activation', value: h1, color: 'var(--accent-icy, #65CFFF)', formula: 'σ(W₁x + b₁)' },
          { id: 'pred', label: 'Model Prediction ŷ', value: yPred, color: 'var(--accent-yellow, #FFD928)', formula: 'σ(V·h + c)' },
          { id: 'loss', label: 'Squared Loss (Target=1)', value: loss, color: loss < 0.1 ? 'var(--accent-emerald, #10b981)' : 'var(--accent-red, #ef4444)', formula: '½(y - ŷ)²' },
        ],
        substituted: `Input [${x1.toFixed(1)}, ${x2.toFixed(1)}] → Hidden [${h1.toFixed(2)}, ${h2.toFixed(2)}] → ŷ = ${yPred.toFixed(3)} (Loss = ${loss.toFixed(4)})`,
        explanation: {
          whatChanged: `Inputs propagate forward into hidden representations [${h1.toFixed(2)}, ${h2.toFixed(2)}] yielding final output ŷ = ${yPred.toFixed(3)}.`,
          why: 'Each successive layer projects raw features into higher-order abstract spaces that can be linearly partitioned by the final unit.',
          mathematics: 'Matrix notation: a^(l) = σ(W^(l) a^(l-1) + b^(l)). Each layer is an affine transformation composed with an elementwise non-linearity.',
          takeaway: 'Forward propagation computes predictions; the difference between ŷ and ground truth drives gradient descent learning.',
        },
      };
    },
  },

  'backpropagation-gradients': {
    id: 'backpropagation-gradients',
    domain: 'deep-learning',
    title: 'Backpropagation & Chain-Rule Gradients',
    subtitle: 'Step through chain-rule gradient calculations flowing backward from loss to weight updates.',
    visualizationType: 'neural-network',
    formula: '∂L/∂w = (∂L/∂ŷ) · (∂ŷ/∂z) · (∂z/∂w)',
    parameters: [
      { name: 'target', label: 'Ground Truth Target (y)', min: 0.0, max: 1.0, step: 0.1, default: 1.0 },
      { name: 'learningRate', label: 'Learning Rate (η)', min: 0.01, max: 1.0, step: 0.05, default: 0.2 },
      { name: 'outputWeight', label: 'Output Weight (v₁)', min: -2.5, max: 2.5, step: 0.1, default: 1.4 },
    ],
    presets: [
      { id: 'large-error', label: 'High Error State', params: { target: 1.0, learningRate: 0.2, outputWeight: -1.5 }, description: 'Target 1.0 but network predicts near 0, producing large gradient.' },
      { id: 'converged', label: 'Near Convergence', params: { target: 1.0, learningRate: 0.1, outputWeight: 2.2 }, description: 'Prediction matches target, gradients diminish to zero.' },
    ],
    compute: (params) => {
      const yTarget = params.target ?? 1.0;
      const lr = params.learningRate ?? 0.2;
      const v1 = params.outputWeight ?? 1.4;

      const sig = (v) => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, v))));

      const h1 = 0.82;
      const h2 = 0.45;
      const z_out = h1 * v1 + h2 * 0.7 - 0.2;
      const yPred = sig(z_out);

      const dL_dPred = yPred - yTarget;
      const dPred_dz = yPred * (1 - yPred);
      const deltaOut = dL_dPred * dPred_dz;
      const gradV1 = deltaOut * h1;
      const v1New = v1 - lr * gradV1;

      return {
        graphData: {
          layers: [
            { name: 'Input', nodes: [{ id: 'x1', label: 'x₁', val: 1.0 }, { id: 'x2', label: 'x₂', val: 0.5 }] },
            { name: 'Hidden', nodes: [{ id: 'h1', label: 'h₁', val: h1 }, { id: 'h2', label: 'h₂', val: h2 }] },
            { name: 'Output', nodes: [{ id: 'y', label: 'δ', val: deltaOut }] },
          ],
          isBackprop: true,
        },
        metrics: [
          { id: 'error', label: 'Prediction Error (ŷ - y)', value: dL_dPred, color: Math.abs(dL_dPred) > 0.4 ? 'var(--accent-red, #ef4444)' : 'var(--accent-emerald, #10b981)', formula: 'ŷ - y' },
          { id: 'delta', label: 'Output Gradient δ', value: deltaOut, color: 'var(--accent-yellow, #FFD928)', formula: '∂L/∂z' },
          { id: 'grad', label: 'Weight Gradient ∂L/∂v₁', value: gradV1, color: 'var(--accent-icy, #65CFFF)', formula: 'δ · h₁' },
          { id: 'update', label: 'Updated Weight v₁⁺', value: v1New, color: 'var(--accent-electric, #164BFF)', formula: 'v₁ - η·∇' },
        ],
        substituted: `δ = (${dL_dPred.toFixed(3)}) · ${dPred_dz.toFixed(3)} = ${deltaOut.toFixed(3)} → ∂L/∂v₁ = (${deltaOut.toFixed(3)})·(${h1}) = ${gradV1.toFixed(3)} → v₁⁺ = ${v1New.toFixed(3)}`,
        explanation: {
          whatChanged: `Prediction ŷ = ${yPred.toFixed(3)} deviates from target ${yTarget.toFixed(1)} by ${dL_dPred.toFixed(3)}, propagating gradient δ = ${deltaOut.toFixed(4)}.`,
          why: 'By applying the chain rule, each weight receives an exact scalar contribution telling it which direction reduces total loss.',
          mathematics: '∂L/∂w_ij = δ_j · a_i. The gradient factorizes into upstream error δ_j and local incoming activation a_i.',
          takeaway: 'Backpropagation is reverse-mode automatic differentiation that scales in O(weights) time rather than O(weights²).',
        },
      };
    },
  },

  // =========================================================================
  // DOMAIN 2: DATA SCIENCE
  // =========================================================================
  'linear-functions': {
    id: 'linear-functions',
    domain: 'data-science',
    title: 'Linear Functions: Slope & Intercept',
    subtitle: 'Explore the fundamental equation y = mx + c that underpins regression analysis and neural boundaries.',
    visualizationType: 'function-graph',
    formula: 'y = m·x + c',
    parameters: [
      { name: 'slope', label: 'Slope (m)', min: -5, max: 5, step: 0.2, default: 2.0, unit: 'm' },
      { name: 'intercept', label: 'Intercept (c)', min: -8, max: 8, step: 0.5, default: 1.0, unit: 'c' },
    ],
    presets: [
      { id: 'positive-steep', label: 'Steep Positive (m=3)', params: { slope: 3.0, intercept: 0.0 }, description: 'Steep upward slope passing through origin.' },
      { id: 'horizontal', label: 'Constant / Horizontal (m=0)', params: { slope: 0.0, intercept: 4.0 }, description: 'Zero rate of change (constant function).' },
      { id: 'negative-slope', label: 'Negative Slope (m=-1.5)', params: { slope: -1.5, intercept: 2.0 }, description: 'Inverse relationship between x and y.' },
    ],
    compute: (params) => {
      const m = params.slope ?? 2.0;
      const c = params.intercept ?? 1.0;
      const fn = (x) => m * x + c;

      const yIntercept = c;
      const xIntercept = m !== 0 ? -c / m : null;

      const highlightPoints = [{ x: 0, y: yIntercept, color: 'var(--accent-yellow, #FFD928)', label: `(0, ${c.toFixed(1)})` }];
      if (xIntercept !== null && xIntercept >= -10 && xIntercept <= 10) {
        highlightPoints.push({ x: xIntercept, y: 0, color: 'var(--accent-icy, #65CFFF)', label: `(${xIntercept.toFixed(1)}, 0)` });
      }

      return {
        graphData: {
          xMin: -10,
          xMax: 10,
          yMin: -10,
          yMax: 10,
          fn,
          points: highlightPoints,
        },
        metrics: [
          { id: 'slope', label: 'Rate of Change (Δy/Δx)', value: m, color: 'var(--accent-electric, #164BFF)' },
          { id: 'intercept', label: 'Y-Intercept (c)', value: c, color: 'var(--accent-yellow, #FFD928)' },
          { id: 'angle', label: 'Inclination Angle', value: Math.round((Math.atan(m) * 180) / Math.PI), unit: '°', color: 'var(--accent-cyan, #06b6d4)' },
        ],
        substituted: `y = (${m.toFixed(2)})·x + (${c.toFixed(2)})`,
        explanation: {
          whatChanged: `Line equation updated to y = ${m.toFixed(2)}x + ${c.toFixed(2)}.`,
          why: `For every 1 unit increase in x, y changes by exactly ${m.toFixed(2)} units.`,
          mathematics: 'The slope m = Δy/Δx defines the derivative everywhere along the line.',
          takeaway: 'Linear functions model proportional relationships and serve as the backbone of linear regression and perceptrons.',
        },
      };
    },
  },

  'descriptive-statistics': {
    id: 'descriptive-statistics',
    domain: 'data-science',
    title: 'Descriptive Statistics & Dispersion',
    subtitle: 'Observe how changing the sample mean and spread shifts the distribution histogram and variance.',
    visualizationType: 'histogram-distribution',
    formula: 'μ = (1/n) Σ xᵢ  |  σ² = (1/n) Σ (xᵢ - μ)²',
    parameters: [
      { name: 'mean', label: 'Distribution Mean (μ)', min: -3, max: 3, step: 0.2, default: 0.0 },
      { name: 'std', label: 'Standard Deviation (σ)', min: 0.5, max: 3.0, step: 0.1, default: 1.2 },
    ],
    presets: [
      { id: 'standard-normal', label: 'Standard Normal (0, 1)', params: { mean: 0.0, std: 1.0 }, description: 'Classic bell curve centered at zero.' },
      { id: 'high-variance', label: 'High Dispersion (0, 2.5)', params: { mean: 0.0, std: 2.5 }, description: 'Wide flat spread across the domain.' },
      { id: 'shifted-mean', label: 'Shifted Mean (2, 0.8)', params: { mean: 2.0, std: 0.8 }, description: 'Tight peak shifted to the right.' },
    ],
    compute: (params) => {
      const mu = params.mean ?? 0.0;
      const sigma = params.std ?? 1.2;
      const variance = sigma * sigma;

      // Generate 12 histogram bins
      const binWidth = 0.6;
      const bins = [];
      for (let x0 = -5; x0 <= 5; x0 += binWidth) {
        const x1 = x0 + binWidth;
        const mid = (x0 + x1) / 2;
        // Normal pdf height
        const height = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((mid - mu) / sigma, 2));
        const count = Math.round(height * 100);
        bins.push({ x0, x1, count });
      }

      return {
        graphData: {
          bins,
          mean: mu,
          std: sigma,
          xMin: -5,
          xMax: 5,
        },
        metrics: [
          { id: 'mean', label: 'Sample Mean (μ)', value: mu, color: 'var(--accent-yellow, #FFD928)', formula: 'Σ x / n' },
          { id: 'std', label: 'Std Deviation (σ)', value: sigma, color: 'var(--accent-cyan, #06b6d4)', formula: '√Var' },
          { id: 'var', label: 'Variance (σ²)', value: variance, color: 'var(--accent-electric, #164BFF)', formula: 'E[(x - μ)²]' },
        ],
        substituted: `Normal(μ = ${mu.toFixed(2)}, σ = ${sigma.toFixed(2)}) → Variance σ² = ${variance.toFixed(3)}`,
        explanation: {
          whatChanged: `Center of mass is anchored at μ = ${mu.toFixed(2)} with standard deviation σ = ${sigma.toFixed(2)}.`,
          why: 'The mean shifts the center horizontally; standard deviation controls how broadly observations spread.',
          mathematics: 'By the 68-95-99.7 rule, 68.2% of all data points fall within [μ - σ, μ + σ].',
          takeaway: 'Mean measures central tendency, while standard deviation measures risk and statistical uncertainty.',
        },
      };
    },
  },

  'correlation-analysis': {
    id: 'correlation-analysis',
    domain: 'data-science',
    title: 'Correlation & Scatter Analysis',
    subtitle: 'Analyze the linear association between two variables and compute the Pearson correlation coefficient r.',
    visualizationType: 'scatter-regression',
    formula: 'r = Σ (xᵢ - x̄)(yᵢ - ȳ) / √[Σ(xᵢ - x̄)² Σ(yᵢ - ȳ)²]',
    parameters: [
      { name: 'corrTarget', label: 'Target Correlation (r)', min: -0.98, max: 0.98, step: 0.05, default: 0.8 },
      { name: 'noise', label: 'Noise Dispersion', min: 0.1, max: 1.5, step: 0.1, default: 0.4 },
    ],
    presets: [
      { id: 'strong-pos', label: 'Strong Positive (r ≈ 0.95)', params: { corrTarget: 0.95, noise: 0.2 }, description: 'Tight upward co-movement.' },
      { id: 'uncorrelated', label: 'Uncorrelated (r ≈ 0.0)', params: { corrTarget: 0.0, noise: 1.2 }, description: 'Random scatter with zero linear relationship.' },
      { id: 'strong-neg', label: 'Strong Negative (r ≈ -0.9)', params: { corrTarget: -0.9, noise: 0.25 }, description: 'As X increases, Y steadily decreases.' },
    ],
    compute: (params) => {
      const rTarget = params.corrTarget ?? 0.8;
      const noise = params.noise ?? 0.4;

      // Deterministic synthetic scatter points
      const n = 35;
      const points = [];
      let sumX = 0;
      let sumY = 0;
      for (let i = 0; i < n; i++) {
        // Pseudo-random deterministic distribution based on index
        const t = (i / (n - 1)) * 10 - 5;
        const randSeed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
        const e = (randSeed - Math.floor(randSeed)) * 2 - 1;
        const y = rTarget * t + Math.sqrt(Math.max(0.01, 1 - rTarget * rTarget)) * e * noise * 3.5;
        points.push({ x: t + 5, y: y + 5 });
        sumX += t + 5;
        sumY += y + 5;
      }

      const meanX = sumX / n;
      const meanY = sumY / n;

      let num = 0;
      let denX = 0;
      let denY = 0;
      for (const p of points) {
        const dx = p.x - meanX;
        const dy = p.y - meanY;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
      }

      const r = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;
      const slope = denX > 0 ? num / denX : 0;
      const intercept = meanY - slope * meanX;

      return {
        graphData: {
          points,
          slope,
          intercept,
          showResiduals: true,
          xMin: 0,
          xMax: 10,
          yMin: 0,
          yMax: 10,
        },
        metrics: [
          { id: 'r', label: 'Pearson r', value: r, color: Math.abs(r) > 0.7 ? 'var(--accent-emerald, #10b981)' : 'var(--accent-yellow, #FFD928)' },
          { id: 'r2', label: 'R-Squared (r²)', value: r * r, color: 'var(--accent-icy, #65CFFF)' },
          { id: 'strength', label: 'Association', value: Math.abs(r) > 0.7 ? 'STRONG' : Math.abs(r) > 0.3 ? 'MODERATE' : 'WEAK / NONE', color: 'var(--accent-cyan, #06b6d4)' },
        ],
        substituted: `r = ${r.toFixed(3)}, Line of Best Fit: y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
        explanation: {
          whatChanged: `Empirical correlation coefficient computed at r = ${r.toFixed(3)}.`,
          why: 'Positive r indicates that above-average values of X coincide with above-average values of Y.',
          mathematics: 'r is bounded strictly within [-1.0, +1.0]. r² = ' + (r * r).toFixed(2) + ' represents the variance in Y explained by X.',
          takeaway: 'Correlation measures linear association, but correlation does not imply causation.',
        },
      };
    },
  },

  'correlation-matrix': {
    id: 'correlation-matrix',
    domain: 'data-science',
    title: 'Correlation Matrix & Multicollinearity',
    subtitle: 'Explore pair-wise feature dependencies and identify multicollinear relationships in tabular datasets.',
    visualizationType: 'correlation-heatmap',
    formula: 'R = [r(Xᵢ, Xⱼ)] where r ∈ [-1.0, +1.0]',
    parameters: [
      { name: 'rIncomeSpend', label: 'Income vs Spending (r)', min: -1.0, max: 1.0, step: 0.05, default: 0.85 },
      { name: 'rAgeIncome', label: 'Age vs Income (r)', min: -1.0, max: 1.0, step: 0.05, default: 0.60 },
      { name: 'rAgeSpend', label: 'Age vs Spending (r)', min: -1.0, max: 1.0, step: 0.05, default: -0.35 },
    ],
    presets: [
      { id: 'multicollinear', label: 'High Multicollinearity', params: { rIncomeSpend: 0.95, rAgeIncome: 0.90, rAgeSpend: 0.85 }, description: 'Redundant features causing regression instability.' },
      { id: 'independent', label: 'Orthogonal Features', params: { rIncomeSpend: 0.0, rAgeIncome: 0.05, rAgeSpend: -0.05 }, description: 'Ideal uncorrelated feature set for machine learning.' },
      { id: 'tradeoff', label: 'Life-Cycle Tradeoff', params: { rIncomeSpend: 0.85, rAgeIncome: 0.60, rAgeSpend: -0.35 }, description: 'Income increases with age, but spending propensity shifts.' },
    ],
    compute: (params) => {
      const r12 = params.rIncomeSpend ?? 0.85;
      const r13 = params.rAgeIncome ?? 0.60;
      const r23 = params.rAgeSpend ?? -0.35;

      const labels = ['Income', 'Spend', 'Age'];
      const matrix = [
        [1.0, r12, r13],
        [r12, 1.0, r23],
        [r13, r23, 1.0],
      ];

      const det = 1 - (r12 * r12) - (r13 * r13) - (r23 * r23) + (2 * r12 * r13 * r23);

      return {
        graphData: {
          labels,
          matrix,
        },
        metrics: [
          { id: 'det', label: 'Matrix Determinant |R|', value: det, color: det > 0.3 ? 'var(--accent-emerald, #10b981)' : 'var(--accent-red, #ef4444)', formula: 'det(R)' },
          { id: 'status', label: 'Matrix Condition', value: det > 0.2 ? 'WELL-CONDITIONED' : 'NEAR SINGULAR', color: det > 0.2 ? 'var(--accent-cyan, #06b6d4)' : 'var(--accent-amber, #f59e0b)' },
          { id: 'collinear', label: 'Max Pairwise Correlation', value: Math.max(Math.abs(r12), Math.abs(r13), Math.abs(r23)), color: 'var(--accent-yellow, #FFD928)' },
        ],
        substituted: `det(R) = 1 - (${r12.toFixed(2)})² - (${r13.toFixed(2)})² - (${r23.toFixed(2)})² + 2(${r12.toFixed(2)})(${r13.toFixed(2)})(${r23.toFixed(2)}) = ${det.toFixed(3)}`,
        explanation: {
          whatChanged: `Correlation matrix updated with Income-Spend r=${r12.toFixed(2)}, Age-Income r=${r13.toFixed(2)}, Age-Spend r=${r23.toFixed(2)}.`,
          why: 'Off-diagonal cells close to ±1.0 indicate strong shared information and redundancy between variables.',
          mathematics: 'A valid correlation matrix must be positive semi-definite (det(R) ≥ 0). When determinant approaches 0, feature columns become linearly dependent.',
          takeaway: 'Multicollinearity inflates coefficient variance in regression; drop or combine correlated features via PCA.',
        },
      };
    },
  },

  'vector-transformations': {
    id: 'vector-transformations',
    domain: 'data-science',
    title: 'Linear Algebra: 2D Vector Operations',
    subtitle: 'Manipulate vectors in Cartesian space, compute dot products, norms, angles, and resultant addition.',
    visualizationType: 'vector-space',
    formula: 'v₁ · v₂ = ||v₁|| · ||v₂|| · cos(θ) = x₁x₂ + y₁y₂',
    parameters: [
      { name: 'v1x', label: 'Vector v₁ X', min: -5, max: 5, step: 0.5, default: 3.0 },
      { name: 'v1y', label: 'Vector v₁ Y', min: -5, max: 5, step: 0.5, default: 2.0 },
      { name: 'v2x', label: 'Vector v₂ X', min: -5, max: 5, step: 0.5, default: 1.0 },
      { name: 'v2y', label: 'Vector v₂ Y', min: -5, max: 5, step: 0.5, default: 4.0 },
    ],
    presets: [
      { id: 'orthogonal', label: 'Orthogonal (Perpendicular)', params: { v1x: 4.0, v1y: 0.0, v2x: 0.0, v2y: 3.0 }, description: 'Dot product is exactly 0; angle is 90°.' },
      { id: 'collinear', label: 'Collinear (Parallel)', params: { v1x: 2.0, v1y: 3.0, v2x: 4.0, v2y: 6.0 }, description: 'Cosine similarity is exactly 1.0.' },
      { id: 'opposite', label: 'Opposite Directions', params: { v1x: 3.0, v1y: 2.0, v2x: -3.0, v2y: -2.0 }, description: 'Angle is 180°; dot product is negative maximum.' },
    ],
    compute: (params) => {
      const x1 = params.v1x ?? 3.0;
      const y1 = params.v1y ?? 2.0;
      const x2 = params.v2x ?? 1.0;
      const y2 = params.v2y ?? 4.0;

      const norm1 = Math.sqrt(x1 * x1 + y1 * y1);
      const norm2 = Math.sqrt(x2 * x2 + y2 * y2);
      const dot = x1 * x2 + y1 * y2;

      const cosSim = norm1 > 0 && norm2 > 0 ? Math.max(-1, Math.min(1, dot / (norm1 * norm2))) : 0;
      const angleDeg = Math.round((Math.acos(cosSim) * 180) / Math.PI);

      return {
        graphData: {
          v1: { x: x1, y: y1, label: 'v₁', color: 'var(--accent-cyan, #06b6d4)' },
          v2: { x: x2, y: y2, label: 'v₂', color: 'var(--accent-yellow, #FFD928)' },
          showSum: true,
        },
        metrics: [
          { id: 'dot', label: 'Dot Product (v₁·v₂)', value: dot, color: 'var(--accent-icy, #65CFFF)', formula: 'x₁x₂ + y₁y₂' },
          { id: 'angle', label: 'Angle θ', value: angleDeg, unit: '°', color: 'var(--accent-yellow, #FFD928)' },
          { id: 'norm1', label: 'Magnitude ||v₁||', value: norm1, color: 'var(--accent-cyan, #06b6d4)', formula: '√(x² + y²)' },
          { id: 'sim', label: 'Cosine Similarity', value: cosSim, color: 'var(--accent-emerald, #10b981)', formula: 'cos(θ)' },
        ],
        substituted: `v₁ = [${x1.toFixed(1)}, ${y1.toFixed(1)}], v₂ = [${x2.toFixed(1)}, ${y2.toFixed(1)}] → v₁·v₂ = (${x1.toFixed(1)}·${x2.toFixed(1)}) + (${y1.toFixed(1)}·${y2.toFixed(1)}) = ${dot.toFixed(2)} (θ = ${angleDeg}°)`,
        explanation: {
          whatChanged: `Vector v₁ is oriented at (${x1.toFixed(1)}, ${y1.toFixed(1)}) and v₂ at (${x2.toFixed(1)}, ${y2.toFixed(1)}), with sum at (${(x1 + x2).toFixed(1)}, ${(y1 + y2).toFixed(1)}).`,
          why: 'The dot product projects one vector onto the line of the other, scaling by magnitude.',
          mathematics: 'When dot product = 0, vectors are orthogonal (perpendicular). When cos(θ) = 1, vectors point in identical directions.',
          takeaway: 'Vector spaces are the geometric foundation of word embeddings, attention scores, PCA, and neural representations.',
        },
      };
    },
  },

  // =========================================================================
  // DOMAIN 3: MACHINE LEARNING
  // =========================================================================
  'perceptron-classifier': {
    id: 'perceptron-classifier',
    domain: 'machine-learning',
    title: 'Perceptron 2D Decision Boundary',
    subtitle: 'Observe how weights w₁x₁ + w₂x₂ + b = 0 partition two-dimensional feature space into two classes.',
    visualizationType: 'scatter-regression',
    formula: 'Decision Line: w₁·x₁ + w₂·x₂ + b = 0  →  x₂ = -(w₁/w₂)·x₁ - (b/w₂)',
    parameters: [
      { name: 'w1', label: 'Weight w₁', min: -3, max: 3, step: 0.1, default: 1.0 },
      { name: 'w2', label: 'Weight w₂', min: -3, max: 3, step: 0.1, default: 1.2 },
      { name: 'bias', label: 'Bias b', min: -6, max: 6, step: 0.2, default: -2.8 },
    ],
    presets: [
      { id: 'separable', label: 'Clean Separation', params: { w1: 1.2, w2: 1.0, bias: -3.2 }, description: 'Separates blue and yellow clusters cleanly.' },
      { id: 'vertical-split', label: 'Vertical Split (w₂ ≈ 0)', params: { w1: 2.5, w2: 0.2, bias: -4.0 }, description: 'Boundary relies almost entirely on x₁.' },
      { id: 'misclassified', label: 'High Error State', params: { w1: -1.0, w2: 0.5, bias: 0.5 }, description: 'Suboptimal weights misclassifying points.' },
    ],
    compute: (params) => {
      const w1 = params.w1 ?? 1.0;
      const w2 = Math.abs(params.w2) < 0.05 ? 0.05 : params.w2;
      const b = params.bias ?? -2.8;

      // Boundary line: x2 = -(w1/w2)*x1 - (b/w2)
      const slope = -w1 / w2;
      const intercept = -b / w2;

      // Two synthetic 2D clusters
      const points = [
        { x: 1.2, y: 1.5, label: 0 }, { x: 2.0, y: 1.0, label: 0 }, { x: 1.5, y: 2.2, label: 0 },
        { x: 2.5, y: 2.8, label: 0 }, { x: 0.8, y: 2.0, label: 0 }, { x: 2.1, y: 1.8, label: 0 },
        { x: 4.5, y: 5.2, label: 1 }, { x: 5.0, y: 4.2, label: 1 }, { x: 5.8, y: 5.5, label: 1 },
        { x: 6.2, y: 4.8, label: 1 }, { x: 4.8, y: 6.0, label: 1 }, { x: 5.4, y: 5.8, label: 1 },
      ];

      let correct = 0;
      for (const p of points) {
        const score = w1 * p.x + w2 * p.y + b;
        const pred = score >= 0 ? 1 : 0;
        if (pred === p.label) correct++;
      }

      const accuracy = (correct / points.length) * 100;

      return {
        graphData: {
          points,
          slope,
          intercept,
          showResiduals: false,
          xMin: 0,
          xMax: 8,
          yMin: 0,
          yMax: 8,
        },
        metrics: [
          { id: 'acc', label: 'Classification Accuracy', value: accuracy, unit: '%', color: accuracy > 85 ? 'var(--accent-emerald, #10b981)' : 'var(--accent-yellow, #FFD928)' },
          { id: 'correct', label: 'Correct Predictions', value: `${correct}/${points.length}`, color: 'var(--accent-cyan, #06b6d4)' },
          { id: 'slope', label: 'Boundary Slope', value: slope, color: 'var(--accent-icy, #65CFFF)' },
        ],
        substituted: `${w1.toFixed(1)}·x₁ + ${w2.toFixed(1)}·x₂ + (${b.toFixed(1)}) = 0  →  x₂ = ${slope.toFixed(2)}x₁ + ${intercept.toFixed(2)}`,
        explanation: {
          whatChanged: `Decision boundary adjusted to slope ${slope.toFixed(2)} with intercept ${intercept.toFixed(2)}.`,
          why: 'Points on the positive side of the hyper-plane are classified as Class 1 (yellow); points on the negative side as Class 0 (blue).',
          mathematics: 'The weight vector [w₁, w₂] is orthogonal (perpendicular) to the decision boundary line.',
          takeaway: 'The perceptron algorithm learns by iteratively nudging the boundary whenever a point is misclassified.',
        },
      };
    },
  },

  'kmeans-clustering': {
    id: 'kmeans-clustering',
    domain: 'machine-learning',
    title: 'K-Means Clustering & Centroid Assignment',
    subtitle: 'Observe how centroids iteratively attract nearby points and partition unlabelled data to minimize within-cluster variance.',
    visualizationType: 'clustering',
    formula: 'WCSS = Σⱼ Σᵢ ||xᵢ^(j) - cⱼ||²',
    parameters: [
      { name: 'separation', label: 'Cluster Separation', min: 1.0, max: 4.5, step: 0.5, default: 2.5 },
      { name: 'c1x', label: 'Centroid 1 X', min: 1.0, max: 5.0, step: 0.5, default: 2.5 },
      { name: 'c2x', label: 'Centroid 2 X', min: 4.0, max: 9.0, step: 0.5, default: 7.0 },
    ],
    presets: [
      { id: 'optimal-centers', label: 'Well-Positioned Centroids', params: { separation: 3.0, c1x: 2.5, c2x: 7.5 }, description: 'Centroids align closely with the natural cluster centers.' },
      { id: 'poor-init', label: 'Suboptimal Initialization', params: { separation: 3.5, c1x: 4.8, c2x: 5.2 }, description: 'Both centroids initialized close together in the center.' },
    ],
    compute: (params) => {
      const sep = params.separation ?? 2.5;
      const c1x = params.c1x ?? 2.5;
      const c2x = params.c2x ?? 7.0;

      const c1 = { x: c1x, y: 3.0 };
      const c2 = { x: c2x, y: 7.0 };

      const rawPoints = [
        { x: 2.0, y: 2.5 }, { x: 2.5, y: 3.8 }, { x: 1.5, y: 3.0 }, { x: 3.2, y: 2.2 },
        { x: 2.8, y: 3.5 }, { x: 1.8, y: 2.0 }, { x: 3.0, y: 3.0 }, { x: 2.2, y: 4.0 },
        { x: 5.0 + sep * 0.7, y: 6.5 }, { x: 5.5 + sep * 0.7, y: 7.5 }, { x: 6.2 + sep * 0.7, y: 6.8 },
        { x: 5.8 + sep * 0.7, y: 8.0 }, { x: 6.5 + sep * 0.7, y: 7.0 }, { x: 5.2 + sep * 0.7, y: 6.2 },
      ];

      let wcss = 0;
      let count0 = 0;
      let count1 = 0;
      const assignedPoints = rawPoints.map((p) => {
        const d1 = Math.pow(p.x - c1.x, 2) + Math.pow(p.y - c1.y, 2);
        const d2 = Math.pow(p.x - c2.x, 2) + Math.pow(p.y - c2.y, 2);
        const cluster = d1 <= d2 ? 0 : 1;
        const distSq = Math.min(d1, d2);
        wcss += distSq;
        if (cluster === 0) count0++;
        else count1++;
        return { ...p, cluster };
      });

      return {
        graphData: {
          points: assignedPoints,
          centroids: [c1, c2],
          xMin: 0,
          xMax: 10,
          yMin: 0,
          yMax: 10,
        },
        metrics: [
          { id: 'wcss', label: 'WCSS (Inertia)', value: wcss, color: wcss < 35 ? 'var(--accent-emerald, #10b981)' : 'var(--accent-yellow, #FFD928)', formula: 'Σ ||x - c||²' },
          { id: 'c1_count', label: 'Cluster 1 Membership', value: count0, color: 'var(--accent-icy, #65CFFF)' },
          { id: 'c2_count', label: 'Cluster 2 Membership', value: count1, color: 'var(--accent-yellow, #FFD928)' },
        ],
        substituted: `Centroid C₁ at (${c1.x.toFixed(1)}, ${c1.y.toFixed(1)}), C₂ at (${c2.x.toFixed(1)}, ${c2.y.toFixed(1)}) → WCSS = ${wcss.toFixed(2)}`,
        explanation: {
          whatChanged: `Points assigned to closest centroids C₁ and C₂, with total within-cluster sum of squares = ${wcss.toFixed(1)}.`,
          why: 'Voronoi partitioning draws perpendicular bisectors between centroids, grouping observations into convex regions.',
          mathematics: 'K-Means alternates between Expectation (reassigning points) and Maximization (moving centroids to cluster means) until convergence.',
          takeaway: 'K-Means is sensitive to initialization (mitigated by k-means++) and assumes spherical, equally-sized clusters.',
        },
      };
    },
  },

  'knn-classifier': {
    id: 'knn-classifier',
    domain: 'machine-learning',
    title: 'K-Nearest Neighbors (KNN) Classifier',
    subtitle: 'Explore non-parametric instance-based classification by polling the k closest neighbors in feature space.',
    visualizationType: 'clustering',
    formula: 'ŷ = mode({y_i : x_i ∈ N_k(x_query)})',
    parameters: [
      { name: 'k', label: 'Number of Neighbors (k)', min: 1, max: 7, step: 2, default: 3 },
      { name: 'qx', label: 'Query Point X', min: 1.0, max: 8.0, step: 0.5, default: 4.2 },
      { name: 'qy', label: 'Query Point Y', min: 1.0, max: 8.0, step: 0.5, default: 4.0 },
    ],
    presets: [
      { id: 'ambiguous-boundary', label: 'Ambiguous Boundary (k=3)', params: { k: 3, qx: 4.2, qy: 4.0 }, description: 'Query sits near the boundary where classes compete.' },
      { id: 'clear-blue', label: 'Deep in Blue Territory', params: { k: 3, qx: 2.0, qy: 2.2 }, description: 'Unanimous vote for Class 0.' },
      { id: 'clear-yellow', label: 'Deep in Yellow Territory', params: { k: 5, qx: 6.5, qy: 6.2 }, description: 'Majority vote for Class 1.' },
    ],
    compute: (params) => {
      const k = params.k ?? 3;
      const qx = params.qx ?? 4.2;
      const qy = params.qy ?? 4.0;
      const queryPoint = { x: qx, y: qy };

      const trainPoints = [
        { x: 1.5, y: 1.8, cluster: 0 }, { x: 2.2, y: 1.2, cluster: 0 }, { x: 2.5, y: 2.5, cluster: 0 },
        { x: 3.2, y: 2.8, cluster: 0 }, { x: 1.8, y: 3.5, cluster: 0 }, { x: 3.8, y: 3.2, cluster: 0 },
        { x: 5.2, y: 4.8, cluster: 1 }, { x: 6.0, y: 5.5, cluster: 1 }, { x: 6.8, y: 4.2, cluster: 1 },
        { x: 4.8, y: 6.2, cluster: 1 }, { x: 7.2, y: 6.5, cluster: 1 }, { x: 5.8, y: 6.8, cluster: 1 },
      ];

      const sorted = trainPoints.map((p) => {
        const d = Math.sqrt(Math.pow(p.x - qx, 2) + Math.pow(p.y - qy, 2));
        return { ...p, d };
      }).sort((a, b) => a.d - b.d);

      const kNearest = sorted.slice(0, k);
      const radius = kNearest[k - 1]?.d || 1.0;

      let votes0 = 0;
      let votes1 = 0;
      for (const p of kNearest) {
        if (p.cluster === 0) votes0++;
        else votes1++;
      }

      const predictedClass = votes1 > votes0 ? 1 : 0;
      const confidence = (Math.max(votes0, votes1) / k) * 100;

      const neighborLines = kNearest.map((p) => ({
        x1: qx,
        y1: qy,
        x2: p.x,
        y2: p.y,
      }));

      return {
        graphData: {
          points: trainPoints,
          queryPoint,
          radius,
          neighborLines,
          xMin: 0,
          xMax: 9,
          yMin: 0,
          yMax: 9,
        },
        metrics: [
          { id: 'pred', label: 'Predicted Class', value: predictedClass === 1 ? 'CLASS 1 (YELLOW)' : 'CLASS 0 (BLUE)', color: predictedClass === 1 ? 'var(--accent-yellow, #FFD928)' : 'var(--accent-icy, #65CFFF)' },
          { id: 'votes', label: `Votes (k=${k})`, value: `${votes0} Blue vs ${votes1} Yellow`, color: 'var(--accent-cyan, #06b6d4)' },
          { id: 'conf', label: 'Vote Confidence', value: confidence, unit: '%', color: confidence > 70 ? 'var(--accent-emerald, #10b981)' : 'var(--accent-amber, #f59e0b)' },
        ],
        substituted: `Query (${qx.toFixed(1)}, ${qy.toFixed(1)}) → ${votes0} votes for Class 0, ${votes1} votes for Class 1 → ŷ = Class ${predictedClass}`,
        explanation: {
          whatChanged: `Nearest neighborhood boundary encloses ${k} closest samples at maximum radius r = ${radius.toFixed(2)}.`,
          why: 'KNN does not build an explicit model during training (lazy learning); it defers decision-making until query time by inspecting local point density.',
          mathematics: 'Euclidean distance d(p, q) = √[Σ(pᵢ - qᵢ)²]. Odd k values avoid tie-breaking in binary classification.',
          takeaway: 'Smaller k creates flexible, intricate boundaries prone to noise; larger k produces smoother, more robust decision regions.',
        },
      };
    },
  },

  'gradient-descent': {
    id: 'gradient-descent',
    domain: 'machine-learning',
    title: 'Gradient Descent Optimization',
    subtitle: 'Visualize how the learning rate controls convergence down a convex loss surface toward the optimal minimum.',
    visualizationType: 'function-graph',
    formula: 'w_{t+1} = w_t - η · ∇J(w_t)',
    parameters: [
      { name: 'learningRate', label: 'Learning Rate (η)', min: 0.05, max: 1.1, step: 0.05, default: 0.25 },
      { name: 'currentW', label: 'Current Weight (w)', min: -4.0, max: 4.0, step: 0.2, default: 3.2 },
    ],
    presets: [
      { id: 'smooth-descent', label: 'Optimal Step (η=0.25)', params: { learningRate: 0.25, currentW: 3.2 }, description: 'Smooth, rapid convergence to minimum.' },
      { id: 'overshoot', label: 'Oscillation / Overshoot (η=0.95)', params: { learningRate: 0.95, currentW: 3.5 }, description: 'Large steps oscillating back and forth across the ravine.' },
      { id: 'tiny-step', label: 'Slow Crawl (η=0.05)', params: { learningRate: 0.05, currentW: 3.8 }, description: 'Extremely small updates requiring hundreds of iterations.' },
    ],
    compute: (params) => {
      const lr = params.learningRate ?? 0.25;
      const w = params.currentW ?? 3.2;

      const lossFn = (x) => 0.5 * x * x;
      const grad = w;
      const currentLoss = lossFn(w);
      const nextW = w - lr * grad;
      const nextLoss = lossFn(nextW);

      return {
        graphData: {
          xMin: -5,
          xMax: 5,
          yMin: -0.5,
          yMax: 14,
          fn: lossFn,
          points: [
            { x: w, y: currentLoss, color: 'var(--accent-yellow, #FFD928)', label: `w_t (${w.toFixed(1)}, J=${currentLoss.toFixed(2)})` },
            { x: nextW, y: nextLoss, color: 'var(--accent-icy, #65CFFF)', label: `w_{t+1} (${nextW.toFixed(1)})` },
          ],
        },
        metrics: [
          { id: 'loss', label: 'Current Cost J(w)', value: currentLoss, color: currentLoss < 1 ? 'var(--accent-emerald, #10b981)' : 'var(--accent-red, #ef4444)', formula: '½ w²' },
          { id: 'grad', label: 'Gradient ∇J(w)', value: grad, color: 'var(--accent-yellow, #FFD928)', formula: 'dJ/dw' },
          { id: 'step', label: 'Next Weight (w - η∇)', value: nextW, color: 'var(--accent-cyan, #06b6d4)', formula: 'w - η·∇' },
          { id: 'regime', label: 'Update Dynamics', value: lr > 0.9 ? 'DANGEROUS OSCILLATION' : lr < 0.1 ? 'VERY SLOW CONVERGENCE' : 'HEALTHY DESCENT', color: lr > 0.9 ? 'var(--accent-red, #ef4444)' : 'var(--accent-emerald, #10b981)' },
        ],
        substituted: `w_{t+1} = ${w.toFixed(2)} - (${lr.toFixed(2)}) · (${grad.toFixed(2)}) = ${nextW.toFixed(2)} (Cost: ${currentLoss.toFixed(2)} → ${nextLoss.toFixed(2)})`,
        explanation: {
          whatChanged: `Gradient at w = ${w.toFixed(2)} is ${grad.toFixed(2)}, taking an update step of Δw = ${(-lr * grad).toFixed(2)}.`,
          why: 'The negative gradient points directly toward the direction of steepest descent.',
          mathematics: 'If η < 2/L (where L is the Lipschitz constant of the gradient), gradient descent is guaranteed to converge to the global minimum.',
          takeaway: 'Tuning the learning rate is essential: too high diverges, too low gets stuck or wastes compute.',
        },
      };
    },
  },
};

/**
 * Helper to fetch a registered visualization config by topic ID.
 */
export function getVisualizationConfig(topicId) {
  return VISUALIZATION_REGISTRY[topicId] || null;
}

/**
 * Get all available visualization configs for a given domain.
 */
export function getVisualizationsForDomain(domain) {
  return Object.values(VISUALIZATION_REGISTRY).filter((c) => c.domain === domain);
}
