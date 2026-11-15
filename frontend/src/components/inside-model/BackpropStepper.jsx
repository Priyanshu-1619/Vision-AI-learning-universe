import { useEffect, useState } from 'react';
import {
  FastForward,
  Pause,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  BACKPROP_STAGES,
  DEFAULT_NETWORK_CONFIG,
  advanceBackpropStage,
  stepBackBackpropStage,
  completeBackpropCycle,
  computeFullPassAndGradients,
  createInitialBackpropState,
} from '../../utils/neuralEngine';
import GraphNotesModal from '../visualization/GraphNotesModal';

const HIDDEN_ACTIVATIONS = [
  { id: 'sigmoid', label: 'Sigmoid' },
  { id: 'tanh', label: 'Tanh' },
  { id: 'relu', label: 'ReLU' },
];

const STAGE_PEDAGOGY = {
  input_layer: {
    what: 'Input layer receives input features x = [x₁, x₂] and ground-truth target label y.',
    why: 'Neural networks learn by mapping input features to expected target values.',
    formula: 'x = [x₁, x₂],   y = target',
    meaning: 'Input values represent the raw feature coordinates of the training example.',
  },
  weighted_sum: {
    what: 'Each hidden neuron computes a linear combination of all inputs multiplied by incoming weights plus bias.',
    why: 'Weights represent synaptic strength; biases shift the decision boundary independently of input values.',
    formula: 'z_{hi} = Σ (w_{ij} · x_j) + b_i',
    meaning: 'Linear pre-activation scores z before non-linear squashing.',
  },
  activation_function: {
    what: 'Linear sums z_{h1}, z_{h2} are passed through a non-linear activation function φ(z).',
    why: 'Without non-linearity, stacking multiple neural layers mathematically collapses into a single linear model.',
    formula: 'h_i = φ(z_{hi})   (e.g. Sigmoid, Tanh, or ReLU)',
    meaning: 'Hidden activations h represent learned intermediate feature representations.',
  },
  forward_propagation: {
    what: 'Hidden neuron activations h₁, h₂ propagate forward to the output neuron via weights v₁, v₂ and bias b_out.',
    why: 'The output neuron integrates high-level hidden representations to compute the pre-activation score z_out.',
    formula: 'z_{out} = v₁·h₁ + v₂·h₂ + b_{out}',
    meaning: 'Aggregated signal ready for the final output activation.',
  },
  prediction: {
    what: 'Output neuron produces the final model prediction ŷ by squashing z_out into a valid probability range.',
    why: 'Sigmoid maps real values into (0, 1), representing P(y=1|x).',
    formula: 'ŷ = σ(z_{out}) = 1 / (1 + e^{-z_{out}})',
    meaning: 'Model\'s current estimated probability for the input pattern.',
  },
  loss_calculation: {
    what: 'Measures the difference (error) between prediction ŷ and true target y using Mean Squared Error loss.',
    why: 'Provides a single scalar objective function L that quantifies how wrong the current network parameters are.',
    formula: 'L = ½ · (ŷ - y)²,   error = (ŷ - y)',
    meaning: 'A lower loss indicates predictions closer to the ground truth.',
  },
  backward_propagation: {
    what: 'Computes the derivative of loss with respect to output pre-activation z_out using the chain rule.',
    why: 'Determines how sensitively the total error L responds to changes in the output neuron\'s input.',
    formula: '∂L/∂z_{out} = (∂L/∂ŷ) · σ\'(z_{out}) = (ŷ - y) · ŷ(1 - ŷ)',
    meaning: 'Error gradient δ_out at the final layer, signaling whether to increase or decrease output excitation.',
  },
  gradient_calculation: {
    what: 'Applies the calculus chain rule backward through hidden neurons to compute ∂L/∂w for every single weight and bias.',
    why: 'Each weight contributed proportionally to the final mistake; gradients tell us the exact direction of steepest loss ascent.',
    formula: '∂L/∂w_{ij} = (∂L/∂z_i) · x_j,   ∂L/∂v_k = (∂L/∂z_{out}) · h_k',
    meaning: 'Identifies which weights need large adjustments versus small fine-tuning.',
  },
  weight_update: {
    what: 'Applies Gradient Descent to update every parameter opposite to its gradient vector scaled by learning rate η.',
    why: 'Stepping in the negative gradient direction (-η · ∇L) guarantees a decrease in loss for sufficiently small η.',
    formula: 'w_{new} = w_{old} - η · (∂L/∂w),   b_{new} = b_{old} - η · (∂L/∂b)',
    meaning: 'The network parameters physically adjust to make fewer mistakes on this pattern in the future.',
  },
  new_prediction: {
    what: 'Performs a forward pass using the newly updated weights to observe improved prediction ŷ_new and lower loss.',
    why: 'Demonstrates immediate empirical proof that gradient descent reduces training error.',
    formula: 'ŷ_{new} = σ(v_{new} · h_{new} + b_{new}),   L_{new} < L_{old}',
    meaning: 'Verification of learning: error has successfully decreased!',
  },
};

