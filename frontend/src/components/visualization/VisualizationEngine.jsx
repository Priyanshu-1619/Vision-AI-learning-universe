import { useState, useMemo, useCallback } from 'react';
import { getVisualizationConfig } from './visualizationRegistry';
import VisualizationToolbar from './VisualizationToolbar';
import GraphEngine from './GraphEngine';
import ParameterSlider from './ParameterSlider';
import DatasetExplorer from './DatasetExplorer';
import AnimationController from './AnimationController';
import StepController from './StepController';
import FormulaRenderer from './FormulaRenderer';
import MetricsPanel from './MetricsPanel';
import ExplanationPanel from './ExplanationPanel';
import GraphNotesModal from './GraphNotesModal';
import EquationCustomizerModal from './EquationCustomizerModal';
import './VisualizationEngine.css';

/**
 * Reusable Universal Visualization Engine.
 * Powering interactive educational concepts across Data Science, Machine Learning, and Deep Learning.
 */
export default function VisualizationEngine({
  topicId,
  config: customConfig,
  className = '',
}) {
  const config = useMemo(
    () => customConfig || getVisualizationConfig(topicId) || null,
    [customConfig, topicId]
  );

  // Initialize parameters from config defaults
  const initialParams = useMemo(() => {
    if (!config?.parameters) return {};
    const map = {};
    for (const p of config.parameters) {
      map[p.name] = p.default ?? p.min;
    }
    return map;
  }, [config]);

  const [parameters, setParameters] = useState(initialParams);
  const [activePresetId, setActivePresetId] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => config?.datasets?.[0]?.id || null);

  // Graph Notes & Custom Equation Modals
  const [isGraphNotesOpen, setIsGraphNotesOpen] = useState(false);
  const [isCustomizeEqOpen, setIsCustomizeEqOpen] = useState(false);

  // Custom Equations & Axis customization state
  const [customEquations, setCustomEquations] = useState([]);
  const [customPoints, setCustomPoints] = useState([]);
  const [axisSettings, setAxisSettings] = useState({
    xMin: config?.defaultAxis?.xMin ?? -10,
    xMax: config?.defaultAxis?.xMax ?? 10,
    yMin: config?.defaultAxis?.yMin ?? -10,
    yMax: config?.defaultAxis?.yMax ?? 10,
    gridVisible: true,
    dataPointsVisible: true,
    xLabel: 'X',
    yLabel: 'Y',
  });

  // Animation / Step state (if applicable)
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);

  // Update a single parameter value
  const handleParamChange = useCallback((name, val) => {
    setParameters((prev) => ({ ...prev, [name]: val }));
    setActivePresetId(null);
  }, []);

  // Apply a preset
  const handleSelectPreset = useCallback((preset) => {
    setActivePresetId(preset.id);
    if (preset.params) {
      setParameters((prev) => ({ ...prev, ...preset.params }));
    }
  }, []);

  // Reset to initial defaults
  const handleReset = useCallback(() => {
    setParameters(initialParams);
    setActivePresetId(null);
    setCurrentStep(0);
    setIsPlaying(false);
    setCustomEquations([]);
    setCustomPoints([]);
    setAxisSettings({
      xMin: config?.defaultAxis?.xMin ?? -10,
      xMax: config?.defaultAxis?.xMax ?? 10,
      yMin: config?.defaultAxis?.yMin ?? -10,
      yMax: config?.defaultAxis?.yMax ?? 10,
      gridVisible: true,
      dataPointsVisible: true,
      xLabel: 'X',
      yLabel: 'Y',
    });
  }, [initialParams, config]);

  // Active dataset reference
  const activeDataset = useMemo(() => {
    if (!config?.datasets || config.datasets.length === 0) return null;
    return config.datasets.find((d) => d.id === selectedDatasetId) || config.datasets[0];
  }, [config, selectedDatasetId]);

  // Execute mathematical computation
  const computed = useMemo(() => {
    if (!config?.compute) return { graphData: {}, metrics: [], explanation: {} };
    return config.compute(parameters, activeDataset, currentStep);
  }, [config, parameters, activeDataset, currentStep]);

  if (!config) {
    return (
      <div className={`viz-engine-empty ${className}`}>
        <p>No visualization configuration registered for topic <code>{topicId}</code>.</p>
      </div>
    );
  }

  return (
    <div className={`viz-engine fade-in ${className}`}>
      {/* 1. Header Toolbar */}
      <VisualizationToolbar
        title={config.title}
        domain={config.domain}
        subtitle={config.subtitle}
        presets={config.presets}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onReset={handleReset}
        onOpenGraphNotes={() => setIsGraphNotesOpen(true)}
        onOpenCustomizeEquation={() => setIsCustomizeEqOpen(true)}
      />

      {/* 2. Symbolic & Substituted Mathematical Formula */}
      {(config.formula || config.formulas) && (
        <FormulaRenderer
          formula={config.formula}
          formulas={config.formulas}
          substituted={computed.substituted}
          variables={parameters}
        />
      )}

      {/* 3. Main Visualization + Controls Grid */}
      <div className="viz-engine__workspace">
        {/* Graph Display Area */}
        <div className="viz-engine__graph-area">
          <GraphEngine
            type={config.visualizationType}
            data={computed.graphData || {}}
            parameters={parameters}
            domain={config.domain}
            customEquations={customEquations}
            axisSettings={axisSettings}
            customPoints={customPoints}
          />

          {/* Stepper or Animation Controller if configured */}
          {config.isStepped && (
            <StepController
              currentStep={currentStep}
              totalSteps={config.totalSteps || 5}
              stepNames={config.stepNames}
              onStepChange={setCurrentStep}
              onReset={() => setCurrentStep(0)}
            />
          )}

          {config.isAnimated && (
            <AnimationController
              isPlaying={isPlaying}
              onPlayToggle={() => setIsPlaying((p) => !p)}
              speed={speed}
              onSpeedChange={setSpeed}
              progress={computed.progress || 0}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Interactive Controls & Dataset Sidebar */}
        <div className="viz-engine__controls-sidebar">
          {config.datasets && config.datasets.length > 0 && (
            <DatasetExplorer
              datasets={config.datasets}
              selectedId={selectedDatasetId}
              onSelectDataset={setSelectedDatasetId}
              stats={computed.datasetStats}
            />
          )}

          {config.parameters && config.parameters.length > 0 && (
            <div className="viz-engine__sliders-group">
              <span className="viz-engine__group-title">Adjustable Parameters</span>
              {config.parameters.map((p) => (
                <ParameterSlider
                  key={p.name}
                  name={p.name}
                  label={p.label}
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  unit={p.unit}
                  defaultValue={p.default}
                  value={parameters[p.name] ?? p.default ?? p.min}
                  onChange={(val) => handleParamChange(p.name, val)}
                  description={p.description}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Real-time Calculated Metrics Display */}
      {computed.metrics && computed.metrics.length > 0 && (
        <MetricsPanel metrics={computed.metrics} />
      )}

      {/* 5. 4-Part Pedagogical Explanation Panel */}
      {computed.explanation && (
        <ExplanationPanel
          whatChanged={computed.explanation.whatChanged}
          why={computed.explanation.why}
          mathematics={computed.explanation.mathematics}
          takeaway={computed.explanation.takeaway}
          domain={config.domain}
        />
      )}

      {/* 6. Graph Notes Drawer Modal */}
      <GraphNotesModal
        isOpen={isGraphNotesOpen}
        onClose={() => setIsGraphNotesOpen(false)}
        topicKey={topicId || config.id || 'custom-equation'}
      />

      {/* 7. Customize Equation Modal */}
      <EquationCustomizerModal
        isOpen={isCustomizeEqOpen}
        onClose={() => setIsCustomizeEqOpen(false)}
        equations={customEquations}
        onUpdateEquations={setCustomEquations}
        axisSettings={axisSettings}
        onUpdateAxisSettings={setAxisSettings}
        variables={parameters}
        onUpdateVariables={setParameters}
        customPoints={customPoints}
        onUpdateCustomPoints={setCustomPoints}
        onResetDefaults={handleReset}
      />
    </div>
  );
}

