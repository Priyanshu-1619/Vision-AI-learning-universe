import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  analyzeNormalDistribution,
  computeCorrelationStats,
  computeMeanAndMedian,
  computeVarianceBreakdown,
  generateCorrelatedDataset,
} from '../../utils/mathEngine';
import PlotlyChart from './PlotlyChart';

const BASE_MEAN_POINTS = [
  { id: 'p1', label: 'A', value: -2.0, weight: 1 },
  { id: 'p2', label: 'B', value: -0.5, weight: 1 },
  { id: 'p3', label: 'C', value: 0.5, weight: 1 },
  { id: 'p4', label: 'D', value: 1.5, weight: 1 },
  { id: 'p5', label: 'E', value: 2.0, weight: 1 },
];

const BASE_VARIANCE_POINTS = [-2.2, -0.8, 0.4, 1.4];

function MeanScaleViz() {
  const [outlierPos, setOutlierPos] = useState(4.5);
  const [outlierWeight, setOutlierWeight] = useState(1);

  const items = useMemo(
    () => [
      ...BASE_MEAN_POINTS,
      { id: 'outlier', label: 'Outlier', value: outlierPos, weight: outlierWeight, isOutlier: true },
    ],
    [outlierPos, outlierWeight]
  );

  const stats = useMemo(() => computeMeanAndMedian(items), [items]);

  const minX = -5;
  const maxX = 8;
  const svgW = 700;
  const svgH = 260;
  const padX = 48;
  const mapX = (val) => padX + ((val - minX) / (maxX - minX)) * (svgW - padX * 2);

  const beamY = 148;
  const fulcrumX = mapX(stats.mean);
  const medianX = mapX(stats.median);

  return (
    <div className="math-viz-block">
      <div className="math-controls-row">
        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Outlier Position (x₆)</span>
            <strong>{outlierPos.toFixed(1)}</strong>
          </div>
          <input
            type="range"
            min="-5"
            max="8"
            step="0.1"
            value={outlierPos}
            onChange={(e) => setOutlierPos(parseFloat(e.target.value))}
          />
        </div>

        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Outlier Weight (w₆)</span>
            <strong>{outlierWeight}×</strong>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={outlierWeight}
            onChange={(e) => setOutlierWeight(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="math-preset-row">
          <button
            type="button"
            className="math-chip-btn"
            onClick={() => {
              setOutlierPos(0.5);
              setOutlierWeight(1);
            }}
          >
            Balanced
          </button>
          <button
            type="button"
            className="math-chip-btn"
            onClick={() => {
              setOutlierPos(7.5);
              setOutlierWeight(2);
            }}
          >
            Extreme Pull
          </button>
          <button
            type="button"
            className="math-chip-btn math-chip-btn--reset"
            onClick={() => {
              setOutlierPos(4.5);
              setOutlierWeight(1);
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      <div className="math-svg-frame">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="math-svg">
          {/* Number line ticks */}
          <line x1={padX} y1={215} x2={svgW - padX} y2={215} stroke="#334155" strokeWidth="1.5" />
          {[-5, -3, -1, 0, 1, 3, 5, 7, 8].map((tick) => {
            const tx = mapX(tick);
            return (
              <g key={tick}>
                <line x1={tx} y1={210} x2={tx} y2={221} stroke="#64748b" strokeWidth="1.2" />
                <text x={tx} y={238} textAnchor="middle" className="math-axis-label">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Median reference dashed line */}
          <line
            x1={medianX}
            y1={50}
            x2={medianX}
            y2={215}
            stroke="#8b5cf6"
            strokeWidth="1.6"
            strokeDasharray="4 4"
          />
          <text x={medianX} y={40} textAnchor="middle" className="math-tag-purple">
            Median: {stats.median.toFixed(2)}
          </text>

          {/* Rigid Balance Beam */}
          <line
            x1={mapX(-4.8)}
            y1={beamY}
            x2={mapX(7.8)}
            y2={beamY}
            stroke="#94a3b8"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Fulcrum Triangle at exact Mean */}
          <polygon
            points={`${fulcrumX},${beamY + 3} ${fulcrumX - 16},${beamY + 34} ${fulcrumX + 16},${beamY + 34}`}
            fill="#06b6d4"
            fillOpacity="0.9"
          />
          <line
            x1={fulcrumX}
            y1={beamY + 34}
            x2={fulcrumX}
            y2={215}
            stroke="#06b6d4"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text x={fulcrumX} y={beamY + 52} textAnchor="middle" className="math-tag-cyan">
            Mean μ = {stats.mean.toFixed(2)}
          </text>

          {/* Weighted Data Blocks on the Beam */}
          {items.map((item) => {
            const x = mapX(item.value);
            const size = 18 + item.weight * 6;
            return (
              <g key={item.id}>
                <rect
                  x={x - size / 2}
                  y={beamY - 3 - size}
                  width={size}
                  height={size}
                  rx="5"
                  fill={item.isOutlier ? '#f59e0b' : '#3b82f6'}
                  fillOpacity={item.isOutlier ? '0.9' : '0.8'}
                  stroke={item.isOutlier ? '#fde68a' : '#93c5fd'}
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={beamY - 3 - size / 2 + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#060914"
                >
                  {item.weight > 1 ? `${item.weight}w` : item.value.toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="math-metrics-grid">
        <div className="math-metric-card">
          <span>Mean (Fulcrum μ)</span>
          <strong style={{ color: '#06b6d4' }}>{stats.mean.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Median (50th %ile)</span>
          <strong style={{ color: '#8b5cf6' }}>{stats.median.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Skew Gap (μ − Med)</span>
          <strong>{(stats.mean - stats.median).toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Left / Right Torque</span>
          <strong>
            {stats.leftTorque.toFixed(2)} = {stats.rightTorque.toFixed(2)}
          </strong>
        </div>
      </div>
    </div>
  );
}

function VarianceSquaresViz() {
  const [outlierPos, setOutlierPos] = useState(3.5);

  const values = useMemo(() => [...BASE_VARIANCE_POINTS, outlierPos], [outlierPos]);
  const stats = useMemo(() => computeVarianceBreakdown(values), [values]);

  const minX = -5;
  const maxX = 6;
  const svgW = 700;
  const svgH = 320;
  const padX = 52;
  const baselineY = 265;
  const scale = (svgW - padX * 2) / (maxX - minX);
  const mapX = (val) => padX + (val - minX) * scale;
  const meanX = mapX(stats.mean);

  const outlierSq = stats.squares[stats.squares.length - 1];
  const outlierShare =
    stats.sumSquaredDeviations > 1e-6
      ? (outlierSq.squared / stats.sumSquaredDeviations) * 100
      : 0;

  return (
    <div className="math-viz-block">
      <div className="math-controls-row">
        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Outlier Position (x₅)</span>
            <strong>{outlierPos.toFixed(1)}</strong>
          </div>
          <input
            type="range"
            min="-4.5"
            max="5.5"
            step="0.1"
            value={outlierPos}
            onChange={(e) => setOutlierPos(parseFloat(e.target.value))}
          />
        </div>

        <div className="math-preset-row">
          <button type="button" className="math-chip-btn" onClick={() => setOutlierPos(0.2)}>
            Tight Cluster
          </button>
          <button type="button" className="math-chip-btn" onClick={() => setOutlierPos(5.2)}>
            Far Outlier
          </button>
          <button
            type="button"
            className="math-chip-btn math-chip-btn--reset"
            onClick={() => setOutlierPos(3.5)}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      <div className="math-svg-frame">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="math-svg">
          {/* Baseline */}
          <line x1={padX} y1={baselineY} x2={svgW - padX} y2={baselineY} stroke="#334155" strokeWidth="1.5" />
          {[-4, -2, 0, 2, 4, 6].map((tick) => {
            const tx = mapX(tick);
            return (
              <g key={tick}>
                <line x1={tx} y1={baselineY - 4} x2={tx} y2={baselineY + 5} stroke="#64748b" />
                <text x={tx} y={baselineY + 20} textAnchor="middle" className="math-axis-label">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Physical Squares of side |xᵢ - μ| */}
          {stats.squares.map((sq, idx) => {
            const isOutlier = idx === stats.squares.length - 1;
            const px = mapX(sq.x);
            const sidePx = Math.abs(px - meanX);
            const leftX = Math.min(px, meanX);
            const cappedHeight = Math.min(sidePx, baselineY - 22);
            const color = isOutlier ? '#f59e0b' : '#06b6d4';

            return (
              <g key={sq.index}>
                <rect
                  x={leftX}
                  y={baselineY - cappedHeight}
                  width={Math.max(2, sidePx)}
                  height={Math.max(2, cappedHeight)}
                  fill={color}
                  fillOpacity={isOutlier ? '0.24' : '0.14'}
                  stroke={color}
                  strokeWidth={isOutlier ? '2' : '1.3'}
                />
                {sidePx > 34 && (
                  <text
                    x={leftX + sidePx / 2}
                    y={baselineY - cappedHeight / 2 + 4}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="600"
                    fill={color}
                  >
                    {sq.squared.toFixed(1)}
                  </text>
                )}
                <circle
                  cx={px}
                  cy={baselineY}
                  r={isOutlier ? 6.5 : 5}
                  fill={color}
                  stroke="#070b15"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Mean Line */}
          <line
            x1={meanX}
            y1={24}
            x2={meanX}
            y2={baselineY + 6}
            stroke="#e2e8f0"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <text x={meanX} y={16} textAnchor="middle" className="math-tag-cyan">
            μ = {stats.mean.toFixed(2)}
          </text>
        </svg>
      </div>

      <div className="math-metrics-grid">
        <div className="math-metric-card">
          <span>Mean (μ)</span>
          <strong>{stats.mean.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Variance (σ²)</span>
          <strong style={{ color: '#06b6d4' }}>{stats.variance.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Std Dev (σ)</span>
          <strong>{stats.stdDev.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Outlier Area Share</span>
          <strong style={{ color: '#f59e0b' }}>{outlierShare.toFixed(1)}%</strong>
        </div>
      </div>
    </div>
  );
}

function NormalDispersionViz() {
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1.2);

  const analysis = useMemo(() => analyzeNormalDistribution(mu, sigma, 80), [mu, sigma]);

  const svgW = 700;
  const svgH = 290;
  const padL = 44;
  const padR = 24;
  const padT = 28;
  const baseY = 225;
  const plotW = svgW - padL - padR;
  const plotH = baseY - padT;

  const mapX = (x) =>
    padL + ((x - analysis.xMin) / (analysis.xMax - analysis.xMin)) * plotW;
  const maxY = Math.max(0.45, analysis.peakDensity * 1.12);
  const mapY = (y) => baseY - (y / maxY) * plotH;

  const buildBandPath = (low, high) => {
    const pts = analysis.curve.filter((p) => p.x >= low && p.x <= high);
    if (pts.length < 2) return '';
    const line = pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(p.y).toFixed(1)}`)
      .join(' ');
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${mapX(last.x).toFixed(1)} ${baseY} L ${mapX(first.x).toFixed(1)} ${baseY} Z`;
  };

  const fullCurvePath = analysis.curve
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(p.y).toFixed(1)}`)
    .join(' ');

  return (
    <div className="math-viz-block">
      <div className="math-controls-row">
        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Mean (μ)</span>
            <strong>{mu.toFixed(1)}</strong>
          </div>
          <input
            type="range"
            min="-3"
            max="3"
            step="0.1"
            value={mu}
            onChange={(e) => setMu(parseFloat(e.target.value))}
          />
        </div>

        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Std Dev (σ)</span>
            <strong>{sigma.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={sigma}
            onChange={(e) => setSigma(parseFloat(e.target.value))}
          />
        </div>

        <div className="math-preset-row">
          <button
            type="button"
            className="math-chip-btn math-chip-btn--reset"
            onClick={() => {
              setMu(0);
              setSigma(1.2);
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      <div className="math-svg-frame">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="math-svg">
          {/* Empirical Bands: 3σ, 2σ, 1σ */}
          <path d={buildBandPath(mu - 3 * sigma, mu + 3 * sigma)} fill="#8b5cf6" fillOpacity="0.14" />
          <path d={buildBandPath(mu - 2 * sigma, mu + 2 * sigma)} fill="#3b82f6" fillOpacity="0.2" />
          <path d={buildBandPath(mu - sigma, mu + sigma)} fill="#06b6d4" fillOpacity="0.28" />

          {/* Bell Curve Outline */}
          <path d={fullCurvePath} fill="none" stroke="#22d3ee" strokeWidth="2.4" />

          {/* Mean Center Line */}
          <line
            x1={mapX(mu)}
            y1={padT}
            x2={mapX(mu)}
            y2={baseY}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Baseline & Ticks */}
          <line x1={padL} y1={baseY} x2={svgW - padR} y2={baseY} stroke="#334155" strokeWidth="1.5" />
          {[-6, -4, -2, 0, 2, 4, 6].map((tick) => {
            const tx = mapX(tick);
            return (
              <g key={tick}>
                <line x1={tx} y1={baseY - 4} x2={tx} y2={baseY + 4} stroke="#64748b" />
                <text x={tx} y={baseY + 44} textAnchor="middle" className="math-axis-label">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* 80 Sample Dispersion Dots below baseline */}
          {analysis.samples.map((s) => {
            if (s.x < analysis.xMin || s.x > analysis.xMax) return null;
            const dotColor =
              Math.abs(s.z) <= 1 ? '#06b6d4' : Math.abs(s.z) <= 2 ? '#3b82f6' : '#8b5cf6';
            return (
              <circle
                key={s.id}
                cx={mapX(s.x)}
                cy={baseY + 12 + s.yOffset * 16}
                r="2.6"
                fill={dotColor}
                fillOpacity="0.85"
              />
            );
          })}

          <text x={mapX(mu)} y={18} textAnchor="middle" className="math-tag-cyan">
            μ = {mu.toFixed(1)}, σ = {sigma.toFixed(2)}
          </text>
        </svg>
      </div>

      <div className="math-metrics-grid">
        <div className="math-metric-card">
          <span>Within ±1σ (Theory 68.3%)</span>
          <strong style={{ color: '#06b6d4' }}>
            {analysis.empiricalCoverage.within1Sigma.toFixed(1)}%
          </strong>
        </div>
        <div className="math-metric-card">
          <span>Within ±2σ (Theory 95.4%)</span>
          <strong style={{ color: '#3b82f6' }}>
            {analysis.empiricalCoverage.within2Sigma.toFixed(1)}%
          </strong>
        </div>
        <div className="math-metric-card">
          <span>Within ±3σ (Theory 99.7%)</span>
          <strong style={{ color: '#8b5cf6' }}>
            {analysis.empiricalCoverage.within3Sigma.toFixed(1)}%
          </strong>
        </div>
        <div className="math-metric-card">
          <span>Peak Density f(μ)</span>
          <strong>{analysis.peakDensity.toFixed(3)}</strong>
        </div>
      </div>
    </div>
  );
}

function CorrelationScatterViz() {
  const [targetR, setTargetR] = useState(0.78);
  const [spread, setSpread] = useState(0.45);
  const [withOutlier, setWithOutlier] = useState(false);

  const stats = useMemo(() => {
    const generated = generateCorrelatedDataset(targetR, spread, withOutlier);
    return computeCorrelationStats(generated.points);
  }, [targetR, spread, withOutlier]);

  const regularPts = stats.points.filter((p) => !p.isOutlier);
  const outlierPts = stats.points.filter((p) => p.isOutlier);

  const lineX = [-3.2, 3.2];
  const lineY = lineX.map((x) => stats.slope * x + stats.intercept);

  const plotData = [
    {
      type: 'scatter',
      mode: 'markers',
      name: 'Samples',
      x: regularPts.map((p) => p.x),
      y: regularPts.map((p) => p.y),
      marker: { color: '#06b6d4', size: 9, line: { color: '#0a0e1a', width: 1 } },
    },
    ...(outlierPts.length > 0
      ? [
          {
            type: 'scatter',
            mode: 'markers',
            name: 'Outlier',
            x: outlierPts.map((p) => p.x),
            y: outlierPts.map((p) => p.y),
            marker: { color: '#f59e0b', size: 12, symbol: 'diamond' },
          },
        ]
      : []),
    {
      type: 'scatter',
      mode: 'lines',
      name: `OLS Fit (y=${stats.slope.toFixed(2)}x + ${stats.intercept.toFixed(2)})`,
      x: lineX,
      y: lineY,
      line: { color: '#ec4899', width: 2.5 },
    },
  ];

  const plotLayout = {
    xaxis: { title: { text: 'Feature X' }, range: [-3.4, 3.4] },
    yaxis: { title: { text: 'Target Y' }, range: [-4.2, 4.2] },
  };

  return (
    <div className="math-viz-block">
      <div className="math-controls-row">
        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Target Correlation (r)</span>
            <strong>{targetR.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="-0.98"
            max="0.98"
            step="0.02"
            value={targetR}
            onChange={(e) => setTargetR(parseFloat(e.target.value))}
          />
        </div>

        <div className="math-slider-group">
          <div className="math-slider-header">
            <span>Noise Spread</span>
            <strong>{spread.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.2"
            step="0.05"
            value={spread}
            onChange={(e) => setSpread(parseFloat(e.target.value))}
          />
        </div>

        <div className="math-preset-row">
          <button
            type="button"
            className={`math-chip-btn ${withOutlier ? 'math-chip-btn--active' : ''}`}
            onClick={() => setWithOutlier((prev) => !prev)}
          >
            {withOutlier ? 'Outlier: ON' : 'Inject Outlier'}
          </button>
          <button
            type="button"
            className="math-chip-btn math-chip-btn--reset"
            onClick={() => {
              setTargetR(0.78);
              setSpread(0.45);
              setWithOutlier(false);
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      <PlotlyChart data={plotData} layout={plotLayout} height={330} />

      <div className="math-metrics-grid">
        <div className="math-metric-card">
          <span>Pearson r</span>
          <strong style={{ color: '#06b6d4' }}>{stats.r.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>R² (Explained)</span>
          <strong style={{ color: '#ec4899' }}>{(stats.rSquared * 100).toFixed(1)}%</strong>
        </div>
        <div className="math-metric-card">
          <span>Covariance</span>
          <strong>{stats.covariance.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Fit Slope (m)</span>
          <strong>{stats.slope.toFixed(3)}</strong>
        </div>
      </div>
    </div>
  );
}

export default function StatisticsVisualizer({ topicId }) {
  if (topicId === 'mean') return <MeanScaleViz />;
  if (topicId === 'variance') return <VarianceSquaresViz />;
  if (topicId === 'standard-deviation') return <NormalDispersionViz />;
  return <CorrelationScatterViz />;
}
