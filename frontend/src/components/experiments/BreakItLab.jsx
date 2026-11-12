import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Hammer,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { BREAK_IT_SCENARIOS, getBreakItScenarioById } from './breakItConfig';
import {
  simulateClassImbalance,
  simulateDataLeakage,
  simulateGdDynamics,
  simulateKnnBoundary,
  simulateLayerGradients,
  simulatePolynomialExperiment,
} from '../../utils/breakItWhatIfEngine';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import './BreakItLab.css';

function renderScenarioVisual(scenario, activeState) {
  const val = activeState.value;
  const isFixed = activeState.isFixed;

  if (scenario.id === 'high-learning-rate') {
    const sim = simulateGdDynamics(val, 14);
    const svgW = 680;
    const svgH = 250;
    const pad = { l: 44, r: 22, t: 22, b: 32 };
    const minT = -6;
    const maxT = 6;
    const maxL = Math.max(12, Math.min(80, ...sim.trajectory.map((pt) => pt.loss)));

    const mapX = (t) =>
      pad.l + ((Math.max(minT, Math.min(maxT, t)) - minT) / (maxT - minT)) * (svgW - pad.l - pad.r);
    const mapY = (l) =>
      svgH - pad.b - (Math.min(maxL, l) / maxL) * (svgH - pad.t - pad.b);

    const curvePts = [];
    for (let i = 0; i <= 80; i += 1) {
      const t = minT + (i / 80) * (maxT - minT);
      curvePts.push(`${i === 0 ? 'M' : 'L'} ${mapX(t).toFixed(1)} ${mapY(t * t + 0.2 * t).toFixed(1)}`);
    }
    const trajPts = sim.trajectory
      .slice(0, 10)
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.theta).toFixed(1)} ${mapY(pt.loss).toFixed(1)}`)
      .join(' ');

    return (
      <div className="bi-visual-wrap">
        <div className="bi-svg-frame">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="bi-svg">
            <path d={curvePts.join(' ')} fill="none" stroke="#3b82f6" strokeWidth="2.4" />
            <path
              d={trajPts}
              fill="none"
              stroke={sim.diverged ? '#ef4444' : '#10b981'}
              strokeWidth="2.2"
              strokeDasharray="5 3"
            />
            {sim.trajectory.slice(0, 10).map((pt) => (
              <circle
                key={pt.step}
                cx={mapX(pt.theta)}
                cy={mapY(pt.loss)}
                r={pt.step === 0 ? 5.5 : 4}
                fill={sim.diverged ? '#ef4444' : '#10b981'}
              />
            ))}
            <text x={pad.l} y={svgH - 8} className="bi-axis-label">θ = -6</text>
            <text x={svgW - pad.r} y={svgH - 8} textAnchor="end" className="bi-axis-label">θ = +6</text>
          </svg>
        </div>

        <div className="bi-metrics-grid">
          <div className="bi-metric-card">
            <span>Learning Rate α</span>
            <strong>{sim.learningRate.toFixed(2)}</strong>
          </div>
          <div className="bi-metric-card">
            <span>Final θ</span>
            <strong>{sim.finalTheta.toFixed(3)}</strong>
          </div>
          <div className="bi-metric-card">
            <span>Final Loss J(θ)</span>
            <strong style={{ color: sim.diverged ? '#ef4444' : '#10b981' }}>
              {sim.finalLoss.toFixed(3)}
            </strong>
          </div>
          <div className="bi-metric-card">
            <span>Diagnosis</span>
            <strong style={{ color: sim.diverged ? '#ef4444' : '#10b981', fontSize: '0.86rem' }}>
              {sim.diverged ? 'Diverged / Exploding' : 'Converged Cleanly'}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  if (scenario.id === 'underfitting' || scenario.id === 'overfitting') {
    const sim = simulatePolynomialExperiment({
      degree: val,
      ridgeLambda: isFixed ? 0.1 : 0,
      noise: 0.45,
      trainCount: scenario.id === 'overfitting' ? 11 : 14,
    });
    const svgW = 680;
    const svgH = 250;
    const pad = { l: 42, r: 20, t: 22, b: 30 };
    const mapX = (x) => pad.l + ((x + 2.1) / 4.2) * (svgW - pad.l - pad.r);
    const yMin = -2.4;
    const yMax = 2.4;
    const mapY = (y) => {
      const clamped = Math.max(yMin, Math.min(yMax, y));
      return svgH - pad.b - ((clamped - yMin) / (yMax - yMin)) * (svgH - pad.t - pad.b);
    };

    const truthPath = sim.curveGrid
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(p.truth).toFixed(1)}`)
      .join(' ');
    const predPath = sim.curveGrid
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(p.pred).toFixed(1)}`)
      .join(' ');

    const isBrokenState =
      scenario.id === 'underfitting' ? sim.trainMse > 0.35 : sim.generalizationGap > 0.25;

    return (
      <div className="bi-visual-wrap">
        <div className="bi-svg-frame">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="bi-svg">
            <path d={truthPath} fill="none" stroke="rgba(226,232,240,0.45)" strokeWidth="1.8" strokeDasharray="5 4" />
            <path d={predPath} fill="none" stroke={isBrokenState ? '#ef4444' : '#10b981'} strokeWidth="2.8" />
            {sim.trainPoints.map((pt) => (
              <circle key={`tr-${pt.id}`} cx={mapX(pt.x)} cy={mapY(pt.y)} r="4" fill="#06b6d4" />
            ))}
            {sim.testPoints
              .filter((_, idx) => idx % 3 === 0)
              .map((pt) => (
                <circle
                  key={`te-${pt.id}`}
                  cx={mapX(pt.x)}
                  cy={mapY(pt.y)}
                  r="3"
                  fill="#f59e0b"
                  fillOpacity="0.65"
                />
              ))}
          </svg>
        </div>

        <div className="bi-metrics-grid">
          <div className="bi-metric-card">
            <span>Polynomial Degree</span>
            <strong>Degree {sim.degree}</strong>
          </div>
          <div className="bi-metric-card">
            <span>Train MSE</span>
            <strong style={{ color: '#06b6d4' }}>{sim.trainMse.toFixed(4)}</strong>
          </div>
          <div className="bi-metric-card">
            <span>Test MSE</span>
            <strong style={{ color: sim.testMse > 0.45 ? '#ef4444' : '#10b981' }}>
              {sim.testMse.toFixed(4)}
            </strong>
          </div>
          <div className="bi-metric-card">
            <span>Weight Norm ||w||₂</span>
            <strong>{sim.l2Norm.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    );
  }

  if (scenario.id === 'bad-scaling' || scenario.id === 'wrong-k') {
    const sim = simulateKnnBoundary({
      k: scenario.id === 'wrong-k' ? val : 5,
      scaleFactor: scenario.id === 'bad-scaling' ? val : 1,
      noise: 0.28,
    });
    const size = 280;
    const cellW = size / sim.gridN;
    const mapCoord = (v) => ((v - sim.minC) / (sim.maxC - sim.minC)) * size;
    const mapYCoord = (v) => size - ((v - sim.minC) / (sim.maxC - sim.minC)) * size;

    return (
      <div className="bi-visual-wrap">
        <div className="bi-svg-frame bi-svg-frame--square">
          <svg viewBox={`0 0 ${size} ${size}`} className="bi-svg bi-svg--square">
            {sim.cells.map((c) => (
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
            {sim.train.map((pt) => (
              <circle
                key={pt.id}
                cx={mapCoord(pt.x1)}
                cy={mapYCoord(pt.x2)}
                r="3.6"
                fill={pt.label === 1 ? '#f472b6' : '#22d3ee'}
                stroke="#070b15"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>

        <div className="bi-metrics-grid">
          <div className="bi-metric-card">
            <span>Train Accuracy</span>
            <strong>{sim.trainAccuracy.toFixed(1)}%</strong>
          </div>
          <div className="bi-metric-card">
            <span>Test Accuracy</span>
            <strong style={{ color: sim.testAccuracy < 75 ? '#ef4444' : '#10b981' }}>
              {sim.testAccuracy.toFixed(1)}%
            </strong>
          </div>
          <div className="bi-metric-card">
            <span>Boundary Transitions</span>
            <strong>{sim.boundaryFlips}</strong>
          </div>
          <div className="bi-metric-card">
            <span>Active Setting</span>
            <strong>
              {scenario.id === 'bad-scaling' ? `x₂ × ${sim.scaleFactor}` : `K = ${sim.k}`}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  if (scenario.id === 'class-imbalance') {
    const sim = simulateClassImbalance({ minorityPct: val, balancedWeight: isFixed });

    return (
      <div className="bi-visual-wrap">
        <div className="bi-confusion-layout">
          <div className="bi-cm-grid">
            <div className="bi-cm-cell bi-cm-cell--good">
              <span>True Negatives (TN)</span>
              <strong>{sim.tn}</strong>
            </div>
            <div className="bi-cm-cell bi-cm-cell--warn">
              <span>False Positives (FP)</span>
              <strong>{sim.fp}</strong>
            </div>
            <div className="bi-cm-cell bi-cm-cell--bad">
              <span>False Negatives (FN)</span>
              <strong>{sim.fn}</strong>
            </div>
            <div className="bi-cm-cell bi-cm-cell--good">
              <span>True Positives (TP)</span>
              <strong>{sim.tp}</strong>
            </div>
          </div>

          <div className="bi-bars-stack">
            <div className="bi-bar-item">
              <div className="bi-bar-item__head">
                <span>Raw Accuracy (Misleading when skewed)</span>
                <strong>{sim.accuracy.toFixed(1)}%</strong>
              </div>
              <div className="bi-bar-track">
                <div className="bi-bar-fill bi-bar-fill--blue" style={{ width: `${sim.accuracy}%` }} />
              </div>
            </div>
            <div className="bi-bar-item">
              <div className="bi-bar-item__head">
                <span>Minority Recall (Sensitivity)</span>
                <strong style={{ color: sim.recall < 30 ? '#ef4444' : '#10b981' }}>
                  {sim.recall.toFixed(1)}%
                </strong>
              </div>
              <div className="bi-bar-track">
                <div
                  className={`bi-bar-fill ${sim.recall < 30 ? 'bi-bar-fill--red' : 'bi-bar-fill--green'}`}
                  style={{ width: `${Math.max(2, sim.recall)}%` }}
                />
              </div>
            </div>
            <div className="bi-bar-item">
              <div className="bi-bar-item__head">
                <span>F1 Score</span>
                <strong style={{ color: sim.f1 < 30 ? '#ef4444' : '#10b981' }}>
                  {sim.f1.toFixed(1)}%
                </strong>
              </div>
              <div className="bi-bar-track">
                <div
                  className={`bi-bar-fill ${sim.f1 < 30 ? 'bi-bar-fill--red' : 'bi-bar-fill--green'}`}
                  style={{ width: `${Math.max(2, sim.f1)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bi-metrics-grid">
          <div className="bi-metric-card">
            <span>Minority Share</span>
            <strong>{sim.minorityPct}% ({sim.positives}/{sim.total})</strong>
          </div>
          <div className="bi-metric-card">
            <span>Class Weighting</span>
            <strong style={{ color: sim.balancedWeight ? '#10b981' : '#ef4444' }}>
              {sim.balancedWeight ? 'Balanced ON' : 'OFF (Naive)'}
            </strong>
          </div>
          <div className="bi-metric-card">
            <span>Balanced Accuracy</span>
            <strong>{sim.balancedAccuracy.toFixed(1)}%</strong>
          </div>
          <div className="bi-metric-card">
            <span>Precision</span>
            <strong>{sim.precision.toFixed(1)}%</strong>
          </div>
        </div>
      </div>
    );
  }

  if (scenario.id === 'data-leakage') {
    const sim = simulateDataLeakage({ leakagePct: val });

    return (
      <div className="bi-visual-wrap">
        <div className="bi-bars-stack">
          <div className="bi-bar-item">
            <div className="bi-bar-item__head">
              <span>Offline Validation Accuracy (Pre-Split Pipeline)</span>
              <strong style={{ color: '#06b6d4' }}>{sim.validationAccuracy.toFixed(1)}%</strong>
            </div>
            <div className="bi-bar-track">
              <div className="bi-bar-fill bi-bar-fill--blue" style={{ width: `${sim.validationAccuracy}%` }} />
            </div>
          </div>

          <div className="bi-bar-item">
            <div className="bi-bar-item__head">
              <span>Real Production Deployment Accuracy (Unseen Stream)</span>
              <strong style={{ color: sim.deploymentGap > 10 ? '#ef4444' : '#10b981' }}>
                {sim.productionAccuracy.toFixed(1)}%
              </strong>
            </div>
            <div className="bi-bar-track">
              <div
                className={`bi-bar-fill ${sim.deploymentGap > 10 ? 'bi-bar-fill--red' : 'bi-bar-fill--green'}`}
                style={{ width: `${sim.productionAccuracy}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bi-metrics-grid">
          <div className="bi-metric-card">
            <span>Leakage Strength</span>
            <strong>{sim.leakagePct}%</strong>
          </div>
          <div className="bi-metric-card">
            <span>Deployment Drop Gap</span>
            <strong style={{ color: sim.deploymentGap > 10 ? '#ef4444' : '#10b981' }}>
              −{sim.deploymentGap.toFixed(1)}%
            </strong>
          </div>
          <div className="bi-metric-card">
            <span>Leaked Proxy Reliance</span>
            <strong style={{ color: '#f59e0b' }}>{sim.proxyImportancePct.toFixed(1)}%</strong>
          </div>
          <div className="bi-metric-card">
            <span>Genuine Signal Reliance</span>
            <strong style={{ color: '#10b981' }}>{sim.genuineImportancePct.toFixed(1)}%</strong>
          </div>
        </div>
      </div>
    );
  }

  // vanishing-gradients & exploding-gradients
  const isVanishing = scenario.id === 'vanishing-gradients';
  const sim = simulateLayerGradients({
    layers: 8,
    weightScale: val,
    activationId: isVanishing ? (isFixed ? 'relu' : 'sigmoid') : 'relu',
    clipThreshold: !isVanishing && isFixed ? 1.0 : 0,
  });

  const maxLog = Math.max(
    1.5,
    ...sim.layerNorms.map((l) => Math.log10(Math.max(1e-5, l.clippedNorm) + 1))
  );

  return (
    <div className="bi-visual-wrap">
      <div className="bi-layers-chart">
        {sim.layerNorms.map((ln) => {
          const barPct = Math.max(
            4,
            (Math.log10(Math.max(1e-5, ln.clippedNorm) + 1) / maxLog) * 100
          );
          const barCol =
            ln.clippedNorm < 0.02
              ? '#ef4444'
              : ln.clippedNorm > 15
              ? '#f59e0b'
              : '#10b981';

          return (
            <div key={ln.layer} className="bi-layer-col">
              <span className="bi-layer-val" style={{ color: barCol }}>
                {ln.clippedNorm < 0.001
                  ? ln.clippedNorm.toExponential(1)
                  : ln.clippedNorm > 99
                  ? ln.clippedNorm.toFixed(0)
                  : ln.clippedNorm.toFixed(3)}
              </span>
              <div className="bi-layer-bar-track">
                <div
                  className="bi-layer-bar-fill"
                  style={{ height: `${barPct}%`, background: barCol }}
                />
              </div>
              <span className="bi-layer-label">L{ln.layer}</span>
            </div>
          );
        })}
      </div>

      <div className="bi-metrics-grid">
        <div className="bi-metric-card">
          <span>Activation / Clip</span>
          <strong>
            {sim.activationId.toUpperCase()} {sim.clipThreshold > 0 ? `(Clip ${sim.clipThreshold})` : ''}
          </strong>
        </div>
        <div className="bi-metric-card">
          <span>Layer 1 Gradient</span>
          <strong style={{ color: sim.regime === 'Healthy Flow' ? '#10b981' : '#ef4444' }}>
            {sim.layer1Norm < 0.001 ? sim.layer1Norm.toExponential(2) : sim.layer1Norm.toFixed(4)}
          </strong>
        </div>
        <div className="bi-metric-card">
          <span>Layer 8 Gradient</span>
          <strong>{sim.layerEndNorm.toFixed(3)}</strong>
        </div>
        <div className="bi-metric-card">
          <span>Flow Regime</span>
          <strong style={{ color: sim.regime === 'Healthy Flow' ? '#10b981' : '#ef4444' }}>
            {sim.regime}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default function BreakItLab() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const scenarioParam = searchParams.get('scenario') || BREAK_IT_SCENARIOS[0].id;
  const activeScenario = useMemo(
    () => getBreakItScenarioById(scenarioParam),
    [scenarioParam]
  );

  const [overrides, setOverrides] = useState({});

  const activeState = overrides[activeScenario.id] || {
    isFixed: false,
    value: activeScenario.slider.brokenValue,
  };

  const selectScenario = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('scenario', id);
    setSearchParams(next, { replace: true });
  };

  const updateActiveState = (patch) => {
    setOverrides((prev) => ({
      ...prev,
      [activeScenario.id]: {
        ...(prev[activeScenario.id] || {
          isFixed: false,
          value: activeScenario.slider.brokenValue,
        }),
        ...patch,
      },
    }));
  };

  const handleBreakIt = () => {
    updateActiveState({
      isFixed: false,
      value: activeScenario.slider.brokenValue,
    });
  };

  const handleApplyFix = () => {
    updateActiveState({
      isFixed: true,
      value: activeScenario.slider.fixedValue,
    });
  };

  const handleReset = () => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[activeScenario.id];
      return next;
    });
  };

  return (
    <div className="bi-page fade-in">
      <header className="bi-header">
        <div>
          <div className="bi-header__eyebrow">
            <Hammer size={14} />
            <span>Phase 6 · Break-It Mode</span>
          </div>
          <h1 className="bi-header__title">Break Machine Learning Models on Purpose</h1>
          <p className="bi-header__subtitle">
            Trigger 9 classic ML failure modes, observe the live mathematical breakdown, and apply
            principled fixes to see how each safeguard restores performance.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={HelpCircle}
          onClick={() => navigate('/what-if')}
        >
          Open What-If Studio
        </Button>
      </header>

      <div className="bi-layout">
        {/* Scenario Picker List */}
        <aside className="bi-sidebar" aria-label="Break-It scenarios">
          {BREAK_IT_SCENARIOS.map((sc, idx) => {
            const isActive = sc.id === activeScenario.id;
            const scState = overrides[sc.id];
            return (
              <button
                key={sc.id}
                type="button"
                className={`bi-scenario-btn ${isActive ? 'bi-scenario-btn--active' : ''}`}
                onClick={() => selectScenario(sc.id)}
              >
                <div className="bi-scenario-btn__top">
                  <span className="bi-scenario-num">0{idx + 1}</span>
                  <span className="bi-scenario-cat">{sc.category}</span>
                  {scState?.isFixed && <CheckCircle2 size={14} className="bi-fixed-dot" />}
                </div>
                <span className="bi-scenario-title">{sc.title}</span>
              </button>
            );
          })}
        </aside>

        {/* Active Scenario Lab Stage */}
        <section className="bi-stage">
          <Card hoverable={false} className="bi-stage-card">
            <div className="bi-stage-card__head">
              <div>
                <div className="bi-stage-badges">
                  <Badge text={activeScenario.category} color="#ef4444" size="md" />
                  <Badge
                    text={activeState.isFixed ? 'Fixed Mode' : 'Broken Mode'}
                    color={activeState.isFixed ? '#10b981' : '#ef4444'}
                    size="md"
                  />
                </div>
                <h2 className="bi-stage-title">{activeScenario.title}</h2>
                <p className="bi-stage-tagline">{activeScenario.tagline}</p>
              </div>

              {activeScenario.conceptId && (
                <Button
                  variant="secondary"
                  icon={ExternalLink}
                  onClick={() => navigate(`/concept/${activeScenario.conceptId}`)}
                >
                  Open Concept Page
                </Button>
              )}
            </div>

            {/* Interactive Break It / Apply Fix / Parameter Slider */}
            <div className="bi-controls-bar">
              <div className="bi-action-btns">
                <button
                  type="button"
                  className={`bi-mode-btn ${!activeState.isFixed ? 'bi-mode-btn--broken' : ''}`}
                  onClick={handleBreakIt}
                >
                  <Hammer size={15} /> Break It
                </button>
                <button
                  type="button"
                  className={`bi-mode-btn ${activeState.isFixed ? 'bi-mode-btn--fixed' : ''}`}
                  onClick={handleApplyFix}
                >
                  <Wrench size={15} /> Apply Fix
                </button>
                <button
                  type="button"
                  className="bi-mode-btn"
                  onClick={handleReset}
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>

              <div className="bi-slider-group">
                <div className="bi-slider-header">
                  <span>{activeScenario.slider.label}</span>
                  <strong>{activeScenario.slider.format(activeState.value)}</strong>
                </div>
                <input
                  type="range"
                  min={activeScenario.slider.min}
                  max={activeScenario.slider.max}
                  step={activeScenario.slider.step}
                  value={activeState.value}
                  onChange={(e) => updateActiveState({ value: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* Scenario Live Visualization */}
            {renderScenarioVisual(activeScenario, activeState)}
          </Card>

          {/* 4 Mandatory Diagnostic Sections */}
          <div className="bi-diagnostics-grid">
            <Card hoverable={false} className="bi-diag-card bi-diag-card--what">
              <div className="bi-diag-card__head">
                <AlertTriangle size={16} />
                <h3>What happened?</h3>
              </div>
              <p>{activeScenario.diagnostics.whatHappened}</p>
            </Card>

            <Card hoverable={false} className="bi-diag-card bi-diag-card--why">
              <div className="bi-diag-card__head">
                <HelpCircle size={16} />
                <h3>Why did it happen?</h3>
              </div>
              <p>{activeScenario.diagnostics.whyItHappened}</p>
            </Card>

            <Card hoverable={false} className="bi-diag-card bi-diag-card--math">
              <div className="bi-diag-card__head">
                <Hammer size={16} />
                <h3>What does the mathematics say?</h3>
              </div>
              <p>{activeScenario.diagnostics.mathematics}</p>
            </Card>

            <Card hoverable={false} className="bi-diag-card bi-diag-card--fix">
              <div className="bi-diag-card__head">
                <ShieldCheck size={16} />
                <h3>How do we fix it?</h3>
              </div>
              <p>{activeScenario.diagnostics.howToFix}</p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
