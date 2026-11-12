import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  analyzeMatrix2x2,
  analyzeVectorPair,
  computeDistances,
  transformPoint2x2,
} from '../../utils/mathEngine';

const PLANE_SIZE = 340;
const PLANE_HALF = PLANE_SIZE / 2;
const PLANE_RANGE = 5.5;
const PX_PER_UNIT = PLANE_HALF / PLANE_RANGE;

const toSvgX = (x) => PLANE_HALF + x * PX_PER_UNIT;
const toSvgY = (y) => PLANE_HALF - y * PX_PER_UNIT;

function GridPlane({ children, markerDefs }) {
  const ticks = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

  return (
    <div className="math-svg-frame math-svg-frame--square">
      <svg viewBox={`0 0 ${PLANE_SIZE} ${PLANE_SIZE}`} className="math-svg math-svg--square">
        <defs>{markerDefs}</defs>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={toSvgX(t)}
              y1={0}
              x2={toSvgX(t)}
              y2={PLANE_SIZE}
              stroke={t === 0 ? 'rgba(148,163,184,0.4)' : 'rgba(148,163,184,0.1)'}
              strokeWidth={t === 0 ? 1.4 : 0.8}
            />
            <line
              x1={0}
              y1={toSvgY(t)}
              x2={PLANE_SIZE}
              y2={toSvgY(t)}
              stroke={t === 0 ? 'rgba(148,163,184,0.4)' : 'rgba(148,163,184,0.1)'}
              strokeWidth={t === 0 ? 1.4 : 0.8}
            />
          </g>
        ))}
        {children}
      </svg>
    </div>
  );
}

function ArrowMarkers({ items }) {
  return items.map((m) => (
    <marker
      key={m.id}
      id={m.id}
      viewBox="0 -5 10 10"
      refX="8"
      refY="0"
      markerWidth="6"
      markerHeight="6"
      orient="auto"
    >
      <path d="M0,-4.5L9.5,0L0,4.5" fill={m.color} />
    </marker>
  ));
}

