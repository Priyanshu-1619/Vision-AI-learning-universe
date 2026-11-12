import { Terminal } from 'lucide-react';

export default function TelemetryVisuals({ telemetry }) {
  if (!telemetry) return null;

  if (telemetry.type === 'curves') {
    const pts = telemetry.points || [];
    const svgW = 620;
    const svgH = 220;
    const pad = { l: 46, r: 22, t: 24, b: 30 };

    const minEp = pts[0]?.epoch ?? 1;
    const maxEp = pts[pts.length - 1]?.epoch ?? 20;
    const maxVal =
      Math.max(0.5, ...pts.map((p) => Math.max(p.train, p.val))) * 1.12;

    const mapX = (ep) =>
      pad.l + ((ep - minEp) / Math.max(1, maxEp - minEp)) * (svgW - pad.l - pad.r);
    const mapY = (val) =>
      svgH - pad.b - (val / maxVal) * (svgH - pad.t - pad.b);

    const trainPath = pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.epoch).toFixed(1)} ${mapY(p.train).toFixed(1)}`)
      .join(' ');
    const valPath = pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.epoch).toFixed(1)} ${mapY(p.val).toFixed(1)}`)
      .join(' ');

    return (
      <div className="assess-svg-frame">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="assess-svg">
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
            const val = frac * maxVal;
            const y = mapY(val);
            return (
              <g key={frac}>
                <line
                  x1={pad.l}
                  y1={y}
                  x2={svgW - pad.r}
                  y2={y}
                  stroke="rgba(148,163,184,0.14)"
                  strokeDasharray={frac === 0 ? undefined : '3 3'}
                />
                <text x={pad.l - 8} y={y + 4} textAnchor="end" className="assess-axis-label">
                  {val.toFixed(2)}
                </text>
              </g>
            );
          })}

          {telemetry.bestEpoch !== undefined && (
            <g>
              <line
                x1={mapX(telemetry.bestEpoch)}
                y1={pad.t}
                x2={mapX(telemetry.bestEpoch)}
                y2={svgH - pad.b}
                stroke="#10b981"
                strokeWidth="1.4"
                strokeDasharray="4 4"
              />
              <text
                x={mapX(telemetry.bestEpoch) + 5}
                y={pad.t + 12}
                fontSize="10"
                fontWeight="600"
                fill="#10b981"
              >
                Epoch {telemetry.bestEpoch}
              </text>
            </g>
          )}

          <path d={trainPath} fill="none" stroke="#06b6d4" strokeWidth="2.6" />
          <path d={valPath} fill="none" stroke="#f59e0b" strokeWidth="2.6" strokeDasharray="6 3" />

          {pts.map((p) => (
            <g key={p.epoch}>
              <circle cx={mapX(p.epoch)} cy={mapY(p.train)} r="3.4" fill="#06b6d4" />
              <circle cx={mapX(p.epoch)} cy={mapY(p.val)} r="3.4" fill="#f59e0b" />
            </g>
          ))}

          <text x={pad.l} y={svgH - 8} className="assess-axis-label">
            Epoch {minEp}
          </text>
          <text x={svgW - pad.r} y={svgH - 8} textAnchor="end" className="assess-axis-label">
            Epoch {maxEp}
          </text>

          {/* Legend */}
          <g transform={`translate(${pad.l + 8}, 14)`}>
            <line x1="0" y1="0" x2="18" y2="0" stroke="#06b6d4" strokeWidth="2.6" />
            <text x="24" y="4" fontSize="11" fill="#a5f3fc">
              {telemetry.trainLabel || 'Train'}
            </text>
            <line x1="120" y1="0" x2="138" y2="0" stroke="#f59e0b" strokeWidth="2.6" strokeDasharray="5 3" />
            <text x="144" y="4" fontSize="11" fill="#fcd34d">
              {telemetry.valLabel || 'Validation'}
            </text>
          </g>
        </svg>
      </div>
    );
  }

  if (telemetry.type === 'confusion') {
    const { tn, fp, fn, tp } = telemetry;
    const total = Math.max(1, tn + fp + fn + tp);
    const acc = (((tn + tp) / total) * 100).toFixed(1);
    const recall = tp + fn > 0 ? ((tp / (tp + fn)) * 100).toFixed(1) : '0.0';
    const prec = tp + fp > 0 ? ((tp / (tp + fp)) * 100).toFixed(1) : '0.0';

    return (
      <div className="assess-cm-wrap">
        <div className="assess-cm-grid">
          <div className="assess-cm-cell assess-cm-cell--good">
            <span>True Negative (TN)</span>
            <strong>{tn}</strong>
          </div>
          <div className="assess-cm-cell assess-cm-cell--warn">
            <span>False Positive (FP)</span>
            <strong>{fp}</strong>
          </div>
          <div className="assess-cm-cell assess-cm-cell--bad">
            <span>False Negative (FN)</span>
            <strong>{fn}</strong>
          </div>
          <div className="assess-cm-cell assess-cm-cell--good">
            <span>True Positive (TP)</span>
            <strong>{tp}</strong>
          </div>
        </div>
        <div className="assess-cm-summary">
          <div>
            <span>Raw Accuracy</span>
            <strong>{acc}%</strong>
          </div>
          <div>
            <span>Minority Recall</span>
            <strong style={{ color: Number(recall) < 20 ? '#ef4444' : '#10b981' }}>
              {recall}%
            </strong>
          </div>
          <div>
            <span>Precision</span>
            <strong>{prec}%</strong>
          </div>
        </div>
      </div>
    );
  }

  if (telemetry.type === 'bars') {
    const items = telemetry.items || [];
    const maxV = telemetry.max ?? Math.max(1, ...items.map((i) => i.value));

    return (
      <div className="assess-bars-box">
        {items.map((item) => (
          <div key={item.label} className="assess-bar-row">
            <div className="assess-bar-row__head">
              <span>{item.label}</span>
              <strong style={{ color: item.color || '#06b6d4' }}>
                {item.displayValue ?? item.value} {telemetry.unit || ''}
              </strong>
            </div>
            <div className="assess-bar-track">
              <div
                className="assess-bar-fill"
                style={{
                  width: `${Math.max(3, (item.value / maxV) * 100)}%`,
                  background: item.color || '#06b6d4',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (telemetry.type === 'traceback') {
    return (
      <div className="assess-traceback">
        <div className="assess-traceback__head">
          <Terminal size={15} />
          <span>Runtime Execution Traceback</span>
        </div>
        <div className="assess-traceback__error">{telemetry.errorType}</div>
        <p className="assess-traceback__detail">{telemetry.detail}</p>
      </div>
    );
  }

  return null;
}
