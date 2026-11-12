import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  GitCompare,
  Hammer,
  HelpCircle,
  Lock,
  RotateCcw,
  Sliders,
  Unlock,
} from 'lucide-react';
import {
  simulateKnnBoundary,
  simulatePolynomialExperiment,
  simulateTrainingWhatIf,
} from '../../utils/breakItWhatIfEngine';
import Card from '../common/Card';
import Button from '../common/Button';
import './WhatIfStudio.css';

const WHAT_IF_TABS = [
  { id: 'polynomial', label: 'Polynomial & Ridge', icon: Sliders },
  { id: 'boundary', label: '2D Decision Boundary', icon: GitCompare },
  { id: 'training', label: 'Training Curves & Gradients', icon: Activity },
];

const DEFAULT_POLY = { degree: 4, ridgeLambda: 0.1, noise: 0.45, trainCount: 11 };
const DEFAULT_BOUNDARY = { k: 5, scaleFactor: 1, noise: 0.25 };
const DEFAULT_TRAINING = {
  learningRate: 0.3,
  initScale: 1.3,
  activationId: 'relu',
  regLambda: 0.05,
};

function formatDelta(val, baselineVal, higherIsBetter, digits = 3, suffix = '') {
  if (baselineVal === undefined || baselineVal === null) return null;
  const diff = val - baselineVal;
  if (Math.abs(diff) < 1e-6) {
    return { text: 'Δ 0', tone: 'neutral' };
  }
  const sign = diff > 0 ? '+' : '';
  const improved = higherIsBetter ? diff > 0 : diff < 0;
  return {
    text: `Δ ${sign}${diff.toFixed(digits)}${suffix}`,
    tone: improved ? 'good' : 'bad',
  };
}

function MetricWithBaseline({ label, formattedValue, delta, color }) {
  return (
    <div className="wi-metric-card">
      <span>{label}</span>
      <strong style={color ? { color } : undefined}>{formattedValue}</strong>
      {delta && (
        <em className={`wi-delta wi-delta--${delta.tone}`}>{delta.text} vs A</em>
      )}
    </div>
  );
}

