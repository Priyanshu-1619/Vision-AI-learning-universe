import './MetricsPanel.css';

/**
 * Reusable Metrics Display Panel for Visualization Engine.
 * Shows real-time calculated metrics, formulas, and delta trends.
 */
export default function MetricsPanel({
  metrics = [],
  title = 'Live Mathematical Metrics',
  columns = 4,
  className = '',
}) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className={`metrics-panel ${className}`}>
      {title && <span className="metrics-panel__title">{title}</span>}

      <div
        className="metrics-panel__grid"
        style={{
          gridTemplateColumns: `repeat(${Math.min(columns, metrics.length)}, minmax(0, 1fr))`,
        }}
      >
        {metrics.map((m) => {
          const accentColor = m.color || 'var(--accent-cyan, #06b6d4)';
          return (
            <div
              key={m.id || m.label}
              className="metric-card"
              style={{ '--metric-accent': accentColor }}
            >
              <div className="metric-card__head">
                <span className="metric-card__label">{m.label}</span>
                {m.badge && (
                  <span
                    className="metric-card__badge"
                    style={{
                      background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                      color: accentColor,
                      borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
                    }}
                  >
                    {m.badge}
                  </span>
                )}
              </div>

              <div className="metric-card__val-row">
                <span className="metric-card__value">
                  {typeof m.value === 'number'
                    ? Number.isInteger(m.value)
                      ? m.value
                      : m.value.toFixed(m.decimals ?? 3)
                    : String(m.value)}
                </span>
                {m.unit && <span className="metric-card__unit">{m.unit}</span>}
              </div>

              {m.description && (
                <span className="metric-card__desc">{m.description}</span>
              )}

              {m.formula && (
                <code className="metric-card__formula">{m.formula}</code>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

