import { RotateCcw, Sparkles } from 'lucide-react';
import './VisualizationToolbar.css';

/**
 * Top toolbar for Visualization Engine.
 * Houses topic titles, domain badges, interactive presets, and reset buttons.
 */
export default function VisualizationToolbar({
  title,
  domain = 'machine-learning',
  subtitle = '',
  presets = [],
  activePresetId = null,
  onSelectPreset,
  onReset,
  extraActions = null,
  className = '',
}) {
  const domainColors = {
    'data-science': {
      label: 'Data Science',
      color: 'var(--ds-accent, #06b6d4)',
      bg: 'rgba(6, 182, 212, 0.12)',
    },
    'machine-learning': {
      label: 'Machine Learning',
      color: 'var(--ml-accent, #164BFF)',
      bg: 'rgba(22, 75, 255, 0.15)',
    },
    'deep-learning': {
      label: 'Deep Learning',
      color: 'var(--dl-accent, #8b5cf6)',
      bg: 'rgba(139, 92, 246, 0.15)',
    },
  };

  const domainInfo = domainColors[domain] || domainColors['machine-learning'];

  return (
    <div className={`viz-toolbar ${className}`}>
      <div className="viz-toolbar__info">
        <div className="viz-toolbar__badges">
          <span
            className="viz-toolbar__domain-badge"
            style={{
              color: domainInfo.color,
              background: domainInfo.bg,
              borderColor: domainInfo.color,
            }}
          >
            {domainInfo.label}
          </span>
          <span className="viz-toolbar__engine-badge">
            <Sparkles size={11} />
            Visualization Engine
          </span>
        </div>

        <h2 className="viz-toolbar__title">{title}</h2>
        {subtitle && <p className="viz-toolbar__subtitle">{subtitle}</p>}
      </div>

      <div className="viz-toolbar__actions">
        {presets && presets.length > 0 && (
          <div className="viz-toolbar__presets" role="group" aria-label="Visual Presets">
            <span className="viz-toolbar__preset-label">Presets:</span>
            {presets.map((p) => {
              const isActive = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`viz-preset-btn ${isActive ? 'viz-preset-btn--active' : ''}`}
                  onClick={() => onSelectPreset && onSelectPreset(p)}
                  title={p.description || p.label}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}

        {onReset && (
          <button
            type="button"
            className="viz-reset-btn"
            onClick={onReset}
            title="Reset all parameters and views"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}

        {extraActions}
      </div>
    </div>
  );
}

