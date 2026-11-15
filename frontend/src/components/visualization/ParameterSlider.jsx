import { RotateCcw } from 'lucide-react';
import './ParameterSlider.css';

/**
 * Reusable Parameter Slider Component for Visualization Engine.
 * Supports smooth slider dragging, direct numeric entry, and default reset.
 */
export default function ParameterSlider({
  name,
  label,
  min = 0,
  max = 10,
  step = 0.1,
  value,
  defaultValue,
  unit = '',
  onChange,
  description = '',
  disabled = false,
  className = '',
}) {
  const isDefault = defaultValue !== undefined && Math.abs(value - defaultValue) < 1e-6;

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!Number.isNaN(val) && onChange) {
      onChange(val);
    }
  };

  const handleInputChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!Number.isNaN(val) && onChange) {
      const clamped = Math.max(min, Math.min(max, val));
      onChange(clamped);
    }
  };

  const handleReset = () => {
    if (defaultValue !== undefined && onChange) {
      onChange(defaultValue);
    }
  };

  // Calculate percentage fill for track gradient
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className={`param-slider ${disabled ? 'param-slider--disabled' : ''} ${className}`}>
      <div className="param-slider__header">
        <div className="param-slider__label-group">
          <label htmlFor={`param-${name}`} className="param-slider__label">
            {label || name}
          </label>
          {description && <span className="param-slider__desc">{description}</span>}
        </div>

        <div className="param-slider__value-group">
          <input
            id={`input-${name}`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number.isInteger(step) ? value : Number(value.toFixed(2))}
            onChange={handleInputChange}
            disabled={disabled}
            className="param-slider__num-input"
          />
          {unit && <span className="param-slider__unit">{unit}</span>}
          {defaultValue !== undefined && !isDefault && (
            <button
              type="button"
              className="param-slider__reset-btn"
              onClick={handleReset}
              title={`Reset to default (${defaultValue}${unit})`}
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="param-slider__track-wrap">
        <input
          id={`param-${name}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          className="param-slider__range"
          style={{
            background: `linear-gradient(to right, var(--accent-electric, #164BFF) 0%, var(--accent-electric, #164BFF) ${pct}%, rgba(255, 255, 255, 0.08) ${pct}%, rgba(255, 255, 255, 0.08) 100%)`,
          }}
        />
        <div className="param-slider__bounds">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
}

