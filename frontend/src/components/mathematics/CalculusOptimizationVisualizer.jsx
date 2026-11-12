import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import {
  CALCULUS_FUNCTIONS,
  DESCENT_LANDSCAPES,
  GRADIENT_LANDSCAPES,
  computeSecantTangent,
  evaluateGradientField,
  evaluateLossCurves,
  evaluateSingleLossPoint,
  stepGradientDescent,
} from '../../utils/mathEngine';
import PlotlyChart from './PlotlyChart';

function DerivativeSecantViz() {
  const [fnId, setFnId] = useState('x2');
  const [x, setX] = useState(1.4);
  const [dx, setDx] = useState(1.2);

  const res = useMemo(() => computeSecantTangent(fnId, x, dx), [fnId, x, dx]);

  const [dMin, dMax] = res.fn.domain;
  const [yMin, yMax] = res.fn.yRange;

  const curveX = [];
  const curveY = [];
  for (let i = 0; i <= 100; i += 1) {
    const px = dMin + (i / 100) * (dMax - dMin);
    curveX.push(px);
    curveY.push(res.fn.f(px));
  }

  const lineSpan = (dMax - dMin) * 0.45;
  const tanX = [x - lineSpan, x + lineSpan];
  const tanY = tanX.map((tx) => res.y + res.tangentSlope * (tx - x));

  const secX = [x - lineSpan * 0.6, x + res.dx + lineSpan * 0.6];
  const secY = secX.map((sx) => res.y + res.secantSlope * (sx - x));

  const plotData = [
    {
      type: 'scatter',
      mode: 'lines',
      name: res.fn.formula,
      x: curveX,
      y: curveY,
      line: { color: '#06b6d4', width: 2.8 },
    },
    {
      type: 'scatter',
      mode: 'lines',
      name: `Exact Tangent (f'=${res.tangentSlope.toFixed(2)})`,
      x: tanX,
      y: tanY,
      line: { color: '#10b981', width: 2, dash: 'dash' },
    },
    {
      type: 'scatter',
      mode: 'lines',
      name: `Secant (slope=${res.secantSlope.toFixed(2)})`,
      x: secX,
      y: secY,
      line: { color: '#f59e0b', width: 2.2 },
    },
    {
      type: 'scatter',
      mode: 'markers',
      name: 'x & x+Δx',
      x: [res.x, res.x2],
      y: [res.y, res.y2],
      marker: {
        color: ['#10b981', '#f59e0b'],
        size: [10, 9],
        line: { color: '#070b15', width: 1.5 },
      },
    },
  ];

  return (
    <div className="math-viz-block">
      <div className="math-controls-row">
        <div className="math-preset-row">
          {Object.values(CALCULUS_FUNCTIONS).map((fn) => (
            <button
              key={fn.id}
              type="button"
              className={`math-chip-btn ${fnId === fn.id ? 'math-chip-btn--active' : ''}`}
              onClick={() => {
                setFnId(fn.id);
                setX(fn.id === 'cubic' ? 0.6 : 1.2);
              }}
            >
              {fn.label}
            </button>
          ))}
        </div>

        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Position (x)</span>
            <strong>{x.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min={dMin + 0.4}
            max={dMax - 0.6}
            step="0.05"
            value={x}
            onChange={(e) => setX(parseFloat(e.target.value))}
          />
        </div>

        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Step Δx</span>
            <strong>{dx.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="0.02"
            max="2.0"
            step="0.02"
            value={dx}
            onChange={(e) => setDx(parseFloat(e.target.value))}
          />
        </div>

        <button
          type="button"
          className="math-chip-btn math-chip-btn--reset"
          onClick={() => {
            setFnId('x2');
            setX(1.4);
            setDx(1.2);
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <PlotlyChart
        data={plotData}
        layout={{
          xaxis: { title: { text: 'x' }, range: [dMin, dMax] },
          yaxis: { title: { text: 'f(x)' }, range: [yMin, yMax] },
        }}
        height={330}
      />

      <div className="math-metrics-grid">
        <div className="math-metric-card">
          <span>Secant Slope (Δf / Δx)</span>
          <strong style={{ color: '#f59e0b' }}>{res.secantSlope.toFixed(4)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Exact Derivative f&apos;(x)</span>
          <strong style={{ color: '#10b981' }}>{res.tangentSlope.toFixed(4)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Approximation Error</span>
          <strong>{res.error.toFixed(4)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Derivative Rule</span>
          <strong style={{ fontSize: '0.84rem', color: '#06b6d4' }}>
            {res.fn.derivativeFormula}
          </strong>
        </div>
      </div>
    </div>
  );
}

function GradientContourViz() {
  const [landscapeId, setLandscapeId] = useState('bowl');
  const [probeX, setProbeX] = useState(1.4);
  const [probeY, setProbeY] = useState(-1.1);

  const field = useMemo(
    () => evaluateGradientField(landscapeId, probeX, probeY),
    [landscapeId, probeX, probeY]
  );

  // Scale gradient arrow cleanly inside [-3, 3] plot bounds
  const rawMag = field.probe.magnitude;
  const arrowScale = rawMag > 1e-6 ? Math.min(1.2, rawMag * 0.32) / rawMag : 0;
  const tipX = probeX + field.probe.gx * arrowScale;
  const tipY = probeY + field.probe.gy * arrowScale;

  const plotData = [
    {
      type: 'contour',
      x: field.axis,
      y: field.axis,
      z: field.zMatrix,
      colorscale: [
        [0, '#091124'],
        [0.35, '#1d4ed8'],
        [0.7, '#06b6d4'],
        [1, '#f43f5e'],
      ],
      contours: { coloring: 'heatmap', showlabels: true, labelfont: { color: '#cbd5e1', size: 10 } },
      colorbar: {
        title: { text: 'f(x,y)', font: { color: '#cbd5e1' } },
        tickfont: { color: '#94a3b8' },
      },
    },
    {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Gradient ∇f',
      x: [probeX, tipX],
      y: [probeY, tipY],
      line: { color: '#fde047', width: 3.5 },
      marker: { color: ['#ffffff', '#fde047'], size: [10, 7] },
    },
  ];

  const layout = {
    xaxis: { title: { text: 'x' }, range: [-3, 3] },
    yaxis: { title: { text: 'y' }, range: [-3, 3], scaleanchor: 'x' },
    annotations:
      rawMag > 0.05
        ? [
            {
              x: tipX,
              y: tipY,
              ax: probeX,
              ay: probeY,
              xref: 'x',
              yref: 'y',
              axref: 'x',
              ayref: 'y',
              showarrow: true,
              arrowhead: 3,
              arrowsize: 1.3,
              arrowwidth: 2.5,
              arrowcolor: '#fde047',
            },
          ]
        : [],
  };

  return (
    <div className="math-viz-block">
      <div className="math-controls-row">
        <div className="math-preset-row">
          {Object.values(GRADIENT_LANDSCAPES).map((spec) => (
            <button
              key={spec.id}
              type="button"
              className={`math-chip-btn ${landscapeId === spec.id ? 'math-chip-btn--active' : ''}`}
              onClick={() => setLandscapeId(spec.id)}
            >
              {spec.label}
            </button>
          ))}
        </div>

        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Probe x</span>
            <strong>{probeX.toFixed(1)}</strong>
          </div>
          <input
            type="range"
            min="-2.6"
            max="2.6"
            step="0.1"
            value={probeX}
            onChange={(e) => setProbeX(parseFloat(e.target.value))}
          />
        </div>

        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Probe y</span>
            <strong>{probeY.toFixed(1)}</strong>
          </div>
          <input
            type="range"
            min="-2.6"
            max="2.6"
            step="0.1"
            value={probeY}
            onChange={(e) => setProbeY(parseFloat(e.target.value))}
          />
        </div>

        <button
          type="button"
          className="math-chip-btn math-chip-btn--reset"
          onClick={() => {
            setLandscapeId('bowl');
            setProbeX(1.4);
            setProbeY(-1.1);
          }}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <PlotlyChart data={plotData} layout={layout} height={350} />

      <div className="math-metrics-grid">
        <div className="math-metric-card">
          <span>Elevation f(x, y)</span>
          <strong>{field.probe.value.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>∂f / ∂x</span>
          <strong style={{ color: '#06b6d4' }}>{field.probe.gx.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>∂f / ∂y</span>
          <strong style={{ color: '#ec4899' }}>{field.probe.gy.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Steepness ||∇f||</span>
          <strong style={{ color: '#fde047' }}>{field.probe.magnitude.toFixed(3)}</strong>
        </div>
      </div>
    </div>
  );
}

function createInitialDescentHistory(landscapeId, x0) {
  const spec = DESCENT_LANDSCAPES[landscapeId] || DESCENT_LANDSCAPES.convex;
  return [{ step: 0, x: x0, loss: spec.f(x0), grad: spec.df(x0), diverged: false }];
}

function GradientDescentViz() {
  const [landscapeId, setLandscapeId] = useState('convex');
  const [alpha, setAlpha] = useState(0.2);
  const [x0, setX0] = useState(-3.2);
  const [history, setHistory] = useState(() => createInitialDescentHistory('convex', -3.2));
  const [isRunning, setIsRunning] = useState(false);

  const spec = DESCENT_LANDSCAPES[landscapeId] || DESCENT_LANDSCAPES.convex;
  const current = history[history.length - 1];
  const hasConverged = Math.abs(current.grad) < 0.008;
  const hasStopped = hasConverged || current.diverged || history.length >= 40;
  const effectivelyRunning = isRunning && !hasStopped;

  useEffect(() => {
    if (!effectivelyRunning) return undefined;

    const timer = setInterval(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        if (!last || Math.abs(last.grad) < 0.008 || last.diverged || prev.length >= 40) {
          return prev;
        }
        return stepGradientDescent(landscapeId, prev, alpha);
      });
    }, 240);

    return () => clearInterval(timer);
  }, [effectivelyRunning, landscapeId, alpha]);

  const handleReset = (nextLandscape = landscapeId, nextX0 = x0) => {
    setIsRunning(false);
    setHistory(createInitialDescentHistory(nextLandscape, nextX0));
  };

  const handleLandscapeSelect = (id) => {
    const nextSpec = DESCENT_LANDSCAPES[id];
    setLandscapeId(id);
    setX0(nextSpec.defaultX0);
    handleReset(id, nextSpec.defaultX0);
  };

  const [dMin, dMax] = spec.domain;
  const curveX = [];
  const curveY = [];
  for (let i = 0; i <= 100; i += 1) {
    const cx = dMin + (i / 100) * (dMax - dMin);
    curveX.push(cx);
    curveY.push(spec.f(cx));
  }

  const landscapeData = [
    {
      type: 'scatter',
      mode: 'lines',
      name: spec.formula,
      x: curveX,
      y: curveY,
      line: { color: '#3b82f6', width: 2.5 },
    },
    {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'GD Trajectory',
      x: history.map((h) => h.x),
      y: history.map((h) => h.loss),
      line: { color: '#f59e0b', width: 1.8, dash: 'dot' },
      marker: {
        color: history.map((_, idx) => (idx === history.length - 1 ? '#10b981' : '#f59e0b')),
        size: history.map((_, idx) => (idx === history.length - 1 ? 12 : 7)),
      },
    },
  ];

  const lossCurveData = [
    {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Loss J(θ)',
      x: history.map((h) => h.step),
      y: history.map((h) => h.loss),
      line: { color: current.diverged ? '#ef4444' : '#06b6d4', width: 2.4 },
      marker: { size: 6 },
    },
  ];

  return (
    <div className="math-viz-block">
      <div className="math-controls-row">
        <div className="math-preset-row">
          {Object.values(DESCENT_LANDSCAPES).map((ls) => (
            <button
              key={ls.id}
              type="button"
              className={`math-chip-btn ${landscapeId === ls.id ? 'math-chip-btn--active' : ''}`}
              onClick={() => handleLandscapeSelect(ls.id)}
            >
              {ls.label}
            </button>
          ))}
        </div>

        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Learning Rate (α)</span>
            <strong>{alpha.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="0.02"
            max="1.15"
            step="0.02"
            value={alpha}
            onChange={(e) => setAlpha(parseFloat(e.target.value))}
          />
        </div>

        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Start x₀</span>
            <strong>{x0.toFixed(1)}</strong>
          </div>
          <input
            type="range"
            min={dMin + 0.2}
            max={dMax - 0.2}
            step="0.1"
            value={x0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setX0(val);
              handleReset(landscapeId, val);
            }}
          />
        </div>

        <div className="math-preset-row">
          <button
            type="button"
            className="math-chip-btn math-chip-btn--primary"
            disabled={hasStopped}
            onClick={() => setHistory((prev) => stepGradientDescent(landscapeId, prev, alpha))}
          >
            <StepForward size={14} /> Step
          </button>
          <button
            type="button"
            className={`math-chip-btn ${effectivelyRunning ? 'math-chip-btn--active' : ''}`}
            disabled={hasStopped && !effectivelyRunning}
            onClick={() => setIsRunning(!effectivelyRunning)}
          >
            {effectivelyRunning ? <Pause size={14} /> : <Play size={14} />}
            {effectivelyRunning ? 'Pause' : 'Run'}
          </button>
          <button
            type="button"
            className="math-chip-btn math-chip-btn--reset"
            onClick={() => handleReset()}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      <div className="math-dual-charts">
        <PlotlyChart
          data={landscapeData}
          layout={{
            title: { text: 'Parameter Landscape & Path', font: { color: '#e2e8f0', size: 13 } },
            xaxis: { title: { text: 'Parameter θ' }, range: [dMin - 0.5, dMax + 0.5] },
            yaxis: { title: { text: 'J(θ)' } },
          }}
          height={300}
        />
        <PlotlyChart
          data={lossCurveData}
          layout={{
            title: { text: 'Loss per Iteration', font: { color: '#e2e8f0', size: 13 } },
            xaxis: { title: { text: 'Iteration Step' } },
            yaxis: { title: { text: 'Loss J(θ)' } },
          }}
          height={300}
        />
      </div>

      <div className="math-metrics-grid">
        <div className="math-metric-card">
          <span>Step</span>
          <strong>{current.step}</strong>
        </div>
        <div className="math-metric-card">
          <span>Current θ</span>
          <strong style={{ color: '#06b6d4' }}>{current.x.toFixed(4)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Current Loss J(θ)</span>
          <strong>{current.loss.toFixed(4)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Status</span>
          <strong
            style={{
              color: current.diverged
                ? '#ef4444'
                : hasConverged
                ? '#10b981'
                : '#f59e0b',
              fontSize: '0.85rem',
            }}
          >
            {current.diverged
              ? 'Diverged! (α too high)'
              : hasConverged
              ? 'Converged to Minimum'
              : 'Descending...'}
          </strong>
        </div>
      </div>
    </div>
  );
}

function LossFunctionsViz() {
  const [errorVal, setErrorVal] = useState(1.4);
  const [huberDelta, setHuberDelta] = useState(1.0);
  const [probVal, setProbVal] = useState(0.72);
  const [bceTarget, setBceTarget] = useState(1);

  const curves = useMemo(
    () => evaluateLossCurves(huberDelta, bceTarget),
    [huberDelta, bceTarget]
  );

  const point = useMemo(
    () => evaluateSingleLossPoint(errorVal, huberDelta, probVal, bceTarget),
    [errorVal, huberDelta, probVal, bceTarget]
  );

  const regLossData = [
    { type: 'scatter', mode: 'lines', name: 'MSE (e²)', x: curves.errors, y: curves.mseLoss, line: { color: '#ef4444', width: 2.2 } },
    { type: 'scatter', mode: 'lines', name: 'MAE (|e|)', x: curves.errors, y: curves.maeLoss, line: { color: '#06b6d4', width: 2.2 } },
    { type: 'scatter', mode: 'lines', name: `Huber (δ=${huberDelta.toFixed(1)})`, x: curves.errors, y: curves.huberLoss, line: { color: '#10b981', width: 2.2 } },
    {
      type: 'scatter',
      mode: 'markers',
      name: 'Current e',
      x: [errorVal, errorVal, errorVal],
      y: [point.mse, point.mae, point.huber],
      marker: { color: ['#ef4444', '#06b6d4', '#10b981'], size: 9 },
      showlegend: false,
    },
  ];

  const regGradData = [
    { type: 'scatter', mode: 'lines', name: 'd(MSE)/de = 2e', x: curves.errors, y: curves.mseGrad, line: { color: '#ef4444', width: 2.2 } },
    { type: 'scatter', mode: 'lines', name: 'd(MAE)/de = ±1', x: curves.errors, y: curves.maeGrad, line: { color: '#06b6d4', width: 2.2 } },
    { type: 'scatter', mode: 'lines', name: 'd(Huber)/de', x: curves.errors, y: curves.huberGrad, line: { color: '#10b981', width: 2.2 } },
  ];

  const bceData = [
    {
      type: 'scatter',
      mode: 'lines',
      name: `BCE Loss (y=${bceTarget})`,
      x: curves.probs,
      y: curves.bceLoss,
      line: { color: '#8b5cf6', width: 2.5 },
    },
    {
      type: 'scatter',
      mode: 'markers',
      name: 'Current ŷ',
      x: [probVal],
      y: [point.bce],
      marker: { color: '#f59e0b', size: 10 },
    },
  ];

  return (
    <div className="math-viz-block">
      <div className="math-controls-row">
        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Regression Error (e = y − ŷ)</span>
            <strong>{errorVal.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="-2.8"
            max="2.8"
            step="0.05"
            value={errorVal}
            onChange={(e) => setErrorVal(parseFloat(e.target.value))}
          />
        </div>

        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Huber Threshold (δ)</span>
            <strong>{huberDelta.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="0.3"
            max="2.5"
            step="0.1"
            value={huberDelta}
            onChange={(e) => setHuberDelta(parseFloat(e.target.value))}
          />
        </div>

        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>BCE Probability (ŷ)</span>
            <strong>{probVal.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="0.02"
            max="0.98"
            step="0.02"
            value={probVal}
            onChange={(e) => setProbVal(parseFloat(e.target.value))}
          />
        </div>

        <div className="math-preset-row">
          <button
            type="button"
            className={`math-chip-btn ${bceTarget === 1 ? 'math-chip-btn--active' : ''}`}
            onClick={() => setBceTarget(1)}
          >
            Target y = 1
          </button>
          <button
            type="button"
            className={`math-chip-btn ${bceTarget === 0 ? 'math-chip-btn--active' : ''}`}
            onClick={() => setBceTarget(0)}
          >
            Target y = 0
          </button>
          <button
            type="button"
            className="math-chip-btn math-chip-btn--reset"
            onClick={() => {
              setErrorVal(1.4);
              setHuberDelta(1.0);
              setProbVal(0.72);
              setBceTarget(1);
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      <div className="math-dual-charts">
        <PlotlyChart
          data={regLossData}
          layout={{
            title: { text: 'Regression Loss Curves L(e)', font: { color: '#e2e8f0', size: 13 } },
            xaxis: { title: { text: 'Error e' } },
            yaxis: { title: { text: 'Loss' } },
          }}
          height={290}
        />
        <PlotlyChart
          data={regGradData}
          layout={{
            title: { text: 'Gradient Magnitude dL / de', font: { color: '#e2e8f0', size: 13 } },
            xaxis: { title: { text: 'Error e' } },
            yaxis: { title: { text: 'Gradient' } },
          }}
          height={290}
        />
      </div>

      <PlotlyChart
        data={bceData}
        layout={{
          title: { text: `Binary Cross-Entropy L(y=${bceTarget}, ŷ)`, font: { color: '#e2e8f0', size: 13 } },
          xaxis: { title: { text: 'Predicted Probability ŷ' }, range: [0, 1] },
          yaxis: { title: { text: 'BCE Loss' } },
        }}
        height={240}
      />

      <div className="math-metrics-grid">
        <div className="math-metric-card">
          <span>MSE Loss / Grad</span>
          <strong style={{ color: '#ef4444' }}>
            {point.mse.toFixed(2)} / {point.mseG.toFixed(2)}
          </strong>
        </div>
        <div className="math-metric-card">
          <span>MAE Loss / Grad</span>
          <strong style={{ color: '#06b6d4' }}>
            {point.mae.toFixed(2)} / {point.maeG.toFixed(2)}
          </strong>
        </div>
        <div className="math-metric-card">
          <span>Huber Loss / Grad</span>
          <strong style={{ color: '#10b981' }}>
            {point.huber.toFixed(2)} / {point.huberG.toFixed(2)}
          </strong>
        </div>
        <div className="math-metric-card">
          <span>BCE Loss / ∂L/∂ŷ</span>
          <strong style={{ color: '#8b5cf6' }}>
            {point.bce.toFixed(2)} / {point.bceG.toFixed(2)}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default function CalculusOptimizationVisualizer({ topicId }) {
  if (topicId === 'derivative') return <DerivativeSecantViz />;
  if (topicId === 'gradient') return <GradientContourViz />;
  if (topicId === 'gradient-descent') return <GradientDescentViz />;
  return <LossFunctionsViz />;
}
