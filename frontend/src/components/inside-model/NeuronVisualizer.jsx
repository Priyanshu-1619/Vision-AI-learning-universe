import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ACTIVATION_SPECS, computeNeuronForward } from '../../utils/neuralEngine';

const DEFAULT_NEURON = {
  inputs: [1.0, 0.6, -0.4],
  weights: [1.2, 0.8, -1.1],
  bias: 0.1,
  activationId: 'sigmoid',
};

const NEURON_PRESETS = [
  {
    id: 'and',
    label: 'AND Gate',
    inputs: [1.0, 1.0, 0.0],
    weights: [2.5, 2.5, 0.0],
    bias: -3.5,
    activationId: 'sigmoid',
  },
  {
    id: 'or',
    label: 'OR Gate',
    inputs: [1.0, 0.0, 0.0],
    weights: [2.6, 2.6, 0.0],
    bias: -1.2,
    activationId: 'sigmoid',
  },
  {
    id: 'inhibitory',
    label: 'Inhibitory',
    inputs: [1.4, 1.2, 1.5],
    weights: [0.9, 0.7, -2.2],
    bias: 0.2,
    activationId: 'relu',
  },
];

export default function NeuronVisualizer() {
  const [inputs, setInputs] = useState(DEFAULT_NEURON.inputs);
  const [weights, setWeights] = useState(DEFAULT_NEURON.weights);
  const [bias, setBias] = useState(DEFAULT_NEURON.bias);
  const [activationId, setActivationId] = useState(DEFAULT_NEURON.activationId);

  const forward = useMemo(
    () =>
      computeNeuronForward({
        inputs,
        weights,
        bias,
        activationId,
        leakyAlpha: 0.1,
      }),
    [inputs, weights, bias, activationId]
  );

  const applyPreset = (preset) => {
    setInputs([...preset.inputs]);
    setWeights([...preset.weights]);
    setBias(preset.bias);
    setActivationId(preset.activationId);
  };

  const resetAll = () => {
    setInputs([...DEFAULT_NEURON.inputs]);
    setWeights([...DEFAULT_NEURON.weights]);
    setBias(DEFAULT_NEURON.bias);
    setActivationId(DEFAULT_NEURON.activationId);
  };

  const updateInput = (idx, val) => {
    setInputs((prev) => prev.map((v, i) => (i === idx ? val : v)));
  };

  const updateWeight = (idx, val) => {
    setWeights((prev) => prev.map((v, i) => (i === idx ? val : v)));
  };

  const svgW = 760;
  const svgH = 290;
  const inputY = [58, 145, 232];
  const sumPos = { x: 355, y: 145 };
  const actPos = { x: 525, y: 145 };
  const outPos = { x: 680, y: 145 };

  return (
    <div className="im-module">
      <div className="im-toolbar">
        <div className="im-preset-group">
          <span className="im-group-label">Presets:</span>
          {NEURON_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="im-chip-btn"
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="im-preset-group">
          <span className="im-group-label">Activation φ:</span>
          {Object.values(ACTIVATION_SPECS).map((spec) => (
            <button
              key={spec.id}
              type="button"
              className={`im-chip-btn ${activationId === spec.id ? 'im-chip-btn--active' : ''}`}
              onClick={() => setActivationId(spec.id)}
            >
              {spec.name}
            </button>
          ))}
          <button
            type="button"
            className="im-chip-btn im-chip-btn--reset"
            onClick={resetAll}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Interactive SVG Signal Pipeline */}
      <div className="im-svg-frame">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="im-svg">
          {/* Synaptic connections from Inputs to Summation node */}
          {forward.terms.map((term, idx) => {
            const sy = inputY[idx];
            const isPositive = term.product >= 0;
            const strokeColor = isPositive ? '#06b6d4' : '#f59e0b';
            const strokeWidth = Math.min(6, 1.4 + Math.abs(term.weight) * 1.4);
            const midX = (120 + sumPos.x - 36) / 2;
            const midY = (sy + sumPos.y) / 2;

            return (
              <g key={term.index}>
                <line
                  x1={120}
                  y1={sy}
                  x2={sumPos.x - 38}
                  y2={sumPos.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeOpacity="0.72"
                />
                <rect
                  x={midX - 42}
                  y={midY - 12}
                  width="84"
                  height="22"
                  rx="6"
                  fill="#0b1120"
                  stroke={strokeColor}
                  strokeOpacity="0.55"
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="600"
                  fill={strokeColor}
                >
                  w{idx + 1}={term.weight.toFixed(1)} ({term.product >= 0 ? '+' : ''}
                  {term.product.toFixed(2)})
                </text>
              </g>
            );
          })}

          {/* Bias feed into Summation node */}
          <line
            x1={sumPos.x}
            y1={42}
            x2={sumPos.x}
            y2={sumPos.y - 38}
            stroke={bias >= 0 ? '#8b5cf6' : '#ef4444'}
            strokeWidth="2.2"
            strokeDasharray="4 3"
          />
          <rect
            x={sumPos.x - 42}
            y={16}
            width="84"
            height="24"
            rx="6"
            fill="#111827"
            stroke="#8b5cf6"
          />
          <text
            x={sumPos.x}
            y={32}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="#c4b5fd"
          >
            b = {bias >= 0 ? '+' : ''}{bias.toFixed(2)}
          </text>

          {/* Sum -> Activation -> Output links */}
          <line
            x1={sumPos.x + 38}
            y1={sumPos.y}
            x2={actPos.x - 44}
            y2={actPos.y}
            stroke="#3b82f6"
            strokeWidth="2.8"
          />
          <text
            x={(sumPos.x + actPos.x) / 2}
            y={sumPos.y - 12}
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="600"
            fill="#93c5fd"
          >
            z={forward.z.toFixed(2)}
          </text>

          <line
            x1={actPos.x + 44}
            y1={actPos.y}
            x2={outPos.x - 34}
            y2={outPos.y}
            stroke="#10b981"
            strokeWidth="2.8"
          />

          {/* Input Nodes */}
          {forward.terms.map((term, idx) => (
            <g key={`in-${term.index}`} transform={`translate(82, ${inputY[idx]})`}>
              <circle r="30" fill="#111827" stroke="#06b6d4" strokeWidth="2" />
              <text y="-4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#94a3b8">
                x{idx + 1}
              </text>
              <text y="12" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#e2e8f0">
                {term.input.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Summation Node */}
          <g transform={`translate(${sumPos.x}, ${sumPos.y})`}>
            <circle r="38" fill="#111827" stroke="#3b82f6" strokeWidth="2.4" />
            <text y="-5" textAnchor="middle" fontSize="13" fontWeight="700" fill="#93c5fd">
              Σ + b
            </text>
            <text y="14" textAnchor="middle" fontSize="12" fontWeight="700" fill="#e2e8f0">
              {forward.z.toFixed(2)}
            </text>
          </g>

          {/* Activation Box */}
          <g transform={`translate(${actPos.x}, ${actPos.y})`}>
            <rect
              x="-44"
              y="-30"
              width="88"
              height="60"
              rx="12"
              fill="#111827"
              stroke="#8b5cf6"
              strokeWidth="2.2"
            />
            <text y="-4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#c4b5fd">
              {ACTIVATION_SPECS[activationId].name}
            </text>
            <text y="13" textAnchor="middle" fontSize="10.5" fill="#94a3b8">
              φ&apos;={forward.derivative.toFixed(2)}
            </text>
          </g>

          {/* Output Node */}
          <g transform={`translate(${outPos.x}, ${outPos.y})`}>
            <circle r="34" fill="#0f2420" stroke="#10b981" strokeWidth="2.6" />
            <text y="-5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#6ee7b7">
              Output ŷ
            </text>
            <text y="14" textAnchor="middle" fontSize="14" fontWeight="800" fill="#ecfdf5">
              {forward.output.toFixed(3)}
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Sliders */}
      <div className="im-sliders-grid">
        <div className="im-panel-box">
          <h3 className="im-box-title">Input Signals (x₁ – x₃)</h3>
          <div className="im-slider-stack">
            {inputs.map((val, idx) => (
              <div key={idx} className="im-slider-group">
                <div className="im-slider-header">
                  <span>Input x{idx + 1}</span>
                  <strong>{val.toFixed(1)}</strong>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={val}
                  onChange={(e) => updateInput(idx, parseFloat(e.target.value))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="im-panel-box">
          <h3 className="im-box-title">Synaptic Weights &amp; Bias</h3>
          <div className="im-slider-stack">
            {weights.map((val, idx) => (
              <div key={idx} className="im-slider-group">
                <div className="im-slider-header">
                  <span>Weight w{idx + 1}</span>
                  <strong>{val.toFixed(1)}</strong>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.1"
                  value={val}
                  onChange={(e) => updateWeight(idx, parseFloat(e.target.value))}
                />
              </div>
            ))}
            <div className="im-slider-group">
              <div className="im-slider-header">
                <span>Bias b</span>
                <strong>{bias.toFixed(1)}</strong>
              </div>
              <input
                type="range"
                min="-4"
                max="3"
                step="0.1"
                value={bias}
                onChange={(e) => setBias(parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Numeric Equation & Metrics */}
      <div className="im-equation-banner">
        <code>
          z = ({inputs[0].toFixed(1)}×{weights[0].toFixed(1)}) + ({inputs[1].toFixed(1)}×
          {weights[1].toFixed(1)}) + ({inputs[2].toFixed(1)}×{weights[2].toFixed(1)}) + (
          {bias.toFixed(1)}) = {forward.z.toFixed(3)} → {ACTIVATION_SPECS[activationId].name}(z) ={' '}
          {forward.output.toFixed(4)}
        </code>
      </div>

      <div className="im-metrics-grid">
        <div className="im-metric-card">
          <span>Weighted Sum (Σ xᵢwᵢ)</span>
          <strong>{forward.weightedSum.toFixed(3)}</strong>
        </div>
        <div className="im-metric-card">
          <span>Pre-Activation (z)</span>
          <strong style={{ color: '#3b82f6' }}>{forward.z.toFixed(3)}</strong>
        </div>
        <div className="im-metric-card">
          <span>Activated Output φ(z)</span>
          <strong style={{ color: '#10b981' }}>{forward.output.toFixed(4)}</strong>
        </div>
        <div className="im-metric-card">
          <span>Gradient Slope φ&apos;(z)</span>
          <strong style={{ color: '#8b5cf6' }}>{forward.derivative.toFixed(4)}</strong>
        </div>
      </div>
    </div>
  );
}
