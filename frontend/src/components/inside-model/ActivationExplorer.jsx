import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  ACTIVATION_SPECS,
  computeSoftmax,
  evaluateActivation,
} from '../../utils/neuralEngine';

const ACTIVATION_TABS = [
  { id: 'sigmoid', label: 'Sigmoid' },
  { id: 'tanh', label: 'Tanh' },
  { id: 'relu', label: 'ReLU' },
  { id: 'leaky_relu', label: 'Leaky ReLU' },
  { id: 'softmax', label: 'Softmax' },
];

const DEFAULT_LOGITS = [2.2, 1.0, -0.4, -1.6];
const CLASS_LABELS = ['Class A', 'Class B', 'Class C', 'Class D'];
const Z_MIN = -5;
const Z_MAX = 5;

function ScalarActivationPlot({ activeTab }) {
  const [probeZ, setProbeZ] = useState(1.2);
  const [leakyAlpha, setLeakyAlpha] = useState(0.1);

  const spec = ACTIVATION_SPECS[activeTab] || ACTIVATION_SPECS.sigmoid;
  const probeEval = useMemo(
    () => evaluateActivation(activeTab, probeZ, leakyAlpha),
    [activeTab, probeZ, leakyAlpha]
  );

  const yMin = activeTab === 'tanh' ? -1.4 : activeTab === 'leaky_relu' ? -1.2 : -0.4;
  const yMax = activeTab === 'relu' || activeTab === 'leaky_relu' ? 5.2 : 1.4;

  const svgW = 700;
  const svgH = 300;
  const padL = 48;
  const padR = 24;
  const padT = 24;
  const padB = 34;

  const mapX = (z) => padL + ((z - Z_MIN) / (Z_MAX - Z_MIN)) * (svgW - padL - padR);
  const mapY = (y) => {
    const clamped = Math.max(yMin, Math.min(yMax, y));
    return svgH - padB - ((clamped - yMin) / (yMax - yMin)) * (svgH - padT - padB);
  };

  const samples = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= 140; i += 1) {
      const z = Z_MIN + (i / 140) * (Z_MAX - Z_MIN);
      const res = evaluateActivation(activeTab, z, leakyAlpha);
      arr.push({ z, value: res.value, derivative: res.derivative });
    }
    return arr;
  }, [activeTab, leakyAlpha]);

  const fPath = samples
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.z).toFixed(1)} ${mapY(p.value).toFixed(1)}`)
    .join(' ');
  const dfPath = samples
    .map(
      (p, idx) =>
        `${idx === 0 ? 'M' : 'L'} ${mapX(p.z).toFixed(1)} ${mapY(p.derivative).toFixed(1)}`
    )
    .join(' ');

  const isDeadOrVanishing =
    activeTab === 'relu'
      ? probeZ <= 0
      : activeTab === 'leaky_relu'
      ? probeZ <= 0
      : probeEval.derivative < 0.08;

  const regimeLabel =
    activeTab === 'relu' && probeZ <= 0
      ? 'Dead Region (Gradient = 0)'
      : activeTab === 'leaky_relu' && probeZ <= 0
      ? `Leaky Slope (Gradient = ${leakyAlpha.toFixed(2)})`
      : probeEval.derivative < 0.08
      ? 'Saturated / Vanishing Region'
      : 'Active Gradient Region';

  return (
    <div className="im-module">
      <div className="im-toolbar">
        <div className="im-slider-group">
          <div className="im-slider-header">
            <span>Input Probe (z)</span>
            <strong>{probeZ.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="-5"
            max="5"
            step="0.1"
            value={probeZ}
            onChange={(e) => setProbeZ(parseFloat(e.target.value))}
          />
        </div>

        {activeTab === 'leaky_relu' && (
          <div className="im-slider-group">
            <div className="im-slider-header">
              <span>Negative Slope (α)</span>
              <strong>{leakyAlpha.toFixed(2)}</strong>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.4"
              step="0.02"
              value={leakyAlpha}
              onChange={(e) => setLeakyAlpha(parseFloat(e.target.value))}
            />
          </div>
        )}

        <button
          type="button"
          className="im-chip-btn im-chip-btn--reset"
          onClick={() => {
            setProbeZ(1.2);
            setLeakyAlpha(0.1);
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="im-formulas-row">
        <code className="im-formula-pill">{spec.formula}</code>
        <code className="im-formula-pill im-formula-pill--purple">{spec.derivativeFormula}</code>
      </div>

      <div className="im-svg-frame">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="im-svg">
          {/* Vanishing / Dead Region Highlight Shading */}
          {(activeTab === 'sigmoid' || activeTab === 'tanh') && (
            <>
              <rect
                x={mapX(-5)}
                y={padT}
                width={mapX(-3) - mapX(-5)}
                height={svgH - padT - padB}
                fill="#ef4444"
                fillOpacity="0.08"
              />
              <rect
                x={mapX(3)}
                y={padT}
                width={mapX(5) - mapX(3)}
                height={svgH - padT - padB}
                fill="#ef4444"
                fillOpacity="0.08"
              />
            </>
          )}
          {(activeTab === 'relu' || activeTab === 'leaky_relu') && (
            <rect
              x={mapX(-5)}
              y={padT}
              width={mapX(0) - mapX(-5)}
              height={svgH - padT - padB}
              fill={activeTab === 'relu' ? '#ef4444' : '#f59e0b'}
              fillOpacity="0.07"
            />
          )}

          {/* Zero axes */}
          <line
            x1={padL}
            y1={mapY(0)}
            x2={svgW - padR}
            y2={mapY(0)}
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="1.2"
          />
          <line
            x1={mapX(0)}
            y1={padT}
            x2={mapX(0)}
            y2={svgH - padB}
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="1.2"
          />

          {/* X-axis ticks */}
          {[-4, -2, 0, 2, 4].map((t) => (
            <text
              key={t}
              x={mapX(t)}
              y={svgH - 12}
              textAnchor="middle"
              className="im-axis-label"
            >
              {t}
            </text>
          ))}

          {/* Curves */}
          <path d={fPath} fill="none" stroke="#06b6d4" strokeWidth="2.8" />
          <path d={dfPath} fill="none" stroke="#a855f7" strokeWidth="2.2" strokeDasharray="6 4" />

          {/* Probe Vertical Line & Points */}
          <line
            x1={mapX(probeZ)}
            y1={padT}
            x2={mapX(probeZ)}
            y2={svgH - padB}
            stroke="#e2e8f0"
            strokeOpacity="0.45"
            strokeDasharray="3 3"
          />
          <circle
            cx={mapX(probeZ)}
            cy={mapY(probeEval.value)}
            r="5.5"
            fill="#06b6d4"
            stroke="#060914"
            strokeWidth="1.5"
          />
          <circle
            cx={mapX(probeZ)}
            cy={mapY(probeEval.derivative)}
            r="5"
            fill="#a855f7"
            stroke="#060914"
            strokeWidth="1.5"
          />

          {/* Legend */}
          <g transform={`translate(${padL + 10}, ${padT + 14})`}>
            <line x1="0" y1="0" x2="22" y2="0" stroke="#06b6d4" strokeWidth="2.8" />
            <text x="28" y="4" fontSize="11" fill="#e2e8f0">
              f(z) Output
            </text>
            <line x1="115" y1="0" x2="137" y2="0" stroke="#a855f7" strokeWidth="2.2" strokeDasharray="5 3" />
            <text x="143" y="4" fontSize="11" fill="#c4b5fd">
              f&apos;(z) Derivative
            </text>
          </g>
        </svg>
      </div>

      <p className="im-info-banner">{spec.vanishingNote}</p>

      <div className="im-metrics-grid">
        <div className="im-metric-card">
          <span>Probe z</span>
          <strong>{probeZ.toFixed(2)}</strong>
        </div>
        <div className="im-metric-card">
          <span>Output f(z)</span>
          <strong style={{ color: '#06b6d4' }}>{probeEval.value.toFixed(4)}</strong>
        </div>
        <div className="im-metric-card">
          <span>Derivative f&apos;(z)</span>
          <strong style={{ color: '#a855f7' }}>{probeEval.derivative.toFixed(4)}</strong>
        </div>
        <div className="im-metric-card">
          <span>Gradient Regime</span>
          <strong
            style={{
              color: isDeadOrVanishing ? '#f59e0b' : '#10b981',
              fontSize: '0.84rem',
            }}
          >
            {regimeLabel}
          </strong>
        </div>
      </div>
    </div>
  );
}

function SoftmaxExplorer() {
  const [logits, setLogits] = useState(DEFAULT_LOGITS);
  const [temperature, setTemperature] = useState(1.0);

  const soft = useMemo(() => computeSoftmax(logits, temperature), [logits, temperature]);

  const updateLogit = (idx, val) => {
    setLogits((prev) => prev.map((v, i) => (i === idx ? val : v)));
  };

  return (
    <div className="im-module">
      <div className="im-toolbar">
        <div className="im-slider-group">
          <div className="im-slider-header">
            <span>Temperature (T)</span>
            <strong>{temperature.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
          />
        </div>

        <button
          type="button"
          className="im-chip-btn im-chip-btn--reset"
          onClick={() => {
            setLogits([...DEFAULT_LOGITS]);
            setTemperature(1.0);
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="im-formulas-row">
        <code className="im-formula-pill">pᵢ = exp(zᵢ / T) / Σⱼ exp(zⱼ / T)</code>
        <code className="im-formula-pill im-formula-pill--purple">
          ∂pᵢ/∂zᵢ (T=1) = pᵢ(1 - pᵢ)
        </code>
      </div>

      <div className="im-sliders-grid">
        <div className="im-panel-box">
          <h3 className="im-box-title">Raw Logits (z₁ – z₄)</h3>
          <div className="im-slider-stack">
            {logits.map((val, idx) => (
              <div key={CLASS_LABELS[idx]} className="im-slider-group">
                <div className="im-slider-header">
                  <span>{CLASS_LABELS[idx]} Logit</span>
                  <strong>{val.toFixed(1)}</strong>
                </div>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="0.1"
                  value={val}
                  onChange={(e) => updateLogit(idx, parseFloat(e.target.value))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="im-panel-box">
          <h3 className="im-box-title">Softmax Probability Distribution</h3>
          <div className="im-softmax-bars">
            {soft.probabilities.map((p, idx) => {
              const isWinner = idx === soft.argmax;
              return (
                <div key={CLASS_LABELS[idx]} className="im-softmax-row">
                  <div className="im-softmax-row__head">
                    <span>
                      {CLASS_LABELS[idx]} {isWinner && <em className="im-winner-tag">Argmax</em>}
                    </span>
                    <span className="im-softmax-nums">
                      <strong>{(p * 100).toFixed(1)}%</strong> · Jᵢᵢ={soft.jacobianDiag[idx].toFixed(3)}
                    </span>
                  </div>
                  <div className="im-softmax-track">
                    <div
                      className={`im-softmax-fill ${isWinner ? 'im-softmax-fill--winner' : ''}`}
                      style={{ width: `${Math.max(1.5, p * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="im-metrics-grid">
        <div className="im-metric-card">
          <span>Predicted Class (Argmax)</span>
          <strong style={{ color: '#10b981' }}>{CLASS_LABELS[soft.argmax]}</strong>
        </div>
        <div className="im-metric-card">
          <span>Max Confidence</span>
          <strong style={{ color: '#06b6d4' }}>
            {(soft.probabilities[soft.argmax] * 100).toFixed(1)}%
          </strong>
        </div>
        <div className="im-metric-card">
          <span>Shannon Entropy H(p)</span>
          <strong style={{ color: '#8b5cf6' }}>{soft.entropy.toFixed(3)} nats</strong>
        </div>
        <div className="im-metric-card">
          <span>Probability Sum (Σ pᵢ)</span>
          <strong>{soft.sum.toFixed(4)}</strong>
        </div>
      </div>
    </div>
  );
}

export default function ActivationExplorer() {
  const [activeTab, setActiveTab] = useState('sigmoid');

  return (
    <div className="im-module">
      <div className="im-subtabs" role="tablist" aria-label="Activation functions">
        {ACTIVATION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`im-chip-btn ${activeTab === tab.id ? 'im-chip-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'softmax' ? (
        <SoftmaxExplorer />
      ) : (
        <ScalarActivationPlot activeTab={activeTab} />
      )}
    </div>
  );
}