export default function WhatIfStudio() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const expParam = searchParams.get('exp') || 'polynomial';
  const activeTab = WHAT_IF_TABS.find((t) => t.id === expParam) || WHAT_IF_TABS[0];

  const [polyParams, setPolyParams] = useState(DEFAULT_POLY);
  const [boundaryParams, setBoundaryParams] = useState(DEFAULT_BOUNDARY);
  const [trainingParams, setTrainingParams] = useState(DEFAULT_TRAINING);
  const [baselines, setBaselines] = useState({});

  const polySim = useMemo(() => simulatePolynomialExperiment(polyParams), [polyParams]);
  const boundarySim = useMemo(() => simulateKnnBoundary(boundaryParams), [boundaryParams]);
  const trainingSim = useMemo(() => simulateTrainingWhatIf(trainingParams), [trainingParams]);

  const selectExp = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('exp', id);
    setSearchParams(next, { replace: true });
  };

  const currentBaseline = baselines[activeTab.id] || null;

  const toggleBaseline = () => {
    setBaselines((prev) => {
      if (prev[activeTab.id]) {
        const next = { ...prev };
        delete next[activeTab.id];
        return next;
      }
      if (activeTab.id === 'polynomial') {
        return {
          ...prev,
          polynomial: {
            trainMse: polySim.trainMse,
            testMse: polySim.testMse,
            l2Norm: polySim.l2Norm,
            gap: polySim.generalizationGap,
          },
        };
      }
      if (activeTab.id === 'boundary') {
        return {
          ...prev,
          boundary: {
            trainAccuracy: boundarySim.trainAccuracy,
            testAccuracy: boundarySim.testAccuracy,
            boundaryFlips: boundarySim.boundaryFlips,
            scaleFactor: boundarySim.scaleFactor,
          },
        };
      }
      return {
        ...prev,
        training: {
          finalTrainLoss: trainingSim.finalTrainLoss,
          finalValLoss: trainingSim.finalValLoss,
          layer1Grad: trainingSim.layer1Grad,
        },
      };
    });
  };

  const resetActive = () => {
    setBaselines((prev) => {
      const next = { ...prev };
      delete next[activeTab.id];
      return next;
    });
    if (activeTab.id === 'polynomial') setPolyParams(DEFAULT_POLY);
    else if (activeTab.id === 'boundary') setBoundaryParams(DEFAULT_BOUNDARY);
    else setTrainingParams(DEFAULT_TRAINING);
  };

  return (
    <div className="wi-page fade-in">
      <header className="wi-header">
        <div>
          <div className="wi-header__eyebrow">
            <HelpCircle size={14} />
            <span>Phase 6 · What-If Counterfactual Studio</span>
          </div>
          <h1 className="wi-header__title">Interactive What-If AI Experiments</h1>
          <p className="wi-header__subtitle">
            Adjust hyperparameters, regularization, feature scaling, and architecture dynamics
            live—lock Baseline (A) to compare counterfactual changes (B) side-by-side.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={Hammer}
          onClick={() => navigate('/break-it')}
        >
          Open Break-It Lab
        </Button>
      </header>

      {/* Experiment Switcher Tabs + Baseline Lock */}
      <div className="wi-top-bar">
        <nav className="wi-tabs" role="tablist" aria-label="What-If experiments">
          {WHAT_IF_TABS.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`wi-tab-btn ${isActive ? 'wi-tab-btn--active' : ''}`}
                onClick={() => selectExp(tab.id)}
              >
                <tab.icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="wi-baseline-actions">
          <button
            type="button"
            className={`wi-chip-btn ${currentBaseline ? 'wi-chip-btn--locked' : 'wi-chip-btn--primary'}`}
            onClick={toggleBaseline}
          >
            {currentBaseline ? <Unlock size={14} /> : <Lock size={14} />}
            <span>{currentBaseline ? 'Unlock Baseline (A)' : 'Lock Baseline (A)'}</span>
          </button>
          <button
            type="button"
            className="wi-chip-btn"
            onClick={resetActive}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Experiment 1: Polynomial & Ridge */}
      {activeTab.id === 'polynomial' && (
        <Card hoverable={false} className="wi-stage-card">
          <div className="wi-controls-grid">
            <div className="wi-slider-group">
              <div className="wi-slider-header">
                <span>Polynomial Degree</span>
                <strong>{polyParams.degree}</strong>
              </div>
              <input
                type="range"
                min="1"
                max="9"
                step="1"
                value={polyParams.degree}
                onChange={(e) =>
                  setPolyParams((p) => ({ ...p, degree: parseInt(e.target.value, 10) }))
                }
              />
            </div>

            <div className="wi-slider-group">
              <div className="wi-slider-header">
                <span>Ridge Regularization (λ)</span>
                <strong>{polyParams.ridgeLambda.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={polyParams.ridgeLambda}
                onChange={(e) =>
                  setPolyParams((p) => ({ ...p, ridgeLambda: parseFloat(e.target.value) }))
                }
              />
            </div>

            <div className="wi-slider-group">
              <div className="wi-slider-header">
                <span>Noise Amplitude</span>
                <strong>{polyParams.noise.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.85"
                step="0.05"
                value={polyParams.noise}
                onChange={(e) =>
                  setPolyParams((p) => ({ ...p, noise: parseFloat(e.target.value) }))
                }
              />
            </div>

            <div className="wi-slider-group">
              <div className="wi-slider-header">
                <span>Training Samples (n)</span>
                <strong>{polyParams.trainCount}</strong>
              </div>
              <input
                type="range"
                min="8"
                max="32"
                step="2"
                value={polyParams.trainCount}
                onChange={(e) =>
                  setPolyParams((p) => ({ ...p, trainCount: parseInt(e.target.value, 10) }))
                }
              />
            </div>
          </div>

          <div className="wi-dual-plots">
            <div className="wi-svg-frame">
              <div className="wi-plot-title">Fitted Curve vs Train/Test Data</div>
              <svg viewBox="0 0 540 240" className="wi-svg">
                {(() => {
                  const pad = { l: 38, r: 16, t: 18, b: 24 };
                  const mx = (x) => pad.l + ((x + 2.1) / 4.2) * (540 - pad.l - pad.r);
                  const my = (y) => {
                    const c = Math.max(-2.5, Math.min(2.5, y));
                    return 240 - pad.b - ((c + 2.5) / 5.0) * (240 - pad.t - pad.b);
                  };
                  const truthD = polySim.curveGrid
                    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mx(pt.x).toFixed(1)} ${my(pt.truth).toFixed(1)}`)
                    .join(' ');
                  const predD = polySim.curveGrid
                    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mx(pt.x).toFixed(1)} ${my(pt.pred).toFixed(1)}`)
                    .join(' ');
                  return (
                    <>
                      <path d={truthD} fill="none" stroke="rgba(226,232,240,0.45)" strokeWidth="1.6" strokeDasharray="4 4" />
                      <path d={predD} fill="none" stroke="#06b6d4" strokeWidth="2.6" />
                      {polySim.trainPoints.map((pt) => (
                        <circle key={`tr-${pt.id}`} cx={mx(pt.x)} cy={my(pt.y)} r="3.6" fill="#3b82f6" />
                      ))}
                      {polySim.testPoints
                        .filter((_, idx) => idx % 3 === 0)
                        .map((pt) => (
                          <circle
                            key={`te-${pt.id}`}
                            cx={mx(pt.x)}
                            cy={my(pt.y)}
                            r="2.8"
                            fill="#f59e0b"
                            fillOpacity="0.7"
                          />
                        ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="wi-svg-frame">
              <div className="wi-plot-title">Bias-Variance Degree Sweep (1..9)</div>
              <svg viewBox="0 0 540 240" className="wi-svg">
                {(() => {
                  const pad = { l: 42, r: 18, t: 18, b: 28 };
                  const maxE = Math.max(1.2, ...polySim.degreeSweep.map((d) => d.testMse));
                  const mx = (deg) => pad.l + ((deg - 1) / 8) * (540 - pad.l - pad.r);
                  const my = (mse) => 240 - pad.b - (Math.min(maxE, mse) / maxE) * (240 - pad.t - pad.b);
                  const trD = polySim.degreeSweep
                    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mx(pt.degree).toFixed(1)} ${my(pt.trainMse).toFixed(1)}`)
                    .join(' ');
                  const teD = polySim.degreeSweep
                    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mx(pt.degree).toFixed(1)} ${my(pt.testMse).toFixed(1)}`)
                    .join(' ');

                  return (
                    <>
                      <line
                        x1={mx(polyParams.degree)}
                        y1={pad.t}
                        x2={mx(polyParams.degree)}
                        y2={240 - pad.b}
                        stroke="rgba(6,182,212,0.4)"
                        strokeDasharray="3 3"
                      />
                      <path d={trD} fill="none" stroke="#3b82f6" strokeWidth="2.2" />
                      <path d={teD} fill="none" stroke="#ec4899" strokeWidth="2.4" />
                      {polySim.degreeSweep.map((pt) => (
                        <text
                          key={pt.degree}
                          x={mx(pt.degree)}
                          y={240 - 8}
                          textAnchor="middle"
                          className="wi-axis-label"
                        >
                          {pt.degree}
                        </text>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          <div className="wi-metrics-grid">
            <MetricWithBaseline
              label="Train MSE"
              formattedValue={polySim.trainMse.toFixed(4)}
              delta={formatDelta(polySim.trainMse, currentBaseline?.trainMse, false, 4)}
              color="#3b82f6"
            />
            <MetricWithBaseline
              label="Test MSE"
              formattedValue={polySim.testMse.toFixed(4)}
              delta={formatDelta(polySim.testMse, currentBaseline?.testMse, false, 4)}
              color="#ec4899"
            />
            <MetricWithBaseline
              label="Weight Norm ||w||₂"
              formattedValue={polySim.l2Norm.toFixed(3)}
              delta={formatDelta(polySim.l2Norm, currentBaseline?.l2Norm, false, 2)}
            />
            <MetricWithBaseline
              label="Generalization Gap"
              formattedValue={polySim.generalizationGap.toFixed(4)}
              delta={formatDelta(polySim.generalizationGap, currentBaseline?.gap, false, 4)}
            />
          </div>
        </Card>
      )}

      {/* Experiment 2: 2D Decision Boundary */}
      {activeTab.id === 'boundary' && (
        <Card hoverable={false} className="wi-stage-card">
          <div className="wi-controls-grid">
            <div className="wi-slider-group">
              <div className="wi-slider-header">
                <span>Neighbors (K)</span>
                <strong>K = {boundaryParams.k}</strong>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="2"
                value={boundaryParams.k}
                onChange={(e) =>
                  setBoundaryParams((p) => ({ ...p, k: parseInt(e.target.value, 10) }))
                }
              />
            </div>

            <div className="wi-slider-group">
              <div className="wi-slider-header">
                <span>Feature x₂ Scale Distortion</span>
                <strong>{boundaryParams.scaleFactor}×</strong>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={boundaryParams.scaleFactor}
                onChange={(e) =>
                  setBoundaryParams((p) => ({ ...p, scaleFactor: parseInt(e.target.value, 10) }))
                }
              />
            </div>

            <div className="wi-slider-group">
              <div className="wi-slider-header">
                <span>Cluster Noise</span>
                <strong>{boundaryParams.noise.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.05"
                value={boundaryParams.noise}
                onChange={(e) =>
                  setBoundaryParams((p) => ({ ...p, noise: parseFloat(e.target.value) }))
                }
              />
            </div>
          </div>

          <div className="wi-svg-frame wi-svg-frame--square">
            <svg viewBox="0 0 300 300" className="wi-svg wi-svg--square">
              {(() => {
                const size = 300;
                const cellW = size / boundarySim.gridN;
                const mapX = (v) => ((v - boundarySim.minC) / (boundarySim.maxC - boundarySim.minC)) * size;
                const mapY = (v) => size - ((v - boundarySim.minC) / (boundarySim.maxC - boundarySim.minC)) * size;
                return (
                  <>
                    {boundarySim.cells.map((c) => (
                      <rect
                        key={`${c.row}-${c.col}`}
                        x={c.col * cellW}
                        y={c.row * cellW}
                        width={cellW + 0.5}
                        height={cellW + 0.5}
                        fill={c.pred === 1 ? '#ec4899' : '#06b6d4'}
                        fillOpacity={0.14 + Math.abs(c.prob1 - 0.5) * 0.28}
                      />
                    ))}
                    {boundarySim.train.map((pt) => (
                      <circle
                        key={`tr-${pt.id}`}
                        cx={mapX(pt.x1)}
                        cy={mapY(pt.x2)}
                        r="3.8"
                        fill={pt.label === 1 ? '#f472b6' : '#22d3ee'}
                        stroke="#070b15"
                        strokeWidth="1.1"
                      />
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>

          <div className="wi-metrics-grid">
            <MetricWithBaseline
              label="Train Accuracy"
              formattedValue={`${boundarySim.trainAccuracy.toFixed(1)}%`}
              delta={formatDelta(boundarySim.trainAccuracy, currentBaseline?.trainAccuracy, true, 1, '%')}
              color="#06b6d4"
            />
            <MetricWithBaseline
              label="Test Accuracy"
              formattedValue={`${boundarySim.testAccuracy.toFixed(1)}%`}
              delta={formatDelta(boundarySim.testAccuracy, currentBaseline?.testAccuracy, true, 1, '%')}
              color="#10b981"
            />
            <MetricWithBaseline
              label="Boundary Complexity"
              formattedValue={String(boundarySim.boundaryFlips)}
              delta={formatDelta(boundarySim.boundaryFlips, currentBaseline?.boundaryFlips, false, 0)}
            />
            <MetricWithBaseline
              label="Scale Factor"
              formattedValue={`${boundarySim.scaleFactor}×`}
              delta={formatDelta(boundarySim.scaleFactor, currentBaseline?.scaleFactor, false, 0, '×')}
            />
          </div>
        </Card>
      )}

      {/* Experiment 3: Training Curves & Gradients */}
      {activeTab.id === 'training' && (
        <Card hoverable={false} className="wi-stage-card">
          <div className="wi-controls-grid">
            <div className="wi-slider-group">
              <div className="wi-slider-header">
                <span>Learning Rate (η)</span>
                <strong>{trainingParams.learningRate.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="0.04"
                max="1.1"
                step="0.02"
                value={trainingParams.learningRate}
                onChange={(e) =>
                  setTrainingParams((p) => ({ ...p, learningRate: parseFloat(e.target.value) }))
                }
              />
            </div>

            <div className="wi-slider-group">
              <div className="wi-slider-header">
                <span>Weight Init Scale</span>
                <strong>{trainingParams.initScale.toFixed(1)}×</strong>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.4"
                step="0.1"
                value={trainingParams.initScale}
                onChange={(e) =>
                  setTrainingParams((p) => ({ ...p, initScale: parseFloat(e.target.value) }))
                }
              />
            </div>

            <div className="wi-slider-group">
              <div className="wi-slider-header">
                <span>Regularization (λ)</span>
                <strong>{trainingParams.regLambda.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="0.4"
                step="0.02"
                value={trainingParams.regLambda}
                onChange={(e) =>
                  setTrainingParams((p) => ({ ...p, regLambda: parseFloat(e.target.value) }))
                }
              />
            </div>

            <div className="wi-activation-toggle">
              <span className="wi-control-label">Activation</span>
              <div className="wi-act-pills">
                {['sigmoid', 'tanh', 'relu'].map((act) => (
                  <button
                    key={act}
                    type="button"
                    className={`wi-chip-btn ${trainingParams.activationId === act ? 'wi-chip-btn--active' : ''}`}
                    onClick={() => setTrainingParams((p) => ({ ...p, activationId: act }))}
                  >
                    {act.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="wi-dual-plots">
            <div className="wi-svg-frame">
              <div className="wi-plot-title">Epoch Train vs Validation Loss</div>
              <svg viewBox="0 0 540 230" className="wi-svg">
                {(() => {
                  const pad = { l: 42, r: 18, t: 18, b: 28 };
                  const maxL = Math.max(1.8, ...trainingSim.epochCurves.map((c) => Math.max(c.trainLoss, c.valLoss)));
                  const mx = (ep) => pad.l + (ep / 26) * (540 - pad.l - pad.r);
                  const my = (l) => 230 - pad.b - (l / maxL) * (230 - pad.t - pad.b);
                  const trD = trainingSim.epochCurves
                    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${mx(c.epoch).toFixed(1)} ${my(c.trainLoss).toFixed(1)}`)
                    .join(' ');
                  const vaD = trainingSim.epochCurves
                    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${mx(c.epoch).toFixed(1)} ${my(c.valLoss).toFixed(1)}`)
                    .join(' ');
                  return (
                    <>
                      <path d={trD} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                      <path d={vaD} fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeDasharray="5 3" />
                      <text x={pad.l} y={230 - 8} className="wi-axis-label">Epoch 0</text>
                      <text x={540 - pad.r} y={230 - 8} textAnchor="end" className="wi-axis-label">Epoch 26</text>
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="wi-layers-box">
              <div className="wi-plot-title">8-Layer Gradient Flow Norm (L1 → L8)</div>
              <div className="wi-layers-bars">
                {trainingSim.layerNorms.map((ln) => {
                  const maxLog = Math.max(
                    1.5,
                    ...trainingSim.layerNorms.map((x) => Math.log10(Math.max(1e-5, x.norm) + 1))
                  );
                  const pct = Math.max(
                    4,
                    (Math.log10(Math.max(1e-5, ln.norm) + 1) / maxLog) * 100
                  );
                  const col =
                    ln.norm < 0.02 ? '#ef4444' : ln.norm > 15 ? '#f59e0b' : '#10b981';

                  return (
                    <div key={ln.layer} className="wi-layer-col">
                      <div className="wi-layer-track">
                        <div className="wi-layer-fill" style={{ height: `${pct}%`, background: col }} />
                      </div>
                      <span>L{ln.layer}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="wi-metrics-grid">
            <MetricWithBaseline
              label="Final Train Loss"
              formattedValue={trainingSim.finalTrainLoss.toFixed(3)}
              delta={formatDelta(trainingSim.finalTrainLoss, currentBaseline?.finalTrainLoss, false, 3)}
              color="#06b6d4"
            />
            <MetricWithBaseline
              label="Final Val Loss"
              formattedValue={trainingSim.finalValLoss.toFixed(3)}
              delta={formatDelta(trainingSim.finalValLoss, currentBaseline?.finalValLoss, false, 3)}
              color="#f59e0b"
            />
            <MetricWithBaseline
              label="Layer 1 Gradient"
              formattedValue={
                trainingSim.layer1Grad < 0.001
                  ? trainingSim.layer1Grad.toExponential(1)
                  : trainingSim.layer1Grad.toFixed(3)
              }
              delta={formatDelta(trainingSim.layer1Grad, currentBaseline?.layer1Grad, true, 3)}
            />
            <div className="wi-metric-card">
              <span>Training Regime</span>
              <strong
                style={{
                  color: trainingSim.status.includes('Converging') ? '#10b981' : '#ef4444',
                  fontSize: '0.86rem',
                }}
              >
                {trainingSim.status}
              </strong>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
