import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  simulateSequenceMemory,
  simulateTreeEnsemble,
  simulateVisionParameters,
} from '../../utils/evolutionSim';

function SequenceMemorySimulator() {
  const [seqLength, setSeqLength] = useState(24);
  const [gamma, setGamma] = useState(0.78);
  const [focusToken, setFocusToken] = useState(20);

  const clampedFocus = Math.min(seqLength, focusToken);
  const sim = useMemo(
    () => simulateSequenceMemory({ seqLength, gamma, focusToken: clampedFocus }),
    [seqLength, gamma, clampedFocus]
  );

  const svgW = 700;
  const svgH = 250;
  const padL = 48;
  const padR = 24;
  const padT = 24;
  const padB = 34;

  const mapX = (d) =>
    padL + ((d - 1) / Math.max(1, sim.seqLength - 1)) * (svgW - padL - padR);
  const mapY = (val) => svgH - padB - val * (svgH - padT - padB);

  const buildPath = (key) =>
    sim.curve
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(pt.distance).toFixed(1)} ${mapY(pt[key]).toFixed(1)}`)
      .join(' ');

  return (
    <div className="evo-sim">
      <div className="evo-sim__header">
        <div>
          <h3>Proof Simulator: Sequence Memory Decay &amp; Parallelism</h3>
          <p>
            Compare vanishing RNN signal retention (γᵗ) against gated LSTM memory and
            O(1) direct Attention reach across distance t = 1..T.
          </p>
        </div>
        <button
          type="button"
          className="evo-chip-btn evo-chip-btn--reset"
          onClick={() => {
            setSeqLength(24);
            setGamma(0.78);
            setFocusToken(20);
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="evo-sim__controls">
        <div className="evo-slider-group">
          <div className="evo-slider-header">
            <span>Sequence Length (T tokens)</span>
            <strong>{seqLength}</strong>
          </div>
          <input
            type="range"
            min="4"
            max="40"
            step="1"
            value={seqLength}
            onChange={(e) => setSeqLength(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="evo-slider-group">
          <div className="evo-slider-header">
            <span>RNN Retention Factor (γ)</span>
            <strong>{gamma.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="0.55"
            max="0.95"
            step="0.01"
            value={gamma}
            onChange={(e) => setGamma(parseFloat(e.target.value))}
          />
        </div>

        <div className="evo-slider-group">
          <div className="evo-slider-header">
            <span>Attention Query Token (#)</span>
            <strong>Token {clampedFocus}</strong>
          </div>
          <input
            type="range"
            min="1"
            max={seqLength}
            step="1"
            value={clampedFocus}
            onChange={(e) => setFocusToken(parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      {/* Signal Retention Curves */}
      <div className="evo-svg-frame">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="evo-svg">
          {[0, 0.25, 0.5, 0.75, 1.0].map((v) => (
            <g key={v}>
              <line
                x1={padL}
                y1={mapY(v)}
                x2={svgW - padR}
                y2={mapY(v)}
                stroke="rgba(148,163,184,0.14)"
                strokeDasharray={v === 0 ? undefined : '3 3'}
              />
              <text x={padL - 8} y={mapY(v) + 4} textAnchor="end" className="evo-axis-label">
                {Math.round(v * 100)}%
              </text>
            </g>
          ))}

          {/* Attention O(1) constant line */}
          <path d={buildPath('attention')} fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 4" />
          {/* LSTM gated memory */}
          <path d={buildPath('lstm')} fill="none" stroke="#06b6d4" strokeWidth="2.6" />
          {/* RNN vanishing curve */}
          <path d={buildPath('rnn')} fill="none" stroke="#ef4444" strokeWidth="2.6" />

          <text x={padL} y={svgH - 10} className="evo-axis-label">
            Distance t = 1
          </text>
          <text x={svgW - padR} y={svgH - 10} textAnchor="end" className="evo-axis-label">
            Distance t = {sim.seqLength}
          </text>

          {/* Legend */}
          <g transform={`translate(${padL + 10}, ${padT - 6})`}>
            <line x1="0" y1="0" x2="18" y2="0" stroke="#ef4444" strokeWidth="2.6" />
            <text x="24" y="4" fontSize="11" fill="#fca5a5">RNN (γᵗ)</text>
            <line x1="100" y1="0" x2="118" y2="0" stroke="#06b6d4" strokeWidth="2.6" />
            <text x="124" y="4" fontSize="11" fill="#a5f3fc">LSTM (Gated)</text>
            <line x1="220" y1="0" x2="238" y2="0" stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 3" />
            <text x="244" y="4" fontSize="11" fill="#6ee7b7">Attention (O(1) Path)</text>
          </g>
        </svg>
      </div>

      {/* Token Self-Attention Link Bar */}
      <div className="evo-attention-strip">
        <div className="evo-attention-strip__head">
          <span>
            Direct Self-Attention Weights from <strong>Token {clampedFocus}</strong> across all{' '}
            {sim.seqLength} tokens (1 parallel step; anchor Token {sim.anchorToken})
          </span>
        </div>
        <div className="evo-token-row">
          {sim.attentionWeights.map((item) => {
            const isQuery = item.token === clampedFocus;
            const intensity = Math.min(1, item.weight * 4.5);
            return (
              <button
                key={item.token}
                type="button"
                className={`evo-token-cell ${isQuery ? 'evo-token-cell--query' : ''}`}
                style={{
                  background: `rgba(236, 72, 153, ${(0.08 + intensity * 0.55).toFixed(2)})`,
                }}
                onClick={() => setFocusToken(item.token)}
                title={`Token ${item.token}: ${(item.weight * 100).toFixed(1)}% attention`}
              >
                <span>{item.token}</span>
                <small>{Math.round(item.weight * 100)}%</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="evo-metrics-grid">
        <div className="evo-metric-card">
          <span>RNN Signal @ t={sim.seqLength}</span>
          <strong style={{ color: '#ef4444' }}>
            {(sim.summary.rnnEndRetention * 100).toFixed(2)}%
          </strong>
        </div>
        <div className="evo-metric-card">
          <span>LSTM Signal @ t={sim.seqLength}</span>
          <strong style={{ color: '#06b6d4' }}>
            {(sim.summary.lstmEndRetention * 100).toFixed(1)}%
          </strong>
        </div>
        <div className="evo-metric-card">
          <span>Sequential Steps (RNN vs Transformer)</span>
          <strong style={{ color: '#10b981' }}>
            {sim.summary.rnnSequentialSteps} vs {sim.summary.transformerSequentialSteps}
          </strong>
        </div>
        <div className="evo-metric-card">
          <span>Attention Matrix Pairs (n²)</span>
          <strong style={{ color: '#ec4899' }}>{sim.summary.attentionPairs}</strong>
        </div>
      </div>
    </div>
  );
}

function TreeVarianceSimulator() {
  const [depth, setDepth] = useState(6);
  const [noiseLevel, setNoiseLevel] = useState(0.35);
  const [ensembleSize, setEnsembleSize] = useState(15);

  const sim = useMemo(
    () => simulateTreeEnsemble({ depth, noiseLevel, ensembleSize }),
    [depth, noiseLevel, ensembleSize]
  );

  const svgW = 700;
  const svgH = 265;
  const padL = 46;
  const padR = 24;
  const padT = 24;
  const padB = 34;

  const mapX = (x) => padL + ((x + 2.5) / 5.0) * (svgW - padL - padR);
  const yMin = -2.2;
  const yMax = 2.2;
  const mapY = (y) => {
    const clamped = Math.max(yMin, Math.min(yMax, y));
    return svgH - padB - ((clamped - yMin) / (yMax - yMin)) * (svgH - padT - padB);
  };

  const buildPath = (key) =>
    sim.curveGrid
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(pt.x).toFixed(1)} ${mapY(pt[key]).toFixed(1)}`)
      .join(' ');

  return (
    <div className="evo-sim">
      <div className="evo-sim__header">
        <div>
          <h3>Proof Simulator: Overfitting &amp; Variance Reduction</h3>
          <p>
            See how a single deep Decision Tree memorizes noise spikes while bagging N
            bootstrap trees into a Random Forest smooths out variance.
          </p>
        </div>
        <button
          type="button"
          className="evo-chip-btn evo-chip-btn--reset"
          onClick={() => {
            setDepth(6);
            setNoiseLevel(0.35);
            setEnsembleSize(15);
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="evo-sim__controls">
        <div className="evo-slider-group">
          <div className="evo-slider-header">
            <span>Max Tree Depth</span>
            <strong>{depth}</strong>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={depth}
            onChange={(e) => setDepth(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="evo-slider-group">
          <div className="evo-slider-header">
            <span>Training Noise Level</span>
            <strong>{noiseLevel.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.7"
            step="0.05"
            value={noiseLevel}
            onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
          />
        </div>

        <div className="evo-slider-group">
          <div className="evo-slider-header">
            <span>Random Forest Trees (N)</span>
            <strong>{ensembleSize} trees</strong>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={ensembleSize}
            onChange={(e) => setEnsembleSize(parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      <div className="evo-svg-frame">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="evo-svg">
          <line
            x1={padL}
            y1={mapY(0)}
            x2={svgW - padR}
            y2={mapY(0)}
            stroke="rgba(148,163,184,0.22)"
          />

          {/* Ground Truth Wave */}
          <path d={buildPath('truth')} fill="none" stroke="rgba(226,232,240,0.45)" strokeWidth="1.8" strokeDasharray="5 4" />

          {/* Single Decision Tree Step Fit */}
          <path d={buildPath('singlePred')} fill="none" stroke="#f59e0b" strokeWidth="2.1" />

          {/* Bagged Random Forest Fit */}
          <path d={buildPath('forestPred')} fill="none" stroke="#10b981" strokeWidth="2.8" />

          {/* Training Samples */}
          {sim.trainPoints.map((pt) => (
            <circle
              key={pt.id}
              cx={mapX(pt.x)}
              cy={mapY(pt.y)}
              r="3.2"
              fill="#06b6d4"
              fillOpacity="0.82"
            />
          ))}

          {/* Legend */}
          <g transform={`translate(${padL + 10}, ${padT - 6})`}>
            <line x1="0" y1="0" x2="18" y2="0" stroke="rgba(226,232,240,0.55)" strokeWidth="2" strokeDasharray="4 3" />
            <text x="24" y="4" fontSize="11" fill="#cbd5e1">True Signal</text>
            <line x1="108" y1="0" x2="126" y2="0" stroke="#f59e0b" strokeWidth="2.2" />
            <text x="132" y="4" fontSize="11" fill="#fcd34d">Single Tree</text>
            <line x1="215" y1="0" x2="233" y2="0" stroke="#10b981" strokeWidth="2.8" />
            <text x="239" y="4" fontSize="11" fill="#6ee7b7">Random Forest ({ensembleSize})</text>
          </g>
        </svg>
      </div>

      <div className="evo-metrics-grid">
        <div className="evo-metric-card">
          <span>Single Tree Train MSE</span>
          <strong>{sim.singleTreeTrainMse.toFixed(4)}</strong>
        </div>
        <div className="evo-metric-card">
          <span>Single Tree Test MSE</span>
          <strong style={{ color: '#f59e0b' }}>{sim.singleTreeTestMse.toFixed(4)}</strong>
        </div>
        <div className="evo-metric-card">
          <span>Random Forest Test MSE</span>
          <strong style={{ color: '#10b981' }}>{sim.forestTestMse.toFixed(4)}</strong>
        </div>
        <div className="evo-metric-card">
          <span>Test Error Reduction</span>
          <strong style={{ color: sim.varianceReductionPct >= 0 ? '#06b6d4' : '#ef4444' }}>
            {sim.varianceReductionPct.toFixed(1)}%
          </strong>
        </div>
      </div>
    </div>
  );
}

function VisionParameterSimulator() {
  const [imageSize, setImageSize] = useState(64);
  const [kernelSize, setKernelSize] = useState(3);

  const sim = useMemo(
    () => simulateVisionParameters({ imageSize, kernelSize }),
    [imageSize, kernelSize]
  );

  const mlpBarPct = 100;
  const cnnBarPct = Math.max(0.8, (sim.cnnParams / Math.max(1, sim.mlpParams)) * 100);

  return (
    <div className="evo-sim">
      <div className="evo-sim__header">
        <div>
          <h3>Proof Simulator: Parameter Explosion (Dense MLP vs CNN)</h3>
          <p>
            Compare first-layer weights for {sim.hiddenUnits} MLP units vs {sim.filters}{' '}
            shared {sim.kernelSize}×{sim.kernelSize} CNN filters on an RGB ({sim.imageSize}×
            {sim.imageSize}×3) image.
          </p>
        </div>
        <button
          type="button"
          className="evo-chip-btn evo-chip-btn--reset"
          onClick={() => {
            setImageSize(64);
            setKernelSize(3);
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="evo-sim__controls">
        <div className="evo-slider-group">
          <div className="evo-slider-header">
            <span>Input Image Size (S × S)</span>
            <strong>
              {imageSize} × {imageSize}
            </strong>
          </div>
          <input
            type="range"
            min="16"
            max="224"
            step="16"
            value={imageSize}
            onChange={(e) => setImageSize(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="evo-preset-row">
          <span className="evo-control-label">CNN Kernel Size:</span>
          {[3, 5, 7].map((k) => (
            <button
              key={k}
              type="button"
              className={`evo-chip-btn ${kernelSize === k ? 'evo-chip-btn--active' : ''}`}
              onClick={() => setKernelSize(k)}
            >
              {k}×{k}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Parameter Scale Comparison */}
      <div className="evo-vision-grid">
        <div className="evo-vision-bars">
          <div className="evo-bar-row">
            <div className="evo-bar-row__head">
              <span>Dense MLP Layer 1</span>
              <strong style={{ color: '#ef4444' }}>
                {sim.mlpParams.toLocaleString()} params
              </strong>
            </div>
            <div className="evo-bar-track">
              <div className="evo-bar-fill evo-bar-fill--mlp" style={{ width: `${mlpBarPct}%` }} />
            </div>
          </div>

          <div className="evo-bar-row">
            <div className="evo-bar-row__head">
              <span>CNN Conv2D Layer 1</span>
              <strong style={{ color: '#10b981' }}>
                {sim.cnnParams.toLocaleString()} params
              </strong>
            </div>
            <div className="evo-bar-track">
              <div className="evo-bar-fill evo-bar-fill--cnn" style={{ width: `${cnnBarPct}%` }} />
            </div>
          </div>
        </div>

        <div className="evo-receptive-box">
          <span className="evo-control-label">Receptive Field Footprint</span>
          <div className="evo-receptive-canvas">
            <div
              className="evo-receptive-kernel"
              style={{
                width: `${Math.max(12, Math.min(72, (sim.kernelSize / sim.imageSize) * 260))}%`,
                height: `${Math.max(12, Math.min(72, (sim.kernelSize / sim.imageSize) * 260))}%`,
              }}
            >
              {sim.kernelSize}×{sim.kernelSize}
            </div>
          </div>
          <small>
            Each filter inspects {sim.localAreaPct.toFixed(2)}% of image area locally per step
          </small>
        </div>
      </div>

      <div className="evo-metrics-grid">
        <div className="evo-metric-card">
          <span>Flattened Pixel Inputs</span>
          <strong>{sim.totalInputDims.toLocaleString()}</strong>
        </div>
        <div className="evo-metric-card">
          <span>MLP First-Layer Params</span>
          <strong style={{ color: '#ef4444' }}>{sim.mlpParams.toLocaleString()}</strong>
        </div>
        <div className="evo-metric-card">
          <span>CNN First-Layer Params</span>
          <strong style={{ color: '#10b981' }}>{sim.cnnParams.toLocaleString()}</strong>
        </div>
        <div className="evo-metric-card">
          <span>Parameter Reduction Ratio</span>
          <strong style={{ color: '#06b6d4' }}>{Math.round(sim.ratio).toLocaleString()}×</strong>
        </div>
      </div>
    </div>
  );
}

export default function EvolutionSimulators({ trackId }) {
  if (trackId === 'sequence') return <SequenceMemorySimulator />;
  if (trackId === 'trees') return <TreeVarianceSimulator />;
  return <VisionParameterSimulator />;
}
