import { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  HelpCircle,
  Compass,
} from 'lucide-react';
import Button from '../common/Button';
import {
  compileEquation,
  generatePlotPoints,
  EQUATION_PRESETS,
} from '../../utils/safeMathParser';
import GraphNotesModal from '../visualization/GraphNotesModal';
import './LibraryGraph.css';

const DEFAULT_EQUATIONS = [
  {
    id: 'eq-1',
    raw: '2 * x + 1',
    color: '#164BFF',
    visible: true,
    label: 'Linear: y = 2x + 1',
  },
  {
    id: 'eq-2',
    raw: '0.5 * x^2 - 3',
    color: '#FACC15',
    visible: true,
    label: 'Quadratic: y = 0.5x² - 3',
  },
];

const PRESET_COLORS = ['#164BFF', '#FACC15', '#06B6D4', '#EC4899', '#10B981', '#8B5CF6', '#F59E0B'];

const GRAPH_WIDTH = 760;
const GRAPH_HEIGHT = 480;
const GRAPH_PAD = { top: 28, right: 36, bottom: 44, left: 54 };

export default function LibraryGraph() {
  const [equations, setEquations] = useState(DEFAULT_EQUATIONS);
  const [newEqText, setNewEqText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [eqError, setEqError] = useState(null);

  // Axes settings
  const [axis, setAxis] = useState({
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
    gridVisible: true,
    dataPointsVisible: true,
    xLabel: 'X Axis (Input)',
    yLabel: 'Y Axis (Output)',
  });

  // Coefficients / Parameters
  const [params, setParams] = useState({
    m: 2,
    c: 1,
    a: 1,
    b: 0.5,
    w: 1,
    A: 2,
  });

  // Custom reference coordinates
  const [customPoints, setCustomPoints] = useState([
    { id: 'p1', x: 0, y: 1 },
    { id: 'p2', x: 2, y: 5 },
    { id: 'p3', x: -2, y: -1 },
  ]);
  const [ptX, setPtX] = useState(0);
  const [ptY, setPtY] = useState(0);

  // Hover crosshairs state
  const [hoverCoord, setHoverCoord] = useState(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const svgRef = useRef(null);

  const width = GRAPH_WIDTH;
  const height = GRAPH_HEIGHT;
  const pad = GRAPH_PAD;

  const mapX = (x) => pad.left + ((x - axis.xMin) / (axis.xMax - axis.xMin || 1)) * (width - pad.left - pad.right);
  const mapY = (y) => height - pad.bottom - ((y - axis.yMin) / (axis.yMax - axis.yMin || 1)) * (height - pad.top - pad.bottom);

  const invMapX = (px) => axis.xMin + ((px - pad.left) / (width - pad.left - pad.right)) * (axis.xMax - axis.xMin);
  const invMapY = (py) => axis.yMin + ((height - pad.bottom - py) / (height - pad.top - pad.bottom)) * (axis.yMax - axis.yMin);

  // Compile and generate plot paths for active equations
  const plottedCurves = useMemo(() => {
    const toScreenX = (valX) => GRAPH_PAD.left + ((valX - axis.xMin) / (axis.xMax - axis.xMin || 1)) * (GRAPH_WIDTH - GRAPH_PAD.left - GRAPH_PAD.right);
    const toScreenY = (valY) => GRAPH_HEIGHT - GRAPH_PAD.bottom - ((valY - axis.yMin) / (axis.yMax - axis.yMin || 1)) * (GRAPH_HEIGHT - GRAPH_PAD.top - GRAPH_PAD.bottom);

    return equations
      .filter((eq) => eq.visible && eq.raw)
      .map((eq) => {
        const comp = compileEquation(eq.raw);
        if (comp.error) return { id: eq.id, error: comp.error, pathD: null, color: eq.color };
        const pts = generatePlotPoints(comp.evaluate, axis.xMin, axis.xMax, 180, params);
        if (pts.length === 0) return { id: eq.id, pathD: null, color: eq.color };
        const pathD = pts
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toScreenX(pt.x).toFixed(1)} ${toScreenY(pt.y).toFixed(1)}`)
          .join(' ');
        return {
          id: eq.id,
          raw: eq.raw,
          label: eq.label || eq.raw,
          color: eq.color,
          pathD,
          error: null,
        };
      });
  }, [equations, axis.xMin, axis.xMax, axis.yMin, axis.yMax, params]);

  // Handle SVG mouse move for live coordinate crosshairs
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (GRAPH_WIDTH / rect.width);
    const py = (e.clientY - rect.top) * (GRAPH_HEIGHT / rect.height);
    if (px >= GRAPH_PAD.left && px <= GRAPH_WIDTH - GRAPH_PAD.right && py >= GRAPH_PAD.top && py <= GRAPH_HEIGHT - GRAPH_PAD.bottom) {
      setHoverCoord({
        px,
        py,
        x: invMapX(px),
        y: invMapY(py),
      });
    } else {
      setHoverCoord(null);
    }
  };

  const handleAddEquation = () => {
    if (!newEqText.trim()) return;
    const comp = compileEquation(newEqText);
    if (comp.error) {
      setEqError(comp.error);
      return;
    }
    setEqError(null);
    const color = PRESET_COLORS[equations.length % PRESET_COLORS.length];
    const newEq = {
      id: `eq-${Date.now()}`,
      raw: newEqText.trim(),
      color,
      visible: true,
      label: newEqText.trim(),
    };
    setEquations((prev) => [...prev, newEq]);
    setNewEqText('');
  };

  const handleApplyPreset = (presetId) => {
    setSelectedPreset(presetId);
    const p = EQUATION_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setNewEqText(p.equation);
      setEqError(null);
      if (p.defaultParams) {
        setParams((prev) => ({ ...prev, ...p.defaultParams }));
      }
    }
  };

  const handleReset = () => {
    setEquations(DEFAULT_EQUATIONS);
    setAxis({
      xMin: -10,
      xMax: 10,
      yMin: -10,
      yMax: 10,
      gridVisible: true,
      dataPointsVisible: true,
      xLabel: 'X Axis (Input)',
      yLabel: 'Y Axis (Output)',
    });
    setParams({ m: 2, c: 1, a: 1, b: 0.5, w: 1, A: 2 });
    setCustomPoints([
      { id: 'p1', x: 0, y: 1 },
      { id: 'p2', x: 2, y: 5 },
      { id: 'p3', x: -2, y: -1 },
    ]);
    setNewEqText('');
    setEqError(null);
  };

  const handleAddPoint = () => {
    const x = parseFloat(ptX);
    const y = parseFloat(ptY);
    if (!Number.isNaN(x) && !Number.isNaN(y)) {
      setCustomPoints((prev) => [...prev, { id: `pt-${Date.now()}`, x, y }]);
      setPtX(0);
      setPtY(0);
    }
  };

  return (
    <div className="lib-graph fade-in">
      {/* Header */}
      <header className="lib-graph__header">
        <div className="lib-graph__header-left">
          <div className="lib-graph__eyebrow">
            <Compass size={14} className="text-icy" />
            <span>Interactive Mathematics Laboratory · Function Grapher</span>
          </div>
          <h1 className="lib-graph__title">Library Graph</h1>
          <p className="lib-graph__subtitle">
            Plot, compare, and customize mathematical functions with live coordinate inspection,
            custom variables, and bilingual pedagogical graph explanations.
          </p>
        </div>

        <div className="lib-graph__header-actions">
          <Button
            icon={HelpCircle}
            onClick={() => setIsNotesOpen(true)}
            style={{
              background: 'rgba(250, 204, 21, 0.1)',
              borderColor: 'rgba(250, 204, 21, 0.3)',
              color: '#FACC15',
            }}
          >
            Graph Notes / Explain Graph
          </Button>
          <Button variant="secondary" icon={RotateCcw} onClick={handleReset}>
            Reset Graph
          </Button>
        </div>
      </header>

      {/* Main Graph & Controls Split */}
      <div className="lib-graph__workspace">
        {/* SVG Canvas Container */}
        <div className="lib-graph__canvas-box">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="lib-graph__svg"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverCoord(null)}
          >
            {/* Grid Lines */}
            {axis.gridVisible && (
              <g className="lib-graph__grid">
                {Array.from({ length: 11 }).map((_, i) => {
                  const vx = axis.xMin + (i / 10) * (axis.xMax - axis.xMin);
                  const vy = axis.yMin + (i / 10) * (axis.yMax - axis.yMin);
                  return (
                    <g key={i}>
                      <line
                        x1={mapX(vx)}
                        y1={pad.top}
                        x2={mapX(vx)}
                        y2={height - pad.bottom}
                        stroke="rgba(255,255,255,0.06)"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1={pad.left}
                        y1={mapY(vy)}
                        x2={width - pad.right}
                        y2={mapY(vy)}
                        stroke="rgba(255,255,255,0.06)"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={mapX(vx)}
                        y={height - pad.bottom + 18}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {vx.toFixed(0)}
                      </text>
                      <text
                        x={pad.left - 8}
                        y={mapY(vy) + 3}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {vy.toFixed(0)}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Axes x=0 and y=0 */}
            {axis.xMin <= 0 && axis.xMax >= 0 && (
              <line
                x1={mapX(0)}
                y1={pad.top}
                x2={mapX(0)}
                y2={height - pad.bottom}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.8"
              />
            )}
            {axis.yMin <= 0 && axis.yMax >= 0 && (
              <line
                x1={pad.left}
                y1={mapY(0)}
                x2={width - pad.right}
                y2={mapY(0)}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.8"
              />
            )}

            {/* Axis Titles */}
            <text
              x={width - pad.right}
              y={height - pad.bottom - 8}
              fill="#94a3b8"
              fontSize="11"
              fontWeight="700"
              textAnchor="end"
            >
              {axis.xLabel} →
            </text>
            <text
              x={pad.left + 8}
              y={pad.top + 14}
              fill="#94a3b8"
              fontSize="11"
              fontWeight="700"
            >
              ↑ {axis.yLabel}
            </text>

            {/* Plotted Curves */}
            {plottedCurves.map((c) =>
              c.pathD ? (
                <path
                  key={c.id}
                  d={c.pathD}
                  fill="none"
                  stroke={c.color}
                  strokeWidth="2.8"
                >
                  <title>{c.label}</title>
                </path>
              ) : null
            )}

            {/* Reference Data Points */}
            {axis.dataPointsVisible &&
              customPoints.map((pt, i) => (
                <g key={pt.id || i} className="lib-graph__point">
                  <circle
                    cx={mapX(pt.x)}
                    cy={mapY(pt.y)}
                    r="5"
                    fill="#FACC15"
                    stroke="#050814"
                    strokeWidth="2"
                  />
                  <text
                    x={mapX(pt.x) + 8}
                    y={mapY(pt.y) - 6}
                    fill="#f1f5f9"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    ({pt.x.toFixed(1)}, {pt.y.toFixed(1)})
                  </text>
                </g>
              ))}

            {/* Crosshairs & Coordinate Inspection on Hover */}
            {hoverCoord && (
              <g className="lib-graph__crosshairs">
                <line
                  x1={hoverCoord.px}
                  y1={pad.top}
                  x2={hoverCoord.px}
                  y2={height - pad.bottom}
                  stroke="rgba(101, 207, 255, 0.45)"
                  strokeDasharray="3 3"
                />
                <line
                  x1={pad.left}
                  y1={hoverCoord.py}
                  x2={width - pad.right}
                  y2={hoverCoord.py}
                  stroke="rgba(101, 207, 255, 0.45)"
                  strokeDasharray="3 3"
                />
                <circle cx={hoverCoord.px} cy={hoverCoord.py} r="4" fill="#65CFFF" />
              </g>
            )}
          </svg>

          {/* Coordinate Readout Banner */}
          <div className="lib-graph__readout">
            <div className="lib-graph__readout-item">
              <span>Inspection:</span>{' '}
              <strong>
                {hoverCoord
                  ? `x = ${hoverCoord.x.toFixed(3)},  y = ${hoverCoord.y.toFixed(3)}`
                  : 'Hover anywhere over the graph to inspect exact coordinates'}
              </strong>
            </div>
            <div className="lib-graph__readout-curves">
              {plottedCurves.map((c) => (
                <div key={c.id} className="lib-graph__curve-pill">
                  <span className="lib-graph__curve-dot" style={{ background: c.color }} />
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="lib-graph__controls">
          {/* Preset Function Selector */}
          <div className="lib-graph__card">
            <h3 className="lib-graph__card-title">Select Preset Function</h3>
            <select
              className="lib-graph__select"
              value={selectedPreset}
              onChange={(e) => handleApplyPreset(e.target.value)}
            >
              <option value="">-- Choose Function Preset --</option>
              {EQUATION_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.latex})
                </option>
              ))}
            </select>
          </div>

          {/* Add Equation Box */}
          <div className="lib-graph__card">
            <h3 className="lib-graph__card-title">Add / Edit Mathematical Function</h3>
            <div className="lib-graph__input-row">
              <input
                type="text"
                className={`lib-graph__input ${eqError ? 'lib-graph__input--error' : ''}`}
                placeholder="y = 2*x + 1 or x^2 - 4"
                value={newEqText}
                onChange={(e) => {
                  setNewEqText(e.target.value);
                  setEqError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEquation()}
              />
              <Button icon={Plus} onClick={handleAddEquation} disabled={!newEqText.trim()}>
                Plot
              </Button>
            </div>
            {eqError && <span className="lib-graph__error">{eqError}</span>}

            {/* Active Equation List */}
            <div className="lib-graph__eq-list">
              {equations.map((eq, idx) => (
                <div key={eq.id} className="lib-graph__eq-item">
                  <span className="lib-graph__eq-color" style={{ background: eq.color }} />
                  <span className="lib-graph__eq-text">
                    y_{idx + 1}(x) = {eq.raw}
                  </span>
                  <div className="lib-graph__eq-actions">
                    <button
                      type="button"
                      className="lib-graph__icon-btn"
                      onClick={() =>
                        setEquations((prev) =>
                          prev.map((x) => (x.id === eq.id ? { ...x, visible: !x.visible } : x))
                        )
                      }
                      title={eq.visible ? 'Hide Curve' : 'Show Curve'}
                    >
                      {eq.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      type="button"
                      className="lib-graph__icon-btn lib-graph__icon-btn--del"
                      onClick={() => setEquations((prev) => prev.filter((x) => x.id !== eq.id))}
                      title="Remove Curve"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variable Coefficients Sliders */}
          <div className="lib-graph__card">
            <h3 className="lib-graph__card-title">Variable Sliders &amp; Coefficients</h3>
            <div className="lib-graph__sliders-stack">
              {Object.entries(params).map(([key, val]) => (
                <div key={key} className="lib-graph__slider-item">
                  <div className="lib-graph__slider-head">
                    <span className="lib-graph__slider-label">{key}</span>
                    <span className="lib-graph__slider-val">{Number(val).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="0.1"
                    value={val}
                    className="lib-graph__slider"
                    onChange={(e) =>
                      setParams((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Coordinate Range & Grid Settings */}
          <div className="lib-graph__card">
            <h3 className="lib-graph__card-title">Axes Ranges &amp; Grid</h3>
            <div className="lib-graph__axes-grid">
              <div>
                <label>X Min:</label>
                <input
                  type="number"
                  value={axis.xMin}
                  className="lib-graph__num-input"
                  onChange={(e) =>
                    setAxis((prev) => ({ ...prev, xMin: parseFloat(e.target.value) || -10 }))
                  }
                />
              </div>
              <div>
                <label>X Max:</label>
                <input
                  type="number"
                  value={axis.xMax}
                  className="lib-graph__num-input"
                  onChange={(e) =>
                    setAxis((prev) => ({ ...prev, xMax: parseFloat(e.target.value) || 10 }))
                  }
                />
              </div>
              <div>
                <label>Y Min:</label>
                <input
                  type="number"
                  value={axis.yMin}
                  className="lib-graph__num-input"
                  onChange={(e) =>
                    setAxis((prev) => ({ ...prev, yMin: parseFloat(e.target.value) || -10 }))
                  }
                />
              </div>
              <div>
                <label>Y Max:</label>
                <input
                  type="number"
                  value={axis.yMax}
                  className="lib-graph__num-input"
                  onChange={(e) =>
                    setAxis((prev) => ({ ...prev, yMax: parseFloat(e.target.value) || 10 }))
                  }
                />
              </div>
            </div>

            <div className="lib-graph__toggle-row">
              <label className="lib-graph__checkbox-label">
                <input
                  type="checkbox"
                  checked={axis.gridVisible}
                  onChange={(e) => setAxis((prev) => ({ ...prev, gridVisible: e.target.checked }))}
                />
                <span>Show Grid Lines</span>
              </label>
              <label className="lib-graph__checkbox-label">
                <input
                  type="checkbox"
                  checked={axis.dataPointsVisible}
                  onChange={(e) =>
                    setAxis((prev) => ({ ...prev, dataPointsVisible: e.target.checked }))
                  }
                />
                <span>Show Points</span>
              </label>
            </div>
          </div>

          {/* Custom Points Creator */}
          <div className="lib-graph__card">
            <h3 className="lib-graph__card-title">Add Custom Point (x, y)</h3>
            <div className="lib-graph__point-inputs">
              <input
                type="number"
                step="0.5"
                placeholder="X"
                value={ptX}
                className="lib-graph__num-input"
                onChange={(e) => setPtX(e.target.value)}
              />
              <input
                type="number"
                step="0.5"
                placeholder="Y"
                value={ptY}
                className="lib-graph__num-input"
                onChange={(e) => setPtY(e.target.value)}
              />
              <Button icon={Plus} size="sm" onClick={handleAddPoint}>
                Add
              </Button>
            </div>
            <div className="lib-graph__points-pills">
              {customPoints.map((pt) => (
                <div key={pt.id} className="lib-graph__pt-pill">
                  <span>({pt.x.toFixed(1)}, {pt.y.toFixed(1)})</span>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomPoints((prev) => prev.filter((x) => x.id !== pt.id))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Graph Notes Modal */}
      <GraphNotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        topicKey="custom-equation"
      />
    </div>
  );
}