export default function BackpropStepper() {
  const [config, setConfig] = useState(DEFAULT_NETWORK_CONFIG);
  const [bpState, setBpState] = useState(() => createInitialBackpropState(DEFAULT_NETWORK_CONFIG));
  const [autoTrain, setAutoTrain] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [showWeightsEditor, setShowWeightsEditor] = useState(false);

  const stage = BACKPROP_STAGES[bpState.stageIndex] || BACKPROP_STAGES[0];
  const { snapshot, weights, previousWeights, lossHistory, stageIndex, cycle } = bpState;

  // Visibility flags based on 10-step sequence
  const isInputVisible = stageIndex >= 0;
  const isSumVisible = stageIndex >= 1;
  const isHiddenActVisible = stageIndex >= 2;
  const isPredictionVisible = stageIndex >= 4;
  const isLossVisible = stageIndex >= 5;
  const isBackwardOutVisible = stageIndex >= 6;
  const isBackwardHiddenVisible = stageIndex >= 7;
  const isUpdateVisible = stageIndex >= 8;

  // Auto-Train loop executing complete cycles safely
  useEffect(() => {
    if (!autoTrain) return undefined;

    const timer = setInterval(() => {
      setBpState((prev) => completeBackpropCycle(prev, config));
    }, 450);

    return () => clearInterval(timer);
  }, [autoTrain, config]);

  const handleConfigChange = (patch) => {
    const nextConfig = { ...config, ...patch };
    setConfig(nextConfig);

    setBpState((prev) => {
      return {
        ...prev,
        snapshot: computeFullPassAndGradients(prev.weights, nextConfig),
      };
    });
  };

  // Direct weight customization by user
  const handleWeightCustomChange = (layer, indices, val) => {
    const nextWeights = JSON.parse(JSON.stringify(weights));
    if (layer === 'w1') nextWeights.w1[indices[0]][indices[1]] = val;
    else if (layer === 'b1') nextWeights.b1[indices[0]] = val;
    else if (layer === 'w2') nextWeights.w2[indices[0]] = val;
    else if (layer === 'b2') nextWeights.b2 = val;

    setBpState((prev) => ({
      ...prev,
      weights: nextWeights,
      previousWeights: null,
      snapshot: computeFullPassAndGradients(nextWeights, config),
    }));
  };

  const handleReset = () => {
    setAutoTrain(false);
    setConfig(DEFAULT_NETWORK_CONFIG);
    setBpState(createInitialBackpropState(DEFAULT_NETWORK_CONFIG));
  };

  const displayWeights = isUpdateVisible && previousWeights ? previousWeights : weights;

  // Loss Curve SVG coordinates
  const lossW = 680;
  const lossH = 165;
  const lPad = { l: 44, r: 20, t: 18, b: 28 };
  const maxLoss = Math.max(0.25, ...lossHistory.map((pt) => pt.loss)) * 1.12;
  const maxStep = Math.max(4, lossHistory.length - 1);
  const mapLossX = (step) =>
    lPad.l + (step / maxStep) * (lossW - lPad.l - lPad.r);
  const mapLossY = (lossVal) =>
    lossH - lPad.b - (lossVal / maxLoss) * (lossH - lPad.t - lPad.b);

  const lossPath = lossHistory
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${mapLossX(pt.step).toFixed(1)} ${mapLossY(pt.loss).toFixed(1)}`)
    .join(' ');

  const latestLoss = lossHistory[lossHistory.length - 1];

  // Stage-specific chain-rule equations
  const stageEquations = () => {
    const { forwardHidden, prediction, lossInfo, backwardOutput, backwardHidden } = snapshot;

    switch (stage.id) {
      case 'input_layer':
        return [
          `Inputs loaded: x₁ = ${config.x1.toFixed(2)},   x₂ = ${config.x2.toFixed(2)}`,
          `Target ground truth label: y = ${config.target.toFixed(2)}`,
        ];
      case 'weighted_sum':
        return [
          `z_h1 = (${displayWeights.w1[0][0].toFixed(2)})(${config.x1.toFixed(2)}) + (${displayWeights.w1[0][1].toFixed(2)})(${config.x2.toFixed(2)}) + (${displayWeights.b1[0].toFixed(2)}) = ${forwardHidden.z_h1.toFixed(3)}`,
          `z_h2 = (${displayWeights.w1[1][0].toFixed(2)})(${config.x1.toFixed(2)}) + (${displayWeights.w1[1][1].toFixed(2)})(${config.x2.toFixed(2)}) + (${displayWeights.b1[1].toFixed(2)}) = ${forwardHidden.z_h2.toFixed(3)}`,
        ];
      case 'activation_function':
        return [
          `h₁ = ${config.hiddenActivation}(${forwardHidden.z_h1.toFixed(3)}) = ${forwardHidden.h1.toFixed(3)}   (φ'(z_h1) = ${forwardHidden.dh1_dz.toFixed(4)})`,
          `h₂ = ${config.hiddenActivation}(${forwardHidden.z_h2.toFixed(3)}) = ${forwardHidden.h2.toFixed(3)}   (φ'(z_h2) = ${forwardHidden.dh2_dz.toFixed(4)})`,
        ];
      case 'forward_propagation':
        return [
          `z_out = (${displayWeights.w2[0].toFixed(2)})(${forwardHidden.h1.toFixed(3)}) + (${displayWeights.w2[1].toFixed(2)})(${forwardHidden.h2.toFixed(3)}) + (${displayWeights.b2.toFixed(2)}) = ${prediction.z_out.toFixed(3)}`,
        ];
      case 'prediction':
        return [
          `ŷ = σ(z_out) = 1 / (1 + e^(-${prediction.z_out.toFixed(3)})) = ${prediction.yHat.toFixed(4)}`,
          `Output Derivative σ'(z_out) = ŷ · (1 - ŷ) = ${prediction.dy_dz.toFixed(4)}`,
        ];
      case 'loss_calculation':
        return [
          `error = ŷ - y = ${prediction.yHat.toFixed(4)} - ${config.target.toFixed(2)} = ${lossInfo.error.toFixed(4)}`,
          `L = ½ · (ŷ - y)² = 0.5 × (${lossInfo.error.toFixed(4)})² = ${lossInfo.loss.toFixed(5)}`,
        ];
      case 'backward_propagation':
        return [
          `∂L/∂ŷ = ŷ - y = ${backwardOutput.dL_dyHat.toFixed(4)}`,
          `δ_out = ∂L/∂z_out = (∂L/∂ŷ) · σ'(z_out) = (${backwardOutput.dL_dyHat.toFixed(4)}) × (${prediction.dy_dz.toFixed(4)}) = ${backwardOutput.dL_dzOut.toFixed(4)}`,
        ];
      case 'gradient_calculation':
        return [
          `∂L/∂v₁ = δ_out · h₁ = (${backwardOutput.dL_dzOut.toFixed(4)})(${forwardHidden.h1.toFixed(3)}) = ${backwardOutput.dL_dw2[0].toFixed(4)}`,
          `∂L/∂v₂ = δ_out · h₂ = (${backwardOutput.dL_dzOut.toFixed(4)})(${forwardHidden.h2.toFixed(3)}) = ${backwardOutput.dL_dw2[1].toFixed(4)}`,
          `∂L/∂w₁₁ = δ_h1 · x₁ = ${backwardHidden.dL_dw1[0][0].toFixed(4)},   ∂L/∂w₁₂ = ${backwardHidden.dL_dw1[0][1].toFixed(4)},   ∂L/∂w₂₁ = ${backwardHidden.dL_dw1[1][0].toFixed(4)},   ∂L/∂w₂₂ = ${backwardHidden.dL_dw1[1][1].toFixed(4)}`,
        ];
      case 'weight_update':
        return [
          `Applied Learning Rate η = ${config.learningRate.toFixed(2)}:   w_new = w_old - η · (∂L/∂w)`,
          `v: [${displayWeights.w2[0].toFixed(3)}, ${displayWeights.w2[1].toFixed(3)}] → [${weights.w2[0].toFixed(3)}, ${weights.w2[1].toFixed(3)}]`,
        ];
      case 'new_prediction':
      default:
        return [
          `Forward pass with updated weights completed!`,
          `Previous Loss: ${lossHistory[Math.max(0, lossHistory.length - 2)]?.loss.toFixed(5) || '—'}  →  New Loss: ${latestLoss.loss.toFixed(5)}`,
          `Predicted Output: ŷ = ${latestLoss.yHat.toFixed(4)} (Target: ${config.target.toFixed(2)})`,
        ];
    }
  };

  const pedagogy = STAGE_PEDAGOGY[stage.id] || STAGE_PEDAGOGY.input_layer;

  // Network Diagram Coordinates
  const pos = {
    x1: { x: 85, y: 95 },
    x2: { x: 85, y: 225 },
    h1: { x: 310, y: 95 },
    h2: { x: 310, y: 225 },
    out: { x: 545, y: 160 },
    loss: { x: 705, y: 160 },
  };

  const edgeColor = (layer) => {
    if (stage.id === 'weight_update' || stage.id === 'new_prediction') return '#10b981';
    if (layer === 'hidden' && (stage.id === 'weighted_sum' || stage.id === 'activation_function')) return '#06b6d4';
    if (layer === 'out' && (stage.id === 'forward_propagation' || stage.id === 'prediction')) return '#06b6d4';
    if (layer === 'out' && (stage.id === 'backward_propagation' || stage.id === 'gradient_calculation')) return '#ec4899';
    if (layer === 'hidden' && stage.id === 'gradient_calculation') return '#ec4899';
    if (layer === 'loss' && (stage.id === 'loss_calculation' || stage.id === 'backward_propagation')) {
      return stage.id === 'loss_calculation' ? '#f59e0b' : '#ec4899';
    }
    return 'rgba(148, 163, 184, 0.32)';
  };

  const w1Edges = [
    { from: pos.x1, to: pos.h1, w: displayWeights.w1[0][0], g: snapshot.backwardHidden.dL_dw1[0][0], label: 'w₁₁', ly: -10 },
    { from: pos.x2, to: pos.h1, w: displayWeights.w1[0][1], g: snapshot.backwardHidden.dL_dw1[0][1], label: 'w₁₂', ly: -8 },
    { from: pos.x1, to: pos.h2, w: displayWeights.w1[1][0], g: snapshot.backwardHidden.dL_dw1[1][0], label: 'w₂₁', ly: 14 },
    { from: pos.x2, to: pos.h2, w: displayWeights.w1[1][1], g: snapshot.backwardHidden.dL_dw1[1][1], label: 'w₂₂', ly: 14 },
  ];

  const w2Edges = [
    { from: pos.h1, to: pos.out, w: displayWeights.w2[0], g: snapshot.backwardOutput.dL_dw2[0], label: 'v₁', ly: -12 },
    { from: pos.h2, to: pos.out, w: displayWeights.w2[1], g: snapshot.backwardOutput.dL_dw2[1], label: 'v₂', ly: 16 },
  ];

  return (
    <div className="im-module">
      {/* 10-Stage Granular Stepper Bar */}
      <div className="im-stage-strip">
        {BACKPROP_STAGES.map((s, idx) => (
          <div
            key={s.id}
            className={`im-stage-pill ${
              idx === stageIndex
                ? `im-stage-pill--active im-stage-pill--${s.phase}`
                : idx < stageIndex
                ? 'im-stage-pill--done'
                : ''
            }`}
            onClick={() => setBpState((prev) => ({ ...prev, stageIndex: idx }))}
            title={s.label}
          >
            {s.shortName || s.label}
          </div>
        ))}
      </div>

      {/* Action Toolbar */}
      <div className="im-toolbar">
        <div className="im-preset-group">
          {/* Previous Step */}
          <button
            type="button"
            className="im-chip-btn"
            disabled={autoTrain || stageIndex === 0}
            onClick={() => setBpState((prev) => stepBackBackpropStage(prev, config))}
          >
            <ChevronLeft size={14} /> Prev Step
          </button>

          {/* Next Step */}
          <button
            type="button"
            className="im-chip-btn im-chip-btn--primary"
            disabled={autoTrain}
            onClick={() => setBpState((prev) => advanceBackpropStage(prev, config))}
          >
            <ChevronRight size={14} /> Next Step
          </button>

          {/* Complete Cycle */}
          <button
            type="button"
            className="im-chip-btn"
            disabled={autoTrain}
            onClick={() => setBpState((prev) => completeBackpropCycle(prev, config))}
          >
            <FastForward size={14} /> Complete Cycle
          </button>

          {/* Auto Train Toggle */}
          <button
            type="button"
            className={`im-chip-btn ${autoTrain ? 'im-chip-btn--active' : ''}`}
            onClick={() => setAutoTrain((prev) => !prev)}
          >
            {autoTrain ? <Pause size={14} /> : <Play size={14} />}
            {autoTrain ? 'Pause' : 'Auto Play'}
          </button>

          {/* Reset */}
          <button
            type="button"
            className="im-chip-btn im-chip-btn--reset"
            onClick={handleReset}
          >
            <RotateCcw size={13} /> Reset
          </button>

          {/* Graph Notes Button */}
          <button
            type="button"
            className="im-chip-btn im-chip-btn--notes"
            onClick={() => setIsNotesOpen(true)}
            style={{ background: 'rgba(250, 204, 21, 0.1)', borderColor: 'rgba(250, 204, 21, 0.3)', color: '#FACC15' }}
          >
            <HelpCircle size={14} /> Graph Notes / Explain
          </button>

          {/* Custom Weights Toggle */}
          <button
            type="button"
            className={`im-chip-btn ${showWeightsEditor ? 'im-chip-btn--active' : ''}`}
            onClick={() => setShowWeightsEditor((s) => !s)}
          >
            <Sliders size={14} /> Weights &amp; Biases
          </button>
        </div>

        <div className="im-preset-group">
          <span className="im-group-label">Hidden φ:</span>
          {HIDDEN_ACTIVATIONS.map((act) => (
            <button
              key={act.id}
              type="button"
              className={`im-chip-btn ${config.hiddenActivation === act.id ? 'im-chip-btn--active' : ''}`}
              onClick={() => handleConfigChange({ hiddenActivation: act.id })}
            >
              {act.label}
            </button>
          ))}
          <span className="im-cycle-badge">
            Cycle {cycle} · Updates {lossHistory.length - 1}
          </span>
        </div>
      </div>

      {/* Collapsible Direct Weights & Biases Customizer */}
      {showWeightsEditor && (
        <div className="im-weights-editor fade-in" style={{ padding: '14px', background: 'rgba(5, 8, 20, 0.7)', border: '1px solid rgba(22, 75, 255, 0.3)', borderRadius: '10px', marginBottom: '14px' }}>
          <h4 style={{ fontSize: '0.85rem', color: '#65CFFF', margin: '0 0 10px 0' }}>Tune Network Synaptic Weights &amp; Biases Directly</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>w₁₁: {weights.w1[0][0].toFixed(2)}</label>
              <input type="range" min="-2" max="2" step="0.05" value={weights.w1[0][0]} onChange={(e) => handleWeightCustomChange('w1', [0, 0], parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>w₁₂: {weights.w1[0][1].toFixed(2)}</label>
              <input type="range" min="-2" max="2" step="0.05" value={weights.w1[0][1]} onChange={(e) => handleWeightCustomChange('w1', [0, 1], parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>w₂₁: {weights.w1[1][0].toFixed(2)}</label>
              <input type="range" min="-2" max="2" step="0.05" value={weights.w1[1][0]} onChange={(e) => handleWeightCustomChange('w1', [1, 0], parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>w₂₂: {weights.w1[1][1].toFixed(2)}</label>
              <input type="range" min="-2" max="2" step="0.05" value={weights.w1[1][1]} onChange={(e) => handleWeightCustomChange('w1', [1, 1], parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>v₁: {weights.w2[0].toFixed(2)}</label>
              <input type="range" min="-2" max="2" step="0.05" value={weights.w2[0]} onChange={(e) => handleWeightCustomChange('w2', [0], parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>v₂: {weights.w2[1].toFixed(2)}</label>
              <input type="range" min="-2" max="2" step="0.05" value={weights.w2[1]} onChange={(e) => handleWeightCustomChange('w2', [1], parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>b_out: {weights.b2.toFixed(2)}</label>
              <input type="range" min="-1" max="1" step="0.05" value={weights.b2} onChange={(e) => handleWeightCustomChange('b2', [], parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* 4 Pedagogical Explanation Questions Box */}
      <div className="im-pedagogy-card" style={{ background: 'rgba(5, 8, 20, 0.65)', border: '1px solid rgba(22, 75, 255, 0.25)', borderRadius: '10px', padding: '14px 18px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={16} style={{ color: '#FACC15' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            Step {stageIndex + 1} of 10: {stage.label}
          </h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', fontSize: '0.82rem' }}>
          <div>
            <strong style={{ color: '#65CFFF' }}>What is happening?</strong>
            <p style={{ margin: '2px 0 0', color: '#cbd5e1' }}>{pedagogy.what}</p>
          </div>
          <div>
            <strong style={{ color: '#FACC15' }}>Why is it happening?</strong>
            <p style={{ margin: '2px 0 0', color: '#cbd5e1' }}>{pedagogy.why}</p>
          </div>
          <div>
            <strong style={{ color: '#A78BFA' }}>Mathematical formula:</strong>
            <p style={{ margin: '2px 0 0', color: '#f1f5f9', fontFamily: 'monospace' }}>{pedagogy.formula}</p>
          </div>
          <div>
            <strong style={{ color: '#10B981' }}>What it means:</strong>
            <p style={{ margin: '2px 0 0', color: '#cbd5e1' }}>{pedagogy.meaning}</p>
          </div>
        </div>
      </div>

      {/* Interactive 2 -> 2 -> 1 Backprop Network SVG */}
      <div className="im-svg-frame">
        <svg viewBox="0 0 780 320" className="im-svg">
          {/* Input -> Hidden edges */}
          {w1Edges.map((edge, idx) => {
            const activeCol = edgeColor('hidden');
            const isHighlighted =
              stage.id === 'weighted_sum' ||
              stage.id === 'gradient_calculation' ||
              stage.id === 'weight_update';
            const mx = edge.from.x + (edge.to.x - edge.from.x) * (idx === 1 || idx === 2 ? 0.36 : 0.5);
            const my = edge.from.y + (edge.to.y - edge.from.y) * (idx === 1 || idx === 2 ? 0.36 : 0.5);

            return (
              <g key={edge.label}>
                <line
                  x1={edge.from.x + 28}
                  y1={edge.from.y}
                  x2={edge.to.x - 32}
                  y2={edge.to.y}
                  stroke={activeCol}
                  strokeWidth={isHighlighted ? 2.6 : 1.4}
                />
                <text
                  x={mx}
                  y={my + edge.ly}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill={isHighlighted ? activeCol : '#94a3b8'}
                >
                  {edge.label}={edge.w.toFixed(2)}
                  {isBackwardHiddenVisible ? ` (∇${edge.g.toFixed(2)})` : ''}
                </text>
              </g>
            );
          })}

          {/* Hidden -> Output edges */}
          {w2Edges.map((edge) => {
            const activeCol = edgeColor('out');
            const isHighlighted =
              stage.id === 'forward_propagation' ||
              stage.id === 'prediction' ||
              stage.id === 'backward_propagation' ||
              stage.id === 'weight_update';
            const mx = (edge.from.x + edge.to.x) / 2;
            const my = (edge.from.y + edge.to.y) / 2;

            return (
              <g key={edge.label}>
                <line
                  x1={edge.from.x + 32}
                  y1={edge.from.y}
                  x2={edge.to.x - 34}
                  y2={edge.to.y}
                  stroke={activeCol}
                  strokeWidth={isHighlighted ? 2.8 : 1.5}
                />
                <text
                  x={mx}
                  y={my + edge.ly}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="600"
                  fill={isHighlighted ? activeCol : '#94a3b8'}
                >
                  {edge.label}={edge.w.toFixed(2)}
                  {isBackwardOutVisible ? ` (∇${edge.g.toFixed(2)})` : ''}
                </text>
              </g>
            );
          })}

          {/* Output -> Loss edge */}
          <line
            x1={pos.out.x + 34}
            y1={pos.out.y}
            x2={pos.loss.x - 36}
            y2={pos.loss.y}
            stroke={edgeColor('loss')}
            strokeWidth={stage.id === 'loss_calculation' || stage.id === 'backward_propagation' ? 2.8 : 1.5}
          />

          {/* Input Nodes */}
          <g transform={`translate(${pos.x1.x}, ${pos.x1.y})`}>
            <circle r="28" fill="#111827" stroke={isInputVisible ? '#06b6d4' : '#334155'} strokeWidth="2" />
            <text y="-4" textAnchor="middle" fontSize="10.5" fill="#94a3b8">
              x₁
            </text>
            <text y="12" textAnchor="middle" fontSize="12" fontWeight="700" fill="#e2e8f0">
              {config.x1.toFixed(2)}
            </text>
          </g>
          <g transform={`translate(${pos.x2.x}, ${pos.x2.y})`}>
            <circle r="28" fill="#111827" stroke={isInputVisible ? '#06b6d4' : '#334155'} strokeWidth="2" />
            <text y="-4" textAnchor="middle" fontSize="10.5" fill="#94a3b8">
              x₂
            </text>
            <text y="12" textAnchor="middle" fontSize="12" fontWeight="700" fill="#e2e8f0">
              {config.x2.toFixed(2)}
            </text>
          </g>

          {/* Hidden Nodes */}
          {[
            {
              key: 'h1',
              p: pos.h1,
              label: 'h₁',
              val: snapshot.forwardHidden.h1,
              z: snapshot.forwardHidden.z_h1,
              grad: snapshot.backwardHidden.dL_dzH[0],
            },
            {
              key: 'h2',
              p: pos.h2,
              label: 'h₂',
              val: snapshot.forwardHidden.h2,
              z: snapshot.forwardHidden.z_h2,
              grad: snapshot.backwardHidden.dL_dzH[1],
            },
          ].map((hn) => {
            const stroke =
              stage.id === 'weighted_sum' || stage.id === 'activation_function'
                ? '#06b6d4'
                : stage.id === 'gradient_calculation'
                ? '#ec4899'
                : stage.id === 'weight_update' || stage.id === 'new_prediction'
                ? '#10b981'
                : '#3b82f6';
            return (
              <g key={hn.key} transform={`translate(${hn.p.x}, ${hn.p.y})`}>
                <circle r="32" fill="#111827" stroke={stroke} strokeWidth="2.4" />
                <text y="-9" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#94a3b8">
                  {hn.label} (z={isSumVisible ? hn.z.toFixed(2) : '—'})
                </text>
                <text y="7" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#e2e8f0">
                  {isHiddenActVisible ? hn.val.toFixed(3) : '—'}
                </text>
                {isBackwardHiddenVisible && (
                  <text y="21" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#f472b6">
                    δ={hn.grad.toFixed(3)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Output Node */}
          <g transform={`translate(${pos.out.x}, ${pos.out.y})`}>
            <circle
              r="34"
              fill="#111827"
              stroke={
                stage.id === 'forward_propagation' || stage.id === 'prediction'
                  ? '#06b6d4'
                  : stage.id === 'backward_propagation'
                  ? '#ec4899'
                  : stage.id === 'weight_update' || stage.id === 'new_prediction'
                  ? '#10b981'
                  : '#8b5cf6'
              }
              strokeWidth="2.6"
            />
            <text y="-10" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#c4b5fd">
              Output ŷ
            </text>
            <text y="7" textAnchor="middle" fontSize="13" fontWeight="800" fill="#e2e8f0">
              {isPredictionVisible ? snapshot.prediction.yHat.toFixed(3) : '—'}
            </text>
            {isBackwardOutVisible && (
              <text y="22" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#f472b6">
                δ={snapshot.backwardOutput.dL_dzOut.toFixed(3)}
              </text>
            )}
          </g>

          {/* Loss Box */}
          <g transform={`translate(${pos.loss.x}, ${pos.loss.y})`}>
            <rect
              x="-38"
              y="-34"
              width="76"
              height="68"
              rx="12"
              fill="#111827"
              stroke={isLossVisible ? '#f59e0b' : '#334155'}
              strokeWidth="2.2"
            />
            <text y="-12" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fde68a">
              Loss (y={config.target.toFixed(2)})
            </text>
            <text y="7" textAnchor="middle" fontSize="13" fontWeight="800" fill="#f59e0b">
              {isLossVisible ? snapshot.lossInfo.loss.toFixed(4) : '—'}
            </text>
            {isLossVisible && (
              <text y="22" textAnchor="middle" fontSize="9.5" fill="#94a3b8">
                err={snapshot.lossInfo.error.toFixed(3)}
              </text>
            )}
          </g>
        </svg>
      </div>

      {/* Live Chain-Rule Equations for Active Stage */}
      <div className="im-equations-panel">
        <div className="im-equations-panel__title">Active Stage Math — {stage.label}</div>
        {stageEquations().map((eq, idx) => (
          <code key={idx} className="im-equation-line">
            {eq}
          </code>
        ))}
      </div>

      {/* Parameter Sliders + Live Loss History */}
      <div className="im-sliders-grid">
        <div className="im-panel-box">
          <h3 className="im-box-title">Training Inputs &amp; Hyperparameters</h3>
          <div className="im-slider-stack">
            <div className="im-slider-group">
              <div className="im-slider-header">
                <span>Input x₁</span>
                <strong>{config.x1.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="-1"
                max="1.5"
                step="0.05"
                value={config.x1}
                onChange={(e) => handleConfigChange({ x1: parseFloat(e.target.value) })}
              />
            </div>

            <div className="im-slider-group">
              <div className="im-slider-header">
                <span>Input x₂</span>
                <strong>{config.x2.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="-1"
                max="1.5"
                step="0.05"
                value={config.x2}
                onChange={(e) => handleConfigChange({ x2: parseFloat(e.target.value) })}
              />
            </div>

            <div className="im-slider-group">
              <div className="im-slider-header">
                <span>Target y</span>
                <strong>{config.target.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={config.target}
                onChange={(e) => handleConfigChange({ target: parseFloat(e.target.value) })}
              />
            </div>

            <div className="im-slider-group">
              <div className="im-slider-header">
                <span>Learning Rate (η)</span>
                <strong>{config.learningRate.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="0.05"
                max="2.0"
                step="0.05"
                value={config.learningRate}
                onChange={(e) => handleConfigChange({ learningRate: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="im-panel-box">
          <div className="im-loss-head">
            <h3 className="im-box-title">Loss Trajectory (L = ½(ŷ − y)²)</h3>
            <span className="im-loss-val">Current L = {latestLoss.loss.toFixed(5)}</span>
          </div>
          <div className="im-svg-frame im-svg-frame--compact">
            <svg viewBox={`0 0 ${lossW} ${lossH}`} className="im-svg">
              <line
                x1={lPad.l}
                y1={lossH - lPad.b}
                x2={lossW - lPad.r}
                y2={lossH - lPad.b}
                stroke="#334155"
                strokeWidth="1.2"
              />
              <line
                x1={lPad.l}
                y1={lPad.t}
                x2={lPad.l}
                y2={lossH - lPad.b}
                stroke="#334155"
                strokeWidth="1.2"
              />
              <path d={lossPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
              {lossHistory.map((pt) => (
                <circle
                  key={pt.step}
                  cx={mapLossX(pt.step)}
                  cy={mapLossY(pt.loss)}
                  r={pt.step === latestLoss.step ? 4.5 : 3}
                  fill={pt.step === latestLoss.step ? '#06b6d4' : '#10b981'}
                />
              ))}
              <text x={lPad.l + 6} y={lPad.t + 10} className="im-axis-label">
                {maxLoss.toFixed(2)}
              </text>
              <text x={lPad.l + 6} y={lossH - lPad.b - 6} className="im-axis-label">
                0.00
              </text>
              <text x={lossW - lPad.r} y={lossH - 8} textAnchor="end" className="im-axis-label">
                Updates: {lossHistory.length - 1}
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Graph Notes Modal for Backprop */}
      <GraphNotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        topicKey="backpropagation"
      />
    </div>
  );
}
