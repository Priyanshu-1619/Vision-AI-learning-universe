import { RotateCcw, BookOpen } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

/**
 * Shared structural frame enforcing the consistent Phase 3 learning flow across all 5 labs:
 *   Algorithm -> Dataset -> Controls -> Visualization -> Algorithm Steps -> Metrics -> Math Explanation
 */
export default function LaboratoryLayout({
  config,
  datasetControls,
  parameterControls,
  actionButtons,
  extraLeftPanels,
  stageTitle,
  stageSubtitle,
  stageHeaderExtra,
  loading,
  error,
  onRetry,
  onReset,
  visualization,
  metrics,
  extraStagePanels,
}) {
  return (
    <div className="lab-module-grid">
      {/* Left Rail: Dataset -> Controls -> Steps */}
      <div className="lab-module__controls">
        {/* Dataset + Parameter Controls */}
        <Card hoverable={false} className="lab-panel-card">
          <div className="lab-panel-card__header">
            <h3>Dataset & Hyperparameters</h3>
            {onReset && (
              <Button
                variant="ghost"
                icon={RotateCcw}
                onClick={onReset}
                title="Reset experiment to defaults"
              >
                Reset
              </Button>
            )}
          </div>

          {datasetControls && (
            <div className="lab-section-block">
              <div className="lab-section-kicker">Dataset</div>
              {datasetControls}
            </div>
          )}

          {parameterControls && (
            <div className="lab-section-block">
              <div className="lab-section-kicker">Controls</div>
              {parameterControls}
            </div>
          )}

          {actionButtons && (
            <div className="lab-actions-row">{actionButtons}</div>
          )}
        </Card>

        {extraLeftPanels}

        {/* Algorithm Steps */}
        <Card hoverable={false} className="lab-panel-card">
          <div className="lab-panel-card__header">
            <h3>Algorithm Steps</h3>
            <Badge text={config.badge || 'sklearn Pipeline'} color="#10b981" size="sm" />
          </div>
          <ol className="lab-algorithm-steps">
            {(config.steps || []).map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </Card>
      </div>

      {/* Right Stage: Visualization -> Metrics -> Mathematical Explanation */}
      <div className="lab-module__stage">
        <Card hoverable={false} className="lab-panel-card lab-panel-card--stage">
          <div className="lab-stage__header">
            <div>
              <h3>{stageTitle}</h3>
              {stageSubtitle && <p className="lab-stage__desc">{stageSubtitle}</p>}
            </div>
            <div className="lab-stage__header-right">
              {stageHeaderExtra}
              {loading && (
                <span className="lab-computing-badge">Computing in sklearn...</span>
              )}
            </div>
          </div>

          {error && (
            <div className="lab-error-banner" role="alert">
              <span>{error}</span>
              {onRetry && (
                <Button variant="ghost" onClick={onRetry} style={{ padding: '4px 10px' }}>
                  Retry
                </Button>
              )}
            </div>
          )}

          {/* Visualization */}
          <div className="lab-stage__chart">{visualization}</div>

          {/* Metrics */}
          {metrics && <div className="lab-metrics-strip">{metrics}</div>}

          {extraStagePanels}

          {/* Mathematical Explanation */}
          {config.math && (
            <div className="lab-explanation-box">
              <div className="lab-explanation-box__head">
                <BookOpen size={15} color="#38bdf8" />
                <span>Mathematical Intuition</span>
              </div>
              {config.math.formulas && config.math.formulas.length > 0 && (
                <div className="lab-explanation-box__formulas">
                  {config.math.formulas.map((f, idx) => (
                    <code key={idx} className="lab-formula-pill">
                      {f}
                    </code>
                  ))}
                </div>
              )}
              <p className="lab-explanation-box__text">{config.math.explanation}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function LabMetricCard({ label, value, sub, color = '#38bdf8' }) {
  return (
    <div className="lab-metric-card">
      <span className="lab-metric-card__label">{label}</span>
      <span className="lab-metric-card__val" style={{ color }}>
        {value}
      </span>
      {sub && <span className="lab-metric-card__sub">{sub}</span>}
    </div>
  );
}

export function LabSlider({ id, label, value, displayValue, min, max, step, onChange }) {
  return (
    <div className="lab-control-group">
      <div className="lab-slider-head">
        <label htmlFor={id}>{label}</label>
        <span className="lab-slider-val">{displayValue ?? value}</span>
      </div>
      <input
        id={id}
        type="range"
        className="lab-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function LabSelect({ id, label, value, options, onChange }) {
  return (
    <div className="lab-control-group">
      <label className="lab-control-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="lab-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) =>
          typeof opt === 'string' ? (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ) : (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

export function LabToggle({ id, label, checked, onChange, hint }) {
  return (
    <div className="lab-control-group">
      <label className="lab-toggle-row" htmlFor={id}>
        <span>{label}</span>
        <input
          id={id}
          type="checkbox"
          className="lab-toggle-checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
      {hint && <span className="lab-control-hint">{hint}</span>}
    </div>
  );
}
