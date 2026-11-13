import './GraphEngine.css';

/**
 * Universal Graph Engine for Visualization Engine.
 * Supports:
 * - 'cartesian' / 'function-graph'
 * - 'scatter-regression'
 * - 'histogram-distribution'
 * - 'correlation-heatmap'
 * - 'vector-space'
 * - 'perceptron' / 'neuron'
 * - 'neural-network'
 * - 'clustering'
 */
export default function GraphEngine({
  type = 'function-graph',
  data = {},
  parameters = {},
  domain = 'machine-learning',
  width = 680,
  height = 300,
  onPointClick = null,
  className = '',
}) {
  // -------------------------------------------------------------
  // 1. Cartesian / Function Graph Renderer (e.g. y = mx + c)
  // -------------------------------------------------------------
  const renderCartesian = () => {
    const pad = { top: 24, right: 30, bottom: 36, left: 44 };
    const w = width;
    const h = height;

    const xMin = data.xMin ?? -10;
    const xMax = data.xMax ?? 10;
    const yMin = data.yMin ?? -10;
    const yMax = data.yMax ?? 10;

    const mapX = (x) => pad.left + ((x - xMin) / (xMax - xMin)) * (w - pad.left - pad.right);
    const mapY = (y) => h - pad.bottom - ((y - yMin) / (yMax - yMin)) * (h - pad.top - pad.bottom);

    // Compute curve path
    const fn = data.fn || ((x) => (parameters.slope ?? 2) * x + (parameters.intercept ?? 1));
    const step = (xMax - xMin) / 100;
    const pathD = [];
    for (let x = xMin; x <= xMax; x += step) {
      const y = Math.max(yMin - 10, Math.min(yMax + 10, fn(x)));
      const px = mapX(x);
      const py = mapY(y);
      pathD.push(`${pathD.length === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }

    // Secondary function (e.g. tangent, derivative, or target)
    let secPathD = null;
    if (data.secFn) {
      const secPts = [];
      for (let x = xMin; x <= xMax; x += step) {
        const y = Math.max(yMin - 10, Math.min(yMax + 10, data.secFn(x)));
        secPts.push(`${secPts.length === 0 ? 'M' : 'L'} ${mapX(x).toFixed(1)} ${mapY(y).toFixed(1)}`);
      }
      secPathD = secPts.join(' ');
    }

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="graph-svg" aria-label="Cartesian Graph">
        {/* Background Grid */}
        <g className="graph-grid">
          {Array.from({ length: 9 }).map((_, i) => {
            const vx = xMin + (i / 8) * (xMax - xMin);
            const vy = yMin + (i / 8) * (yMax - yMin);
            return (
              <g key={i}>
                <line x1={mapX(vx)} y1={pad.top} x2={mapX(vx)} y2={h - pad.bottom} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1={pad.left} y1={mapY(vy)} x2={w - pad.right} y2={mapY(vy)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <text x={mapX(vx)} y={h - pad.bottom + 16} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                  {vx.toFixed(0)}
                </text>
                <text x={pad.left - 8} y={mapY(vy) + 3} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                  {vy.toFixed(0)}
                </text>
              </g>
            );
          })}
        </g>

        {/* Origin Axes (x=0, y=0) */}
        {xMin <= 0 && xMax >= 0 && (
          <line x1={mapX(0)} y1={pad.top} x2={mapX(0)} y2={h - pad.bottom} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        )}
        {yMin <= 0 && yMax >= 0 && (
          <line x1={pad.left} y1={mapY(0)} x2={w - pad.right} y2={mapY(0)} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        )}

        {/* Function Curves */}
        {secPathD && (
          <path d={secPathD} fill="none" stroke="rgba(255, 217, 40, 0.7)" strokeWidth="2" strokeDasharray="4 4" />
        )}
        <path d={pathD.join(' ')} fill="none" stroke="var(--accent-electric, #164BFF)" strokeWidth="3" />

        {/* Specific Highlight Points (e.g. intercepts, tangents) */}
        {data.points && data.points.map((pt, i) => (
          <g key={i} className="graph-point">
            <circle cx={mapX(pt.x)} cy={mapY(pt.y)} r={pt.r || 5} fill={pt.color || 'var(--accent-icy, #65CFFF)'} stroke="#050814" strokeWidth="2" />
            {pt.label && (
              <text x={mapX(pt.x) + 8} y={mapY(pt.y) - 6} fill="#ffffff" fontSize="11" fontWeight="600">
                {pt.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    );
  };

  // -------------------------------------------------------------
  // 2. Scatter Plot & Regression Lines
  // -------------------------------------------------------------
  const renderScatterRegression = () => {
    const pad = { top: 20, right: 24, bottom: 36, left: 44 };
    const w = width;
    const h = height;

    const points = data.points || [];
    const xVals = points.map((p) => p.x);
    const yVals = points.map((p) => p.y);

    const xMin = data.xMin ?? (xVals.length ? Math.min(...xVals) - 1 : 0);
    const xMax = data.xMax ?? (xVals.length ? Math.max(...xVals) + 1 : 10);
    const yMin = data.yMin ?? (yVals.length ? Math.min(...yVals) - 2 : 0);
    const yMax = data.yMax ?? (yVals.length ? Math.max(...yVals) + 2 : 10);

    const mapX = (x) => pad.left + ((x - xMin) / (xMax - xMin || 1)) * (w - pad.left - pad.right);
    const mapY = (y) => h - pad.bottom - ((y - yMin) / (yMax - yMin || 1)) * (h - pad.top - pad.bottom);

    const slope = data.slope ?? (parameters.slope || 1);
    const intercept = data.intercept ?? (parameters.intercept || 0);

    const lineX1 = xMin;
    const lineY1 = slope * lineX1 + intercept;
    const lineX2 = xMax;
    const lineY2 = slope * lineX2 + intercept;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="graph-svg" aria-label="Scatter and Regression Plot">
        {/* Grid */}
        <line x1={pad.left} y1={h - pad.bottom} x2={w - pad.right} y2={h - pad.bottom} stroke="rgba(255,255,255,0.2)" />
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={h - pad.bottom} stroke="rgba(255,255,255,0.2)" />

        {/* Residual lines if configured */}
        {data.showResiduals && points.map((p, i) => {
          const predY = slope * p.x + intercept;
          return (
            <line
              key={`res-${i}`}
              x1={mapX(p.x)}
              y1={mapY(p.y)}
              x2={mapX(p.x)}
              y2={mapY(predY)}
              stroke="rgba(239, 68, 68, 0.45)"
              strokeDasharray="2 2"
              strokeWidth="1.2"
            />
          );
        })}

        {/* Fitted Line */}
        <line
          x1={mapX(lineX1)}
          y1={mapY(lineY1)}
          x2={mapX(lineX2)}
          y2={mapY(lineY2)}
          stroke="var(--accent-electric, #164BFF)"
          strokeWidth="3"
        />

        {/* Data Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={mapX(p.x)}
            cy={mapY(p.y)}
            r={p.r || 4.5}
            fill={p.color || (p.label !== undefined ? (p.label === 1 ? 'var(--accent-icy, #65CFFF)' : 'var(--accent-yellow, #FFD928)') : 'var(--accent-cyan, #06b6d4)')}
            stroke="#050814"
            strokeWidth="1.5"
            onClick={() => onPointClick && onPointClick(p)}
            style={{ cursor: onPointClick ? 'pointer' : 'default' }}
          >
            <title>{`(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`}</title>
          </circle>
        ))}
      </svg>
    );
  };

  // -------------------------------------------------------------
  // 3. Histogram & Normal Distribution Renderer
  // -------------------------------------------------------------
  const renderHistogram = () => {
    const pad = { top: 24, right: 24, bottom: 36, left: 44 };
    const w = width;
    const h = height;

    const bins = data.bins || [];
    const maxCount = Math.max(1, ...bins.map((b) => b.count || 0));
    const mean = data.mean ?? 0;
    const std = data.std ?? 1;

    const xMin = data.xMin ?? (bins.length ? bins[0].x0 : -4);
    const xMax = data.xMax ?? (bins.length ? bins[bins.length - 1].x1 : 4);

    const mapX = (x) => pad.left + ((x - xMin) / (xMax - xMin || 1)) * (w - pad.left - pad.right);
    const mapY = (cnt) => h - pad.bottom - (cnt / maxCount) * (h - pad.top - pad.bottom);

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="graph-svg" aria-label="Histogram and Distribution">
        {/* Bars */}
        {bins.map((b, i) => {
          const bx = mapX(b.x0);
          const bw = Math.max(2, mapX(b.x1) - bx - 2);
          const by = mapY(b.count);
          const bh = h - pad.bottom - by;
          return (
            <rect
              key={i}
              x={bx}
              y={by}
              width={bw}
              height={Math.max(0, bh)}
              fill="rgba(6, 182, 212, 0.45)"
              stroke="var(--accent-cyan, #06b6d4)"
              rx="2"
            >
              <title>{`Range: [${b.x0.toFixed(1)}, ${b.x1.toFixed(1)}], Count: ${b.count}`}</title>
            </rect>
          );
        })}

        {/* Mean Indicator */}
        <line
          x1={mapX(mean)}
          y1={pad.top}
          x2={mapX(mean)}
          y2={h - pad.bottom}
          stroke="var(--accent-yellow, #FFD928)"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <text
          x={mapX(mean) + 6}
          y={pad.top + 14}
          fill="var(--accent-yellow, #FFD928)"
          fontSize="11"
          fontWeight="700"
          fontFamily="monospace"
        >
          μ = {mean.toFixed(2)}
        </text>

        {/* ±1 Std Dev Band */}
        {std > 0 && (
          <rect
            x={mapX(mean - std)}
            y={pad.top}
            width={Math.max(0, mapX(mean + std) - mapX(mean - std))}
            height={h - pad.top - pad.bottom}
            fill="rgba(255, 217, 40, 0.08)"
            pointerEvents="none"
          />
        )}

        {/* X Axis */}
        <line x1={pad.left} y1={h - pad.bottom} x2={w - pad.right} y2={h - pad.bottom} stroke="rgba(255,255,255,0.3)" />
      </svg>
    );
  };

  // -------------------------------------------------------------
  // 4. Perceptron & Single Neuron Architecture
  // -------------------------------------------------------------
  const renderPerceptron = () => {
    const w = width;
    const h = height;

    const inputs = data.inputs || [1.0, 0.5, -0.5];
    const weights = data.weights || [0.8, 1.2, -0.9];
    const bias = data.bias ?? 0.1;
    const weightedSum = data.weightedSum ?? 1.15;
    const activation = data.activation ?? 0.76;
    const activationName = data.activationName || 'Sigmoid';

    const numInputs = inputs.length;
    const inputPositions = inputs.map((_, i) => ({
      x: 80,
      y: 60 + i * ((h - 120) / Math.max(1, numInputs - 1)),
    }));

    const sumNode = { x: w * 0.45, y: h / 2 };
    const actNode = { x: w * 0.72, y: h / 2 };
    const outNode = { x: w * 0.9, y: h / 2 };

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="graph-svg" aria-label="Perceptron Architecture">
        {/* Connection lines from inputs to summation */}
        {inputPositions.map((pos, i) => {
          const wgt = weights[i] ?? 1;
          const strokeCol = wgt >= 0 ? 'var(--accent-electric, #164BFF)' : 'var(--accent-red, #ef4444)';
          const strokeW = Math.max(1.2, Math.min(5, Math.abs(wgt) * 2));
          return (
            <g key={`edge-${i}`}>
              <line
                x1={pos.x}
                y1={pos.y}
                x2={sumNode.x}
                y2={sumNode.y}
                stroke={strokeCol}
                strokeWidth={strokeW}
                opacity="0.75"
              />
              {/* Weight label chip */}
              <rect
                x={(pos.x + sumNode.x) / 2 - 18}
                y={(pos.y + sumNode.y) / 2 - 10}
                width="36"
                height="18"
                rx="4"
                fill="#050814"
                stroke="rgba(255,255,255,0.15)"
              />
              <text
                x={(pos.x + sumNode.x) / 2}
                y={(pos.y + sumNode.y) / 2 + 3}
                fill={strokeCol}
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {wgt.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Summation to Activation */}
        <line
          x1={sumNode.x}
          y1={sumNode.y}
          x2={actNode.x}
          y2={actNode.y}
          stroke="var(--accent-icy, #65CFFF)"
          strokeWidth="3"
        />

        {/* Activation to Output */}
        <line
          x1={actNode.x}
          y1={actNode.y}
          x2={outNode.x}
          y2={outNode.y}
          stroke="var(--accent-yellow, #FFD928)"
          strokeWidth="3"
        />

        {/* Input Nodes */}
        {inputPositions.map((pos, i) => (
          <g key={`in-${i}`}>
            <circle cx={pos.x} cy={pos.y} r="22" fill="#0B1633" stroke="var(--accent-cyan, #06b6d4)" strokeWidth="2.5" />
            <text x={pos.x} y={pos.y - 2} fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">
              x{i + 1}
            </text>
            <text x={pos.x} y={pos.y + 11} fill="var(--accent-cyan, #06b6d4)" fontSize="10" fontFamily="monospace" textAnchor="middle">
              {inputs[i].toFixed(1)}
            </text>
          </g>
        ))}

        {/* Bias Input Node */}
        <g>
          <line x1={sumNode.x} y1={30} x2={sumNode.x} y2={sumNode.y} stroke="var(--accent-amber, #f59e0b)" strokeDasharray="3 3" strokeWidth="2" />
          <circle cx={sumNode.x} cy={30} r="16" fill="#0B1633" stroke="var(--accent-amber, #f59e0b)" strokeWidth="2" />
          <text x={sumNode.x} y={34} fill="var(--accent-amber, #f59e0b)" fontSize="10" fontWeight="700" textAnchor="middle">
            b={bias.toFixed(1)}
          </text>
        </g>

        {/* Summation Node (Σ) */}
        <g>
          <circle cx={sumNode.x} cy={sumNode.y} r="32" fill="#0B1633" stroke="var(--accent-icy, #65CFFF)" strokeWidth="3" />
          <text x={sumNode.x} y={sumNode.y - 6} fill="#ffffff" fontSize="18" fontWeight="800" textAnchor="middle">
            Σ
          </text>
          <text x={sumNode.x} y={sumNode.y + 13} fill="var(--accent-icy, #65CFFF)" fontSize="10" fontFamily="monospace" textAnchor="middle">
            z={weightedSum.toFixed(2)}
          </text>
        </g>

        {/* Activation Node (σ) */}
        <g>
          <circle cx={actNode.x} cy={actNode.y} r="32" fill="#0B1633" stroke="var(--accent-purple, #8b5cf6)" strokeWidth="3" />
          <text x={actNode.x} y={actNode.y - 6} fill="#ffffff" fontSize="14" fontWeight="800" textAnchor="middle">
            {activationName}
          </text>
          <text x={actNode.x} y={actNode.y + 13} fill="#c4b5fd" fontSize="10" fontFamily="monospace" textAnchor="middle">
            ŷ={activation.toFixed(3)}
          </text>
        </g>

        {/* Final Output */}
        <g>
          <circle cx={outNode.x} cy={outNode.y} r="20" fill="#0B1633" stroke="var(--accent-yellow, #FFD928)" strokeWidth="2.5" />
          <text x={outNode.x} y={outNode.y + 4} fill="var(--accent-yellow, #FFD928)" fontSize="12" fontWeight="800" textAnchor="middle">
            y
          </text>
        </g>
      </svg>
    );
  };

  // -------------------------------------------------------------
  // 5. Correlation Heatmap / Matrix
  // -------------------------------------------------------------
  const renderHeatmap = () => {
    const matrix = data.matrix || [
      [1.0, 0.85, -0.2],
      [0.85, 1.0, -0.4],
      [-0.2, -0.4, 1.0],
    ];
    const labels = data.labels || ['Feature 1', 'Feature 2', 'Feature 3'];
    const n = matrix.length;
    const pad = 60;
    const cellSize = Math.min((width - pad * 2) / n, (height - pad * 2) / n);

    const getColor = (val) => {
      // Diverging blue (-1) -> neutral (0) -> yellow/red (+1)
      if (val >= 0) {
        const a = Math.min(1, Math.max(0, val));
        return `rgba(255, 217, 40, ${0.15 + a * 0.75})`;
      }
      const a = Math.min(1, Math.max(0, -val));
      return `rgba(22, 75, 255, ${0.15 + a * 0.75})`;
    };

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="graph-svg" aria-label="Correlation Heatmap">
        <g transform={`translate(${pad}, ${pad})`}>
          {matrix.map((row, r) =>
            row.map((val, c) => (
              <g key={`${r}-${c}`} transform={`translate(${c * cellSize}, ${r * cellSize})`}>
                <rect
                  width={cellSize - 2}
                  height={cellSize - 2}
                  fill={getColor(val)}
                  stroke="rgba(255,255,255,0.1)"
                  rx="4"
                />
                <text
                  x={cellSize / 2 - 1}
                  y={cellSize / 2 + 4}
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {val.toFixed(2)}
                </text>
              </g>
            ))
          )}

          {/* Row Labels */}
          {labels.map((lbl, idx) => (
            <text
              key={`lbl-r-${idx}`}
              x="-10"
              y={idx * cellSize + cellSize / 2 + 4}
              fill="#94a3b8"
              fontSize="11"
              fontWeight="600"
              textAnchor="end"
            >
              {lbl}
            </text>
          ))}

          {/* Col Labels */}
          {labels.map((lbl, idx) => (
            <text
              key={`lbl-c-${idx}`}
              x={idx * cellSize + cellSize / 2}
              y="-10"
              fill="#94a3b8"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
            >
              {lbl}
            </text>
          ))}
        </g>
      </svg>
    );
  };

  // -------------------------------------------------------------
  // 6. Vector Space / 2D Transformations
  // -------------------------------------------------------------
  const renderVectorSpace = () => {
    const w = width;
    const h = height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) / 10;

    const v1 = data.v1 || { x: parameters.v1x ?? 3, y: parameters.v1y ?? 2, label: 'v₁', color: 'var(--accent-cyan, #06b6d4)' };
    const v2 = data.v2 || { x: parameters.v2x ?? 1, y: parameters.v2y ?? 4, label: 'v₂', color: 'var(--accent-yellow, #FFD928)' };

    // Resultant sum vector v1 + v2
    const vSum = { x: v1.x + v2.x, y: v1.y + v2.y };

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="graph-svg" aria-label="Vector Space">
        {/* Grid and Axes */}
        <line x1={0} y1={cy} x2={w} y2={cy} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <line x1={cx} y1={0} x2={cx} y2={h} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

        {/* Arrow Marker Definitions */}
        <defs>
          <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent-cyan, #06b6d4)" />
          </marker>
          <marker id="arrow-yellow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent-yellow, #FFD928)" />
          </marker>
          <marker id="arrow-electric" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent-electric, #164BFF)" />
          </marker>
        </defs>

        {/* Vector 1 */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + v1.x * scale}
          y2={cy - v1.y * scale}
          stroke={v1.color}
          strokeWidth="3"
          markerEnd="url(#arrow-cyan)"
        />
        <text
          x={cx + v1.x * scale + 10}
          y={cy - v1.y * scale}
          fill={v1.color}
          fontSize="12"
          fontWeight="700"
        >
          {v1.label} ({v1.x.toFixed(1)}, {v1.y.toFixed(1)})
        </text>

        {/* Vector 2 */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + v2.x * scale}
          y2={cy - v2.y * scale}
          stroke={v2.color}
          strokeWidth="3"
          markerEnd="url(#arrow-yellow)"
        />
        <text
          x={cx + v2.x * scale + 10}
          y={cy - v2.y * scale}
          fill={v2.color}
          fontSize="12"
          fontWeight="700"
        >
          {v2.label} ({v2.x.toFixed(1)}, {v2.y.toFixed(1)})
        </text>

        {/* Sum Vector (if configured) */}
        {data.showSum && (
          <>
            <line
              x1={cx + v1.x * scale}
              y1={cy - v1.y * scale}
              x2={cx + vSum.x * scale}
              y2={cy - vSum.y * scale}
              stroke="rgba(255, 217, 40, 0.4)"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
            <line
              x1={cx}
              y1={cy}
              x2={cx + vSum.x * scale}
              y2={cy - vSum.y * scale}
              stroke="var(--accent-electric, #164BFF)"
              strokeWidth="3"
              markerEnd="url(#arrow-electric)"
            />
            <text
              x={cx + vSum.x * scale + 10}
              y={cy - vSum.y * scale}
              fill="var(--accent-icy, #65CFFF)"
              fontSize="12"
              fontWeight="800"
            >
              v₁ + v₂ ({vSum.x.toFixed(1)}, {vSum.y.toFixed(1)})
            </text>
          </>
        )}
      </svg>
    );
  };

  // -------------------------------------------------------------
  // 7. Clustering / KNN / Multi-Cluster Scatter
  // -------------------------------------------------------------
  const renderClustering = () => {
    const pad = { top: 24, right: 30, bottom: 36, left: 44 };
    const w = width;
    const h = height;

    const points = data.points || [];
    const centroids = data.centroids || [];
    const queryPoint = data.queryPoint || null;
    const neighborLines = data.neighborLines || [];
    const radius = data.radius || null;

    const xMin = data.xMin ?? 0;
    const xMax = data.xMax ?? 10;
    const yMin = data.yMin ?? 0;
    const yMax = data.yMax ?? 10;

    const mapX = (x) => pad.left + ((x - xMin) / (xMax - xMin || 1)) * (w - pad.left - pad.right);
    const mapY = (y) => h - pad.bottom - ((y - yMin) / (yMax - yMin || 1)) * (h - pad.top - pad.bottom);

    const clusterColors = [
      'var(--accent-icy, #65CFFF)',
      'var(--accent-yellow, #FFD928)',
      'var(--accent-emerald, #10b981)',
      'var(--accent-purple, #a855f7)',
    ];

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="graph-svg" aria-label="Clustering and Classification Map">
        {/* Grid and Axes */}
        <line x1={pad.left} y1={h - pad.bottom} x2={w - pad.right} y2={h - pad.bottom} stroke="rgba(255,255,255,0.2)" />
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={h - pad.bottom} stroke="rgba(255,255,255,0.2)" />

        {/* KNN Neighbor distance lines */}
        {neighborLines.map((line, idx) => (
          <line
            key={`knn-l-${idx}`}
            x1={mapX(line.x1)}
            y1={mapY(line.y1)}
            x2={mapX(line.x2)}
            y2={mapY(line.y2)}
            stroke="var(--accent-pink, #f43f5e)"
            strokeDasharray="2 2"
            strokeWidth="1.5"
            opacity="0.8"
          />
        ))}

        {/* KNN Query Radius Circle */}
        {queryPoint && radius && (
          <circle
            cx={mapX(queryPoint.x)}
            cy={mapY(queryPoint.y)}
            r={((radius) / (xMax - xMin)) * (w - pad.left - pad.right)}
            fill="rgba(244, 63, 94, 0.08)"
            stroke="var(--accent-pink, #f43f5e)"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
        )}

        {/* Data Points */}
        {points.map((p, i) => {
          const col = clusterColors[p.cluster % clusterColors.length] || 'var(--accent-cyan, #06b6d4)';
          return (
            <circle
              key={`pt-${i}`}
              cx={mapX(p.x)}
              cy={mapY(p.y)}
              r={p.r || 4.5}
              fill={col}
              stroke="#050814"
              strokeWidth="1.5"
              onClick={() => onPointClick && onPointClick(p)}
              style={{ cursor: onPointClick ? 'pointer' : 'default' }}
            >
              <title>{`(${p.x.toFixed(2)}, ${p.y.toFixed(2)}) - Cluster ${p.cluster}`}</title>
            </circle>
          );
        })}

        {/* Centroids */}
        {centroids.map((c, i) => {
          const cx = mapX(c.x);
          const cy = mapY(c.y);
          const col = clusterColors[i % clusterColors.length];
          return (
            <g key={`cent-${i}`}>
              <circle cx={cx} cy={cy} r="14" fill="rgba(5, 8, 20, 0.85)" stroke={col} strokeWidth="2.5" />
              <polygon
                points={`${cx},${cy - 8} ${cx + 7},${cy} ${cx},${cy + 8} ${cx - 7},${cy}`}
                fill={col}
              />
              <text x={cx} y={cy + 22} fill={col} fontSize="10" fontWeight="700" textAnchor="middle">
                C{i + 1} ({c.x.toFixed(1)}, {c.y.toFixed(1)})
              </text>
            </g>
          );
        })}

        {/* Query Point (if KNN) */}
        {queryPoint && (
          <g>
            <circle cx={mapX(queryPoint.x)} cy={mapY(queryPoint.y)} r="12" fill="none" stroke="var(--accent-pink, #f43f5e)" strokeWidth="2" strokeDasharray="3 2" />
            <circle cx={mapX(queryPoint.x)} cy={mapY(queryPoint.y)} r="6" fill="var(--accent-pink, #f43f5e)" />
            <text x={mapX(queryPoint.x)} y={mapY(queryPoint.y) - 14} fill="var(--accent-pink, #f43f5e)" fontSize="11" fontWeight="800" textAnchor="middle">
              Query Test ({queryPoint.x.toFixed(1)}, {queryPoint.y.toFixed(1)})
            </text>
          </g>
        )}
      </svg>
    );
  };

  // -------------------------------------------------------------
  // 8. Multi-Layer Neural Network (Forward / Backpropagation)
  // -------------------------------------------------------------
  const renderNeuralNetwork = () => {
    const w = width;
    const h = height;

    const layers = data.layers || [
      { name: 'Input', nodes: [{ id: 'x1', label: 'x₁', val: parameters.x1 ?? 1.0 }, { id: 'x2', label: 'x₂', val: parameters.x2 ?? 0.5 }] },
      { name: 'Hidden', nodes: [{ id: 'h1', label: 'h₁', val: data.h1 ?? 0.8 }, { id: 'h2', label: 'h₂', val: data.h2 ?? 0.3 }] },
      { name: 'Output', nodes: [{ id: 'y', label: 'ŷ', val: data.pred ?? 0.72 }] },
    ];

    const colX = [90, w / 2, w - 90];

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="graph-svg" aria-label="Multi-Layer Neural Network">
        {/* Layer 1 -> Layer 2 Synapses */}
        {layers[0]?.nodes.map((inNode, i) => {
          const y1 = h / 2 + (i - 0.5) * 80;
          return layers[1]?.nodes.map((hNode, j) => {
            const y2 = h / 2 + (j - 0.5) * 80;
            return (
              <line
                key={`syn-1-${i}-${j}`}
                x1={colX[0]}
                y1={y1}
                x2={colX[1]}
                y2={y2}
                stroke={data.isBackprop ? 'var(--accent-pink, #f43f5e)' : 'var(--accent-electric, #164BFF)'}
                strokeWidth="2"
                opacity="0.65"
              />
            );
          });
        })}

        {/* Layer 2 -> Layer 3 Synapses */}
        {layers[1]?.nodes.map((hNode, i) => {
          const y1 = h / 2 + (i - 0.5) * 80;
          const y2 = h / 2;
          return (
            <line
              key={`syn-2-${i}`}
              x1={colX[1]}
              y1={y1}
              x2={colX[2]}
              y2={y2}
              stroke={data.isBackprop ? 'var(--accent-pink, #f43f5e)' : 'var(--accent-icy, #65CFFF)'}
              strokeWidth="2.5"
              opacity="0.8"
            />
          );
        })}

        {/* Nodes rendering for all layers */}
        {layers.map((layer, lIdx) => {
          const cx = colX[lIdx];
          const nodeCount = layer.nodes.length;
          return layer.nodes.map((node, nIdx) => {
            const cy = h / 2 + (nIdx - (nodeCount - 1) / 2) * 80;
            const nodeCol = lIdx === 0 ? 'var(--accent-cyan, #06b6d4)' : lIdx === 1 ? 'var(--accent-icy, #65CFFF)' : 'var(--accent-yellow, #FFD928)';
            return (
              <g key={`node-${lIdx}-${nIdx}`}>
                <circle cx={cx} cy={cy} r="24" fill="#0B1633" stroke={nodeCol} strokeWidth="2.5" />
                <text x={cx} y={cy - 2} fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">
                  {node.label}
                </text>
                <text x={cx} y={cy + 12} fill={nodeCol} fontSize="10" fontFamily="monospace" textAnchor="middle">
                  {typeof node.val === 'number' ? node.val.toFixed(2) : node.val}
                </text>
              </g>
            );
          });
        })}

        {/* Layer Headings */}
        {layers.map((layer, lIdx) => (
          <text
            key={`l-title-${lIdx}`}
            x={colX[lIdx]}
            y="26"
            fill="#94a3b8"
            fontSize="12"
            fontWeight="700"
            textAnchor="middle"
          >
            {layer.name} Layer
          </text>
        ))}
      </svg>
    );
  };

  // Route to the appropriate visual renderer
  const renderVisual = () => {
    switch (type) {
      case 'function-graph':
      case 'cartesian':
        return renderCartesian();
      case 'scatter-regression':
      case 'scatter-plot':
        return renderScatterRegression();
      case 'histogram':
      case 'histogram-distribution':
        return renderHistogram();
      case 'perceptron':
      case 'neuron':
        return renderPerceptron();
      case 'neural-network':
      case 'mlp':
        return renderNeuralNetwork();
      case 'clustering':
      case 'kmeans':
      case 'knn':
        return renderClustering();
      case 'correlation-heatmap':
      case 'matrix':
        return renderHeatmap();
      case 'vector-space':
      case 'vectors':
        return renderVectorSpace();
      default:
        return renderCartesian();
    }
  };

  return (
    <div className={`graph-engine-frame ${className}`} data-domain={domain}>
      {renderVisual()}
    </div>
  );
}
