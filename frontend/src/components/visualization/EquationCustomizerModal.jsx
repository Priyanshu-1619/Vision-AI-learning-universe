import { useState, useMemo } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  X,
} from 'lucide-react';
import Button from '../common/Button';
import {
  compileEquation,
  EQUATION_PRESETS,
} from '../../utils/safeMathParser';
import './EquationCustomizerModal.css';

const PRESET_COLORS = ['#164BFF', '#FACC15', '#06B6D4', '#EC4899', '#10B981', '#8B5CF6'];

export default function EquationCustomizerModal({
  isOpen,
  onClose,
  equations = [],
  onUpdateEquations,
  axisSettings = {
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
    gridVisible: true,
    dataPointsVisible: true,
    xLabel: 'X',
    yLabel: 'Y',
  },
  onUpdateAxisSettings,
  variables = {},
  onUpdateVariables,
  customPoints = [],
  onUpdateCustomPoints,
  onResetDefaults,
}) {
  const [activeTab, setActiveTab] = useState('equations'); // 'equations' | 'axes' | 'points'
  const [newEqInput, setNewEqInput] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [inputError, setInputError] = useState(null);

  // New point input state
  const [pointX, setPointX] = useState(0);
  const [pointY, setPointY] = useState(0);

  // Validate current new equation input on the fly
  const validationResult = useMemo(() => {
    if (!newEqInput.trim()) return null;
    return compileEquation(newEqInput);
  }, [newEqInput]);

  if (!isOpen) return null;

  // Add new equation
  const handleAddEquation = () => {
    if (!newEqInput.trim()) return;
    const res = compileEquation(newEqInput);
    if (res.error) {
      setInputError(res.error);
      return;
    }
    setInputError(null);
    const color = PRESET_COLORS[equations.length % PRESET_COLORS.length];
    const newEq = {
      id: `eq-${Date.now()}`,
      raw: newEqInput.trim(),
      color,
      visible: true,
      label: newEqInput.trim(),
    };
    onUpdateEquations([...equations, newEq]);
    setNewEqInput('');
  };

  // Select Preset
  const handleSelectPreset = (presetId) => {
    setSelectedPresetId(presetId);
    const p = EQUATION_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setNewEqInput(p.equation);
      setInputError(null);
      if (p.defaultParams && onUpdateVariables) {
        onUpdateVariables((prev) => ({ ...prev, ...p.defaultParams }));
      }
    }
  };

  // Toggle equation visibility
  const handleToggleEqVisibility = (id) => {
    onUpdateEquations(
      equations.map((eq) => (eq.id === id ? { ...eq, visible: !eq.visible } : eq))
    );
  };

  // Delete equation
  const handleDeleteEquation = (id) => {
    onUpdateEquations(equations.filter((eq) => eq.id !== id));
  };

  // Modify equation text
  const handleEditEquationRaw = (id, newRaw) => {
    const res = compileEquation(newRaw);
    onUpdateEquations(
      equations.map((eq) =>
        eq.id === id ? { ...eq, raw: newRaw, error: res.error || null } : eq
      )
    );
  };

  // Add custom point
  const handleAddPoint = () => {
    const x = parseFloat(pointX);
    const y = parseFloat(pointY);
    if (!Number.isNaN(x) && !Number.isNaN(y)) {
      onUpdateCustomPoints([...customPoints, { x, y, id: `pt-${Date.now()}` }]);
      setPointX(0);
      setPointY(0);
    }
  };

  const handleRemovePoint = (id) => {
    onUpdateCustomPoints(customPoints.filter((p) => p.id !== id));
  };

  return (
    <div className="eq-modal-backdrop" onClick={onClose}>
      <div
        className="eq-modal-card fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Customize Equations and Graph Axes"
      >
        {/* Header */}
        <div className="eq-modal__header">
          <div className="eq-modal__header-left">
            <div className="eq-modal__icon-box">
              <Sliders size={20} className="text-icy" />
            </div>
            <div>
              <h2 className="eq-modal__title">Customize Equation &amp; Graph</h2>
              <p className="eq-modal__subtitle">
                Enter mathematical expressions, tune coefficients, adjust scale limits, and plot reference points.
              </p>
            </div>
          </div>
          <button type="button" className="eq-modal__close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="eq-modal__tabs">
          <button
            type="button"
            className={`eq-modal__tab ${activeTab === 'equations' ? 'eq-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('equations')}
          >
            Mathematical Equations ({equations.length})
          </button>
          <button
            type="button"
            className={`eq-modal__tab ${activeTab === 'axes' ? 'eq-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('axes')}
          >
            Axis Limits &amp; Grid
          </button>
          <button
            type="button"
            className={`eq-modal__tab ${activeTab === 'points' ? 'eq-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('points')}
          >
            Data Points ({customPoints.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="eq-modal__body">
          {activeTab === 'equations' && (
            <div className="eq-modal__section">
              {/* Preset Selector */}
              <div className="eq-modal__field">
                <label className="eq-modal__label">Choose an Educational Preset:</label>
                <select
                  className="eq-modal__select"
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                >
                  <option value="">-- Select Preset Equation --</option>
                  {EQUATION_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.latex})
                    </option>
                  ))}
                </select>
              </div>

              {/* Add New Equation Input */}
              <div className="eq-modal__field">
                <label className="eq-modal__label">
                  Enter Equation: <span className="eq-modal__hint">(e.g. y = mx + c, 2*x + 1, x^2 - 4, sin(x), 1/(1+exp(-x)))</span>
                </label>
                <div className="eq-modal__input-row">
                  <input
                    type="text"
                    className={`eq-modal__input ${validationResult?.error ? 'eq-modal__input--error' : ''}`}
                    placeholder="y = 2*x + 1"
                    value={newEqInput}
                    onChange={(e) => {
                      setNewEqInput(e.target.value);
                      setInputError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEquation()}
                  />
                  <Button icon={Plus} onClick={handleAddEquation} disabled={!newEqInput.trim()}>
                    Add Curve
                  </Button>
                </div>
                {inputError && (
                  <div className="eq-modal__error-msg">
                    <AlertCircle size={14} />
                    <span>{inputError}</span>
                  </div>
                )}
                {validationResult?.error && !inputError && (
                  <div className="eq-modal__error-msg">
                    <AlertCircle size={14} />
                    <span>{validationResult.error}</span>
                  </div>
                )}
              </div>

              {/* Active Equations List */}
              <div className="eq-modal__active-list">
                <span className="eq-modal__section-title">Active Curves on Graph</span>
                {equations.length === 0 ? (
                  <p className="text-subtle">No equations currently added. Enter one above or select a preset.</p>
                ) : (
                  equations.map((eq, idx) => (
                    <div key={eq.id} className="eq-item">
                      <div className="eq-item__color-tag" style={{ background: eq.color }} />
                      <div className="eq-item__body">
                        <span className="eq-item__index">y_{idx + 1}(x) =</span>
                        <input
                          type="text"
                          className="eq-item__input"
                          value={eq.raw}
                          onChange={(e) => handleEditEquationRaw(eq.id, e.target.value)}
                        />
                      </div>
                      <div className="eq-item__actions">
                        <button
                          type="button"
                          className="eq-item__btn"
                          title={eq.visible ? 'Hide Curve' : 'Show Curve'}
                          onClick={() => handleToggleEqVisibility(eq.id)}
                        >
                          {eq.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          type="button"
                          className="eq-item__btn eq-item__btn--delete"
                          title="Remove Equation"
                          onClick={() => handleDeleteEquation(eq.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Adjustable Variables / Coefficients Sliders */}
              {Object.keys(variables).length > 0 && (
                <div className="eq-modal__vars-section">
                  <span className="eq-modal__section-title">Parameters &amp; Coefficients</span>
                  <div className="eq-modal__vars-grid">
                    {Object.entries(variables).map(([name, val]) => (
                      <div key={name} className="eq-var-card">
                        <div className="eq-var-card__head">
                          <span className="eq-var-card__name">{name}</span>
                          <span className="eq-var-card__val">{Number(val).toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={-10}
                          max={10}
                          step={0.1}
                          value={val}
                          className="eq-var-card__slider"
                          onChange={(e) =>
                            onUpdateVariables((prev) => ({
                              ...prev,
                              [name]: parseFloat(e.target.value),
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'axes' && (
            <div className="eq-modal__section">
              <span className="eq-modal__section-title">Coordinate Limits &amp; Visibility</span>
              <div className="eq-modal__axes-grid">
                <div className="eq-axis-field">
                  <label>X-Axis Minimum:</label>
                  <input
                    type="number"
                    className="eq-modal__num-input"
                    value={axisSettings.xMin}
                    onChange={(e) =>
                      onUpdateAxisSettings((prev) => ({
                        ...prev,
                        xMin: parseFloat(e.target.value) || -10,
                      }))
                    }
                  />
                </div>
                <div className="eq-axis-field">
                  <label>X-Axis Maximum:</label>
                  <input
                    type="number"
                    className="eq-modal__num-input"
                    value={axisSettings.xMax}
                    onChange={(e) =>
                      onUpdateAxisSettings((prev) => ({
                        ...prev,
                        xMax: parseFloat(e.target.value) || 10,
                      }))
                    }
                  />
                </div>
                <div className="eq-axis-field">
                  <label>Y-Axis Minimum:</label>
                  <input
                    type="number"
                    className="eq-modal__num-input"
                    value={axisSettings.yMin}
                    onChange={(e) =>
                      onUpdateAxisSettings((prev) => ({
                        ...prev,
                        yMin: parseFloat(e.target.value) || -10,
                      }))
                    }
                  />
                </div>
                <div className="eq-axis-field">
                  <label>Y-Axis Maximum:</label>
                  <input
                    type="number"
                    className="eq-modal__num-input"
                    value={axisSettings.yMax}
                    onChange={(e) =>
                      onUpdateAxisSettings((prev) => ({
                        ...prev,
                        yMax: parseFloat(e.target.value) || 10,
                      }))
                    }
                  />
                </div>
                <div className="eq-axis-field">
                  <label>X-Axis Label:</label>
                  <input
                    type="text"
                    className="eq-modal__input"
                    value={axisSettings.xLabel || 'X'}
                    onChange={(e) =>
                      onUpdateAxisSettings((prev) => ({
                        ...prev,
                        xLabel: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="eq-axis-field">
                  <label>Y-Axis Label:</label>
                  <input
                    type="text"
                    className="eq-modal__input"
                    value={axisSettings.yLabel || 'Y'}
                    onChange={(e) =>
                      onUpdateAxisSettings((prev) => ({
                        ...prev,
                        yLabel: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="eq-modal__toggles">
                <label className="eq-toggle-item">
                  <input
                    type="checkbox"
                    checked={axisSettings.gridVisible}
                    onChange={(e) =>
                      onUpdateAxisSettings((prev) => ({
                        ...prev,
                        gridVisible: e.target.checked,
                      }))
                    }
                  />
                  <span>Show Coordinate Grid</span>
                </label>
                <label className="eq-toggle-item">
                  <input
                    type="checkbox"
                    checked={axisSettings.dataPointsVisible}
                    onChange={(e) =>
                      onUpdateAxisSettings((prev) => ({
                        ...prev,
                        dataPointsVisible: e.target.checked,
                      }))
                    }
                  />
                  <span>Show Reference Data Points</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'points' && (
            <div className="eq-modal__section">
              <span className="eq-modal__section-title">Plot Custom Coordinates (x, y)</span>
              <p className="text-subtle">
                Add physical points to test intersection, observe residuals, or compare model predictions against raw values.
              </p>
              <div className="eq-modal__point-row">
                <div className="eq-point-input-box">
                  <label>X Coordinate:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pointX}
                    className="eq-modal__num-input"
                    onChange={(e) => setPointX(e.target.value)}
                  />
                </div>
                <div className="eq-point-input-box">
                  <label>Y Coordinate:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pointY}
                    className="eq-modal__num-input"
                    onChange={(e) => setPointY(e.target.value)}
                  />
                </div>
                <Button icon={Plus} onClick={handleAddPoint}>
                  Add Point
                </Button>
              </div>

              <div className="eq-modal__points-list">
                {customPoints.length === 0 ? (
                  <p className="text-subtle">No custom points added yet.</p>
                ) : (
                  customPoints.map((pt, idx) => (
                    <div key={pt.id || idx} className="eq-point-chip">
                      <span>
                        P{idx + 1}: ({pt.x.toFixed(2)}, {pt.y.toFixed(2)})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePoint(pt.id || idx)}
                        className="eq-point-del-btn"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="eq-modal__footer">
          <Button variant="secondary" icon={RotateCcw} onClick={onResetDefaults}>
            Reset to Original
          </Button>
          <Button onClick={onClose}>Apply &amp; Close</Button>
        </div>
      </div>
    </div>
  );
}