function VectorsPlaneViz() {
  const [ax, setAx] = useState(2.4);
  const [ay, setAy] = useState(1.2);
  const [bx, setBx] = useState(1.0);
  const [by, setBy] = useState(2.2);
  const [scalarK, setScalarK] = useState(1.5);

  const res = useMemo(
    () => analyzeVectorPair({ x: ax, y: ay }, { x: bx, y: by }, scalarK),
    [ax, ay, bx, by, scalarK]
  );

  return (
    <div className="math-viz-block">
      <div className="math-split-grid">
        <GridPlane
          markerDefs={
            <ArrowMarkers
              items={[
                { id: 'vec-a', color: '#06b6d4' },
                { id: 'vec-b', color: '#8b5cf6' },
                { id: 'vec-sum', color: '#10b981' },
                { id: 'vec-k', color: '#f59e0b' },
              ]}
            />
          }
        >
          {/* Parallelogram dashed completion lines */}
          <line
            x1={toSvgX(ax)}
            y1={toSvgY(ay)}
            x2={toSvgX(res.sum.x)}
            y2={toSvgY(res.sum.y)}
            stroke="rgba(139, 92, 246, 0.45)"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />
          <line
            x1={toSvgX(bx)}
            y1={toSvgY(by)}
            x2={toSvgX(res.sum.x)}
            y2={toSvgY(res.sum.y)}
            stroke="rgba(6, 182, 212, 0.45)"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />

          {/* Scalar k * a */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(res.scaledA.x)}
            y2={toSvgY(res.scaledA.y)}
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="5 3"
            markerEnd="url(#vec-k)"
          />

          {/* Vector a */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(ax)}
            y2={toSvgY(ay)}
            stroke="#06b6d4"
            strokeWidth="2.6"
            markerEnd="url(#vec-a)"
          />

          {/* Vector b */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(bx)}
            y2={toSvgY(by)}
            stroke="#8b5cf6"
            strokeWidth="2.6"
            markerEnd="url(#vec-b)"
          />

          {/* Sum a + b */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(res.sum.x)}
            y2={toSvgY(res.sum.y)}
            stroke="#10b981"
            strokeWidth="2.6"
            markerEnd="url(#vec-sum)"
          />

          <text x={toSvgX(ax) + 6} y={toSvgY(ay) - 6} className="math-tag-cyan">
            a⃗
          </text>
          <text x={toSvgX(bx) + 6} y={toSvgY(by) - 6} className="math-tag-purple">
            b⃗
          </text>
          <text x={toSvgX(res.sum.x) + 6} y={toSvgY(res.sum.y) - 6} fill="#10b981" fontSize="11" fontWeight="700">
            a⃗+b⃗
          </text>
          <text x={toSvgX(res.scaledA.x) + 6} y={toSvgY(res.scaledA.y) + 12} fill="#f59e0b" fontSize="11" fontWeight="700">
            {scalarK.toFixed(1)}a⃗
          </text>
        </GridPlane>

        <div className="math-controls-col">
          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>Vector aₓ</span>
              <strong>{ax.toFixed(1)}</strong>
            </div>
            <input type="range" min="-4" max="4" step="0.2" value={ax} onChange={(e) => setAx(parseFloat(e.target.value))} />
          </div>
          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>Vector aᵧ</span>
              <strong>{ay.toFixed(1)}</strong>
            </div>
            <input type="range" min="-4" max="4" step="0.2" value={ay} onChange={(e) => setAy(parseFloat(e.target.value))} />
          </div>
          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>Vector bₓ</span>
              <strong>{bx.toFixed(1)}</strong>
            </div>
            <input type="range" min="-4" max="4" step="0.2" value={bx} onChange={(e) => setBx(parseFloat(e.target.value))} />
          </div>
          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>Vector bᵧ</span>
              <strong>{by.toFixed(1)}</strong>
            </div>
            <input type="range" min="-4" max="4" step="0.2" value={by} onChange={(e) => setBy(parseFloat(e.target.value))} />
          </div>
          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>Scalar k</span>
              <strong>{scalarK.toFixed(1)}×</strong>
            </div>
            <input type="range" min="-2" max="2" step="0.1" value={scalarK} onChange={(e) => setScalarK(parseFloat(e.target.value))} />
          </div>
          <button
            type="button"
            className="math-chip-btn math-chip-btn--reset"
            onClick={() => {
              setAx(2.4);
              setAy(1.2);
              setBx(1.0);
              setBy(2.2);
              setScalarK(1.5);
            }}
          >
            <RotateCcw size={13} /> Reset Vectors
          </button>
        </div>
      </div>

      <div className="math-metrics-grid">
        <div className="math-metric-card">
          <span>||a⃗|| Magnitude</span>
          <strong style={{ color: '#06b6d4' }}>{res.magA.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>||b⃗|| Magnitude</span>
          <strong style={{ color: '#8b5cf6' }}>{res.magB.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>a⃗ + b⃗</span>
          <strong style={{ color: '#10b981' }}>
            ({res.sum.x.toFixed(1)}, {res.sum.y.toFixed(1)})
          </strong>
        </div>
        <div className="math-metric-card">
          <span>||k·a⃗||</span>
          <strong style={{ color: '#f59e0b' }}>{res.magScaledA.toFixed(3)}</strong>
        </div>
      </div>
    </div>
  );
}

function DotProductViz() {
  const [ax, setAx] = useState(2.8);
  const [ay, setAy] = useState(2.2);
  const [bx, setBx] = useState(3.4);
  const [by, setBy] = useState(0.6);

  const res = useMemo(
    () => analyzeVectorPair({ x: ax, y: ay }, { x: bx, y: by }, 1),
    [ax, ay, bx, by]
  );

  const stateColor =
    res.magA < 1e-6 || res.magB < 1e-6
      ? '#94a3b8'
      : Math.abs(res.cosTheta) <= 0.03
      ? '#f59e0b'
      : res.dot > 0
      ? '#10b981'
      : '#ef4444';

  return (
    <div className="math-viz-block">
      <div className="math-split-grid">
        <GridPlane
          markerDefs={
            <ArrowMarkers
              items={[
                { id: 'dp-a', color: '#06b6d4' },
                { id: 'dp-b', color: '#8b5cf6' },
              ]}
            />
          }
        >
          {/* Orthogonal Drop Line from a to projection */}
          <line
            x1={toSvgX(ax)}
            y1={toSvgY(ay)}
            x2={toSvgX(res.projection.x)}
            y2={toSvgY(res.projection.y)}
            stroke="#94a3b8"
            strokeDasharray="4 3"
            strokeWidth="1.4"
          />

          {/* Orthogonal Projection Shadow */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(res.projection.x)}
            y2={toSvgY(res.projection.y)}
            stroke={stateColor}
            strokeWidth="5"
            strokeOpacity="0.55"
            strokeLinecap="round"
          />

          {/* Vector b */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(bx)}
            y2={toSvgY(by)}
            stroke="#8b5cf6"
            strokeWidth="2.6"
            markerEnd="url(#dp-b)"
          />

          {/* Vector a */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(ax)}
            y2={toSvgY(ay)}
            stroke="#06b6d4"
            strokeWidth="2.6"
            markerEnd="url(#dp-a)"
          />

          <circle cx={toSvgX(res.projection.x)} cy={toSvgY(res.projection.y)} r="4" fill={stateColor} />
          <text x={toSvgX(ax) + 6} y={toSvgY(ay) - 6} className="math-tag-cyan">
            a⃗
          </text>
          <text x={toSvgX(bx) + 6} y={toSvgY(by) - 6} className="math-tag-purple">
            b⃗
          </text>
          <text
            x={toSvgX(res.projection.x)}
            y={toSvgY(res.projection.y) + 16}
            textAnchor="middle"
            fill={stateColor}
            fontSize="10.5"
            fontWeight="700"
          >
            proj
          </text>
        </GridPlane>

        <div className="math-controls-col">
          <div className="math-preset-row">
            <button
              type="button"
              className="math-chip-btn"
              onClick={() => {
                setAx(3.0);
                setAy(1.2);
                setBx(3.2);
                setBy(0.8);
              }}
            >
              Aligned (&gt;0)
            </button>
            <button
              type="button"
              className="math-chip-btn"
              onClick={() => {
                setAx(0.0);
                setAy(3.0);
                setBx(3.2);
                setBy(0.0);
              }}
            >
              Orthogonal (=0)
            </button>
            <button
              type="button"
              className="math-chip-btn"
              onClick={() => {
                setAx(-2.8);
                setAy(1.4);
                setBx(3.0);
                setBy(0.4);
              }}
            >
              Opposite (&lt;0)
            </button>
          </div>

          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>aₓ</span>
              <strong>{ax.toFixed(1)}</strong>
            </div>
            <input type="range" min="-4" max="4" step="0.2" value={ax} onChange={(e) => setAx(parseFloat(e.target.value))} />
          </div>
          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>aᵧ</span>
              <strong>{ay.toFixed(1)}</strong>
            </div>
            <input type="range" min="-4" max="4" step="0.2" value={ay} onChange={(e) => setAy(parseFloat(e.target.value))} />
          </div>
          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>bₓ</span>
              <strong>{bx.toFixed(1)}</strong>
            </div>
            <input type="range" min="-4" max="4" step="0.2" value={bx} onChange={(e) => setBx(parseFloat(e.target.value))} />
          </div>
          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>bᵧ</span>
              <strong>{by.toFixed(1)}</strong>
            </div>
            <input type="range" min="-4" max="4" step="0.2" value={by} onChange={(e) => setBy(parseFloat(e.target.value))} />
          </div>
          <button
            type="button"
            className="math-chip-btn math-chip-btn--reset"
            onClick={() => {
              setAx(2.8);
              setAy(2.2);
              setBx(3.4);
              setBy(0.6);
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      <div className="math-metrics-grid">
        <div className="math-metric-card">
          <span>Dot Product (a⃗ · b⃗)</span>
          <strong style={{ color: stateColor }}>{res.dot.toFixed(2)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Angle θ</span>
          <strong>{res.angleDeg.toFixed(1)}°</strong>
        </div>
        <div className="math-metric-card">
          <span>cos(θ)</span>
          <strong>{res.cosTheta.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Geometric State</span>
          <strong style={{ color: stateColor, fontSize: '0.84rem' }}>{res.alignment}</strong>
        </div>
      </div>
    </div>
  );
}

const MATRIX_PRESETS = [
  { id: 'identity', label: 'Identity', a: 1, b: 0, c: 0, d: 1 },
  { id: 'rot45', label: 'Rotation 45°', a: 0.71, b: -0.71, c: 0.71, d: 0.71 },
  { id: 'shear', label: 'Shear', a: 1, b: 0.8, c: 0, d: 1 },
  { id: 'scale', label: 'Scale', a: 1.6, b: 0, c: 0, d: 0.7 },
  { id: 'singular', label: 'Singular', a: 1.5, b: 1.5, c: 1.0, d: 1.0 },
];

function MatrixTransformViz() {
  const [a, setA] = useState(1.2);
  const [b, setB] = useState(0.6);
  const [c, setC] = useState(0.2);
  const [d, setD] = useState(1.0);

  const mat = useMemo(() => analyzeMatrix2x2(a, b, c, d), [a, b, c, d]);

  const gridLines = useMemo(() => {
    const lines = [];
    for (let k = -3; k <= 3; k += 1) {
      const p1 = transformPoint2x2(mat, k, -3.5);
      const p2 = transformPoint2x2(mat, k, 3.5);
      lines.push({ key: `v${k}`, p1, p2, isAxis: k === 0 });

      const q1 = transformPoint2x2(mat, -3.5, k);
      const q2 = transformPoint2x2(mat, 3.5, k);
      lines.push({ key: `h${k}`, p1: q1, p2: q2, isAxis: k === 0 });
    }
    return lines;
  }, [mat]);

  const sqOrigin = transformPoint2x2(mat, 0, 0);
  const sqI = transformPoint2x2(mat, 1, 0);
  const sqIJ = transformPoint2x2(mat, 1, 1);
  const sqJ = transformPoint2x2(mat, 0, 1);

  const sqPoints = [sqOrigin, sqI, sqIJ, sqJ]
    .map((p) => `${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`)
    .join(' ');

  return (
    <div className="math-viz-block">
      <div className="math-split-grid">
        <GridPlane
          markerDefs={
            <ArrowMarkers
              items={[
                { id: 'mat-i', color: '#10b981' },
                { id: 'mat-j', color: '#ec4899' },
              ]}
            />
          }
        >
          {/* Transformed coordinate grid */}
          {gridLines.map((gl) => (
            <line
              key={gl.key}
              x1={toSvgX(gl.p1.x)}
              y1={toSvgY(gl.p1.y)}
              x2={toSvgX(gl.p2.x)}
              y2={toSvgY(gl.p2.y)}
              stroke={gl.isAxis ? 'rgba(6, 182, 212, 0.55)' : 'rgba(6, 182, 212, 0.22)'}
              strokeWidth={gl.isAxis ? 1.5 : 1}
            />
          ))}

          {/* Reference original unit square */}
          <rect
            x={toSvgX(0)}
            y={toSvgY(1)}
            width={PX_PER_UNIT}
            height={PX_PER_UNIT}
            fill="none"
            stroke="rgba(226, 232, 240, 0.45)"
            strokeDasharray="3 3"
            strokeWidth="1.2"
          />

          {/* Shaded Transformed Unit Square (Area = |det(A)|) */}
          <polygon
            points={sqPoints}
            fill={mat.det < 0 ? '#ef4444' : '#06b6d4'}
            fillOpacity="0.22"
            stroke={mat.det < 0 ? '#ef4444' : '#06b6d4'}
            strokeWidth="1.6"
          />

          {/* Transformed Basis Vectors i-hat and j-hat */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(mat.iHat.x)}
            y2={toSvgY(mat.iHat.y)}
            stroke="#10b981"
            strokeWidth="2.8"
            markerEnd="url(#mat-i)"
          />
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(mat.jHat.x)}
            y2={toSvgY(mat.jHat.y)}
            stroke="#ec4899"
            strokeWidth="2.8"
            markerEnd="url(#mat-j)"
          />

          <text x={toSvgX(mat.iHat.x) + 6} y={toSvgY(mat.iHat.y) - 6} fill="#10b981" fontSize="11" fontWeight="700">
            î&apos;
          </text>
          <text x={toSvgX(mat.jHat.x) + 6} y={toSvgY(mat.jHat.y) - 6} fill="#ec4899" fontSize="11" fontWeight="700">
            ĵ&apos;
          </text>
        </GridPlane>

        <div className="math-controls-col">
          <div className="math-preset-row">
            {MATRIX_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="math-chip-btn"
                onClick={() => {
                  setA(p.a);
                  setB(p.b);
                  setC(p.c);
                  setD(p.d);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="math-matrix-grid">
            <div className="math-slider-group">
              <div className="math-slider-header">
                <span>a (îₓ)</span>
                <strong>{a.toFixed(2)}</strong>
              </div>
              <input type="range" min="-2.5" max="2.5" step="0.1" value={a} onChange={(e) => setA(parseFloat(e.target.value))} />
            </div>
            <div className="math-slider-group">
              <div className="math-slider-header">
                <span>b (ĵₓ)</span>
                <strong>{b.toFixed(2)}</strong>
              </div>
              <input type="range" min="-2.5" max="2.5" step="0.1" value={b} onChange={(e) => setB(parseFloat(e.target.value))} />
            </div>
            <div className="math-slider-group">
              <div className="math-slider-header">
                <span>c (îᵧ)</span>
                <strong>{c.toFixed(2)}</strong>
              </div>
              <input type="range" min="-2.5" max="2.5" step="0.1" value={c} onChange={(e) => setC(parseFloat(e.target.value))} />
            </div>
            <div className="math-slider-group">
              <div className="math-slider-header">
                <span>d (ĵᵧ)</span>
                <strong>{d.toFixed(2)}</strong>
              </div>
              <input type="range" min="-2.5" max="2.5" step="0.1" value={d} onChange={(e) => setD(parseFloat(e.target.value))} />
            </div>
          </div>

          <button
            type="button"
            className="math-chip-btn math-chip-btn--reset"
            onClick={() => {
              setA(1.2);
              setB(0.6);
              setC(0.2);
              setD(1.0);
            }}
          >
            <RotateCcw size={13} /> Reset Matrix
          </button>
        </div>
      </div>

      <div className="math-metrics-grid">
        <div className="math-metric-card">
          <span>Determinant det(A)</span>
          <strong style={{ color: mat.isSingular ? '#ef4444' : '#06b6d4' }}>
            {mat.det.toFixed(2)}
          </strong>
        </div>
        <div className="math-metric-card">
          <span>Area Scale |det(A)|</span>
          <strong>{mat.absDet.toFixed(2)}×</strong>
        </div>
        <div className="math-metric-card">
          <span>Space State</span>
          <strong style={{ fontSize: '0.84rem' }}>
            {mat.isSingular
              ? 'Collapsed (Singular)'
              : mat.orientationFlipped
              ? 'Flipped Orientation'
              : 'Preserved Orientation'}
          </strong>
        </div>
        <div className="math-metric-card">
          <span>Eigenvalues</span>
          <strong style={{ fontSize: '0.84rem', color: '#8b5cf6' }}>{mat.eigenvaluesText}</strong>
        </div>
      </div>
    </div>
  );
}

function DistanceMetricsViz() {
  const [x1, setX1] = useState(1.5);
  const [y1, setY1] = useState(1.2);
  const [x2, setX2] = useState(4.0);
  const [y2, setY2] = useState(3.2);

  const dist = useMemo(() => computeDistances({ x: x1, y: y1 }, { x: x2, y: y2 }), [x1, y1, x2, y2]);

  return (
    <div className="math-viz-block">
      <div className="math-split-grid">
        <GridPlane
          markerDefs={
            <ArrowMarkers
              items={[
                { id: 'dist-p1', color: '#8b5cf6' },
                { id: 'dist-p2', color: '#8b5cf6' },
              ]}
            />
          }
        >
          {/* Rays from origin for Cosine angle */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(x1)}
            y2={toSvgY(y1)}
            stroke="rgba(139, 92, 246, 0.55)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            markerEnd="url(#dist-p1)"
          />
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(x2)}
            y2={toSvgY(y2)}
            stroke="rgba(139, 92, 246, 0.55)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            markerEnd="url(#dist-p2)"
          />

          {/* Manhattan L1 Step Path */}
          <polyline
            points={`${toSvgX(x1)},${toSvgY(y1)} ${toSvgX(x2)},${toSvgY(y1)} ${toSvgX(x2)},${toSvgY(y2)}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.4"
            strokeDasharray="6 4"
          />

          {/* Euclidean L2 Straight Path */}
          <line
            x1={toSvgX(x1)}
            y1={toSvgY(y1)}
            x2={toSvgX(x2)}
            y2={toSvgY(y2)}
            stroke="#06b6d4"
            strokeWidth="2.6"
          />

          <circle cx={toSvgX(x1)} cy={toSvgY(y1)} r="5.5" fill="#06b6d4" stroke="#070b15" strokeWidth="1.5" />
          <circle cx={toSvgX(x2)} cy={toSvgY(y2)} r="5.5" fill="#ec4899" stroke="#070b15" strokeWidth="1.5" />
          <text x={toSvgX(x1) + 7} y={toSvgY(y1) - 6} className="math-tag-cyan">
            P₁
          </text>
          <text x={toSvgX(x2) + 7} y={toSvgY(y2) - 6} fill="#ec4899" fontSize="11" fontWeight="700">
            P₂
          </text>
        </GridPlane>

        <div className="math-controls-col">
          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>P₁ x</span>
              <strong>{x1.toFixed(1)}</strong>
            </div>
            <input type="range" min="-4.5" max="4.5" step="0.1" value={x1} onChange={(e) => setX1(parseFloat(e.target.value))} />
          </div>
          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>P₁ y</span>
              <strong>{y1.toFixed(1)}</strong>
            </div>
            <input type="range" min="-4.5" max="4.5" step="0.1" value={y1} onChange={(e) => setY1(parseFloat(e.target.value))} />
          </div>
          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>P₂ x</span>
              <strong>{x2.toFixed(1)}</strong>
            </div>
            <input type="range" min="-4.5" max="4.5" step="0.1" value={x2} onChange={(e) => setX2(parseFloat(e.target.value))} />
          </div>
          <div className="math-slider-group">
            <div className="math-slider-header">
              <span>P₂ y</span>
              <strong>{y2.toFixed(1)}</strong>
            </div>
            <input type="range" min="-4.5" max="4.5" step="0.1" value={y2} onChange={(e) => setY2(parseFloat(e.target.value))} />
          </div>
          <button
            type="button"
            className="math-chip-btn math-chip-btn--reset"
            onClick={() => {
              setX1(1.5);
              setY1(1.2);
              setX2(4.0);
              setY2(3.2);
            }}
          >
            <RotateCcw size={13} /> Reset Points
          </button>
        </div>
      </div>

      <div className="math-metrics-grid">
        <div className="math-metric-card">
          <span>Euclidean (L₂)</span>
          <strong style={{ color: '#06b6d4' }}>{dist.euclidean.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Manhattan (L₁)</span>
          <strong style={{ color: '#f59e0b' }}>{dist.manhattan.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Cosine Distance</span>
          <strong style={{ color: '#8b5cf6' }}>{dist.cosineDistance.toFixed(3)}</strong>
        </div>
        <div className="math-metric-card">
          <span>Cosine Similarity (θ={dist.angleDeg.toFixed(1)}°)</span>
          <strong>{dist.cosineSimilarity.toFixed(3)}</strong>
        </div>
      </div>
    </div>
  );
}

export default function LinearAlgebraVisualizer({ topicId }) {
  if (topicId === 'vectors') return <VectorsPlaneViz />;
  if (topicId === 'dot-product') return <DotProductViz />;
  if (topicId === 'matrices') return <MatrixTransformViz />;
  return <DistanceMetricsViz />;
}
