import { useEffect, useState } from 'react';
import { FastForward, Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import {
  BACKPROP_STAGES,
  DEFAULT_NETWORK_CONFIG,
  advanceBackpropStage,
  completeBackpropCycle,
  computeFullPassAndGradients,
  createInitialBackpropState,
} from '../../utils/neuralEngine';

const HIDDEN_ACTIVATIONS = [
  { id: 'sigmoid', label: 'Sigmoid' },
  { id: 'tanh', label: 'Tanh' },
  { id: 'relu', label: 'ReLU' },
];

export default function BackpropStepper() {
  const [config, setConfig] = useState(DEFAULT_NETWORK_CONFIG);
  const [bpState, setBpState] = useState(() => createInitialBackpropState(DEFAULT_NETWORK_CONFIG));
  const [autoTrain, setAutoTrain] = useState(false);

  const stage = BACKPROP_STAGES[bpState.stageIndex];
  const { snapshot, weights, previousWeights, lossHistory, stageIndex, cycle } = bpState;

  const isForwardHiddenVisible = stageIndex >= 0;
  const isPredictionVisible = stageIndex >= 1;
  const isLossVisible = stageIndex >= 2;
  const isBackwardOutVisible = stageIndex >= 3;
  const isBackwardHiddenVisible = stageIndex >= 4;
  const isUpdateVisible = stageIndex === 5;

  // Auto-Train loop executing complete cycles safely with interval cleanup
  useEffect(() => {
    if (!autoTrain) return undefined;

    const timer = setInterval(() => {
      setBpState((prev) => completeBackpropCycle(prev, config));
    }, 360);

    return () => clearInterval(timer);
  }, [autoTrain, config]);

  const handleConfigChange = (patch) => {
    const nextConfig = { ...config, ...patch };
    setConfig(nextConfig);

    // Recompute current forward/backward snapshot for new inputs/LR without mutating learned weights
    setBpState((prev) => {
      const nextStageIndex = prev.stageIndex === 5 ? 0 : prev.stageIndex;
      return {
        ...prev,
        stageIndex: nextStageIndex,
        previousWeights: prev.stageIndex === 5 ? null : prev.previousWeights,
        snapshot: computeFullPassAndGradients(prev.weights, nextConfig),
      };
    });
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

    if (stage.id === 'forward_hidden') {
      return [
        `z_h1 = (${displayWeights.w1[0][0].toFixed(2)})(${config.x1.toFixed(2)}) + (${displayWeights.w1[0][1].toFixed(2)})(${config.x2.toFixed(2)}) + (${displayWeights.b1[0].toFixed(2)}) = ${forwardHidden.z_h1.toFixed(3)}  →  h₁ = ${forwardHidden.h1.toFixed(3)}`,
        `z_h2 = (${displayWeights.w1[1][0].toFixed(2)})(${config.x1.toFixed(2)}) + (${displayWeights.w1[1][1].toFixed(2)})(${config.x2.toFixed(2)}) + (${displayWeights.b1[1].toFixed(2)}) = ${forwardHidden.z_h2.toFixed(3)}  →  h₂ = ${forwardHidden.h2.toFixed(3)}`,
      ];
    }
    if (stage.id === 'prediction') {
      return [
        `z_out = (${displayWeights.w2[0].toFixed(2)})(${forwardHidden.h1.toFixed(3)}) + (${displayWeights.w2[1].toFixed(2)})(${forwardHidden.h2.toFixed(3)}) + (${displayWeights.b2.toFixed(2)}) = ${prediction.z_out.toFixed(3)}`,
        `ŷ = σ(z_out) = ${prediction.yHat.toFixed(4)}   (σ'(z_out) = ${prediction.dy_dz.toFixed(4)})`,
      ];
    }
    if (stage.id === 'loss') {
      return [
        `error = ŷ - y = ${prediction.yHat.toFixed(4)} - ${config.target.toFixed(2)} = ${lossInfo.error.toFixed(4)}`,
        `L = ½ · (ŷ - y)² = 0.5 × (${lossInfo.error.toFixed(4)})² = ${lossInfo.loss.toFixed(5)}`,
      ];
    }
    if (stage.id === 'backward_output') {
      return [
        `∂L/∂ŷ = ŷ - y = ${backwardOutput.dL_dyHat.toFixed(4)}   →   ∂L/∂z_out = (∂L/∂ŷ)·σ'(z_out) = ${backwardOutput.dL_dzOut.toFixed(4)}`,
        `∂L/∂v₁ = (∂L/∂z_out)·h₁ = ${backwardOutput.dL_dw2[0].toFixed(4)},   ∂L/∂v₂ = (∂L/∂z_out)·h₂ = ${backwardOutput.dL_dw2[1].toFixed(4)},   ∂L/∂b_out = ${backwardOutput.dL_db2.toFixed(4)}`,
      ];
    }
    if (stage.id === 'backward_hidden') {
      return [
        `∂L/∂h₁ = (∂L/∂z_out)·v₁ = ${backwardHidden.dL_dh[0].toFixed(4)}  →  ∂L/∂z_h1 = (∂L/∂h₁)·φ'(z_h1) = ${backwardHidden.dL_dzH[0].toFixed(4)}`,
        `∂L/∂h₂ = (∂L/∂z_out)·v₂ = ${backwardHidden.dL_dh[1].toFixed(4)}  →  ∂L/∂z_h2 = (∂L/∂h₂)·φ'(z_h2) = ${backwardHidden.dL_dzH[1].toFixed(4)}`,
        `∂L/∂w₁₁ = ${backwardHidden.dL_dw1[0][0].toFixed(4)},  ∂L/∂w₁₂ = ${backwardHidden.dL_dw1[0][1].toFixed(4)},  ∂L/∂w₂₁ = ${backwardHidden.dL_dw1[1][0].toFixed(4)},  ∂L/∂w₂₂ = ${backwardHidden.dL_dw1[1][1].toFixed(4)}`,
      ];
    }
    return [
      `Applied η = ${config.learningRate.toFixed(2)}:  w_new = w_old - η · (∂L/∂w)`,
      `v: [${displayWeights.w2[0].toFixed(3)}, ${displayWeights.w2[1].toFixed(3)}] → [${weights.w2[0].toFixed(3)}, ${weights.w2[1].toFixed(3)}]   |   Updated Loss = ${latestLoss.loss.toFixed(5)}`,
    ];
  };

  // Network Diagram Coordinates (2 -> 2 -> 1)
  const pos = {
    x1: { x: 85, y: 95 },
    x2: { x: 85, y: 225 },
    h1: { x: 310, y: 95 },
    h2: { x: 310, y: 225 },
    out: { x: 545, y: 160 },
    loss: { x: 705, y: 160 },
  };

  const edgeColor = (layer) => {
    if (stage.id === 'weight_update') return '#10b981';
    if (layer === 'hidden' && stage.id === 'forward_hidden') return '#06b6d4';
    if (layer === 'out' && stage.id === 'prediction') return '#06b6d4';
    if (layer === 'out' && stage.id === 'backward_output') return '#ec4899';
    if (layer === 'hidden' && stage.id === 'backward_hidden') return '#ec4899';
    if (layer === 'loss' && (stage.id === 'loss' || stage.id === 'backward_output')) {
      return stage.id === 'loss' ? '#f59e0b' : '#ec4899';
    }
    return 'rgba(148, 163, 184, 0.32)';
  };

  const w1Edges = [
    { from: pos.x1, to: pos.h1, w: weights.w1[0][0], g: snapshot.backwardHidden.dL_dw1[0][0], label: 'w₁₁', ly: -10 },
    { from: pos.x2, to: pos.h1, w: weights.w1[0][1], g: snapshot.backwardHidden.dL_dw1[0][1], label: 'w₁₂', ly: -8 },
    { from: pos.x1, to: pos.h2, w: weights.w1[1][0], g: snapshot.backwardHidden.dL_dw1[1][0], label: 'w₂₁', ly: 14 },
    { from: pos.x2, to: pos.h2, w: weights.w1[1][1], g: snapshot.backwardHidden.dL_dw1[1][1], label: 'w₂₂', ly: 14 },
  ];

  const w2Edges = [
    { from: pos.h1, to: pos.out, w: weights.w2[0], g: snapshot.backwardOutput.dL_dw2[0], label: 'v₁', ly: -12 },
    { from: pos.h2, to: pos.out, w: weights.w2[1], g: snapshot.backwardOutput.dL_dw2[1], label: 'v₂', ly: 16 },
  ];

  return (
    <div className="im-module">
      {/* Stage Stepper Bar */}
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
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Action Toolbar */}
      <div className="im-toolbar">
        <div className="im-preset-group">
          <button
            type="button"
            className="im-chip-btn im-chip-btn--primary"
            disabled={autoTrain}
            onClick={() => setBpState((prev) => advanceBackpropStage(prev, config))}
          >
            <StepForward size={14} /> Next Step
          </button>
          <button
            type="button"
            className="im-chip-btn"
            disabled={autoTrain}
            onClick={() => setBpState((prev) => completeBackpropCycle(prev, config))}
          >
            <FastForward size={14} /> Complete Cycle
          </button>
          <button
            type="button"
            className={`im-chip-btn ${autoTrain ? 'im-chip-btn--active' : ''}`}
            onClick={() => setAutoTrain((prev) => !prev)}
          >
            {autoTrain ? <Pause size={14} /> : <Play size={14} />}
            {autoTrain ? 'Pause Auto-Train' : 'Auto-Train'}
          </button>
          <button
            type="button"
            className="im-chip-btn im-chip-btn--reset"
            onClick={handleReset}
          >
            <RotateCcw size={13} /> Reset
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

      {/* Interactive 2 -> 2 -> 1 Backprop Network SVG */}
      <div className="im-svg-frame">
        <svg viewBox="0 0 780 320" className="im-svg">
          {/* Input -> Hidden edges */}
          {w1Edges.map((edge, idx) => {
            const activeCol = edgeColor('hidden');
            const isHighlighted =
              stage.id === 'forward_hidden' ||
              stage.id === 'backward_hidden' ||
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
              stage.id === 'prediction' ||
              stage.id === 'backward_output' ||
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
            strokeWidth={stage.id === 'loss' || stage.id === 'backward_output' ? 2.8 : 1.5}
          />

          {/* Input Nodes */}
          <g transform={`translate(${pos.x1.x}, ${pos.x1.y})`}>
            <circle r="28" fill="#111827" stroke="#06b6d4" strokeWidth="2" />
            <text y="-4" textAnchor="middle" fontSize="10.5" fill="#94a3b8">
              x₁
            </text>
            <text y="12" textAnchor="middle" fontSize="12" fontWeight="700" fill="#e2e8f0">
              {config.x1.toFixed(2)}
            </text>
          </g>
          <g transform={`translate(${pos.x2.x}, ${pos.x2.y})`}>
            <circle r="28" fill="#111827" stroke="#06b6d4" strokeWidth="2" />
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
              stage.id === 'forward_hidden'
                ? '#06b6d4'
                : stage.id === 'backward_hidden'
                ? '#ec4899'
                : stage.id === 'weight_update'
                ? '#10b981'
                : '#3b82f6';
            return (
              <g key={hn.key} transform={`translate(${hn.p.x}, ${hn.p.y})`}>
                <circle r="32" fill="#111827" stroke={stroke} strokeWidth="2.4" />
                <text y="-9" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#94a3b8">
                  {hn.label} (z={hn.z.toFixed(2)})
                </text>
                <text y="7" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#e2e8f0">
                  {isForwardHiddenVisible ? hn.val.toFixed(3) : '—'}
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
                stage.id === 'prediction'
                  ? '#06b6d4'
                  : stage.id === 'backward_output'
                  ? '#ec4899'
                  : stage.id === 'weight_update'
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
    </div>
  );
}
