import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play } from 'lucide-react';
import { fetchLabDataset, runLinearRegression } from '../../api/client';
import { formatMetric } from '../../utils/labEngine';
import PlotlyChart from '../mathematics/PlotlyChart';
import Button from '../common/Button';
import Loading from '../common/Loading';
import LaboratoryLayout, {
  LabMetricCard,
  LabSlider,
  LabSelect,
  LabToggle,
} from './LaboratoryLayout';

const DEFAULT_PARAMS = {
  n_samples: 150,
  noise: 0.15,
  seed: 42,
  gd_lr: 0.14,
  gd_epochs: 40,
};

export default function LinearRegressionLab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [datasetName, setDatasetName] = useState(config.defaultDataset || 'linear');
  const [showResiduals, setShowResiduals] = useState(true);
  const [showGD, setShowGD] = useState(false);
  const [gdStepIdx, setGdStepIdx] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelResult, setModelResult] = useState(null);
  const [rawPoints, setRawPoints] = useState([]);

  const executePipeline = useCallback(async (currentParams, currentDataset) => {
    setLoading(true);
    setError(null);
    try {
      const dataset = await fetchLabDataset(
        currentDataset,
        currentParams.n_samples,
        currentParams.noise,
        currentParams.seed
      );
      const points = dataset.data;
      setRawPoints(points);

      const xArr = points.map((p) => p[0]);
      const yArr = points.map((p) => p[1]);

      const result = await runLinearRegression(
        { x: xArr, y: yArr },
        {
          include_gd: true,
          gd_lr: currentParams.gd_lr,
          gd_epochs: currentParams.gd_epochs,
        }
      );
      setModelResult(result);
      if (result.gd_history && result.gd_history.length > 0) {
        setGdStepIdx(result.gd_history.length - 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to run Linear Regression on backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      executePipeline(params, datasetName);
    }, 200);
    return () => clearTimeout(timer);
  }, [params, datasetName, executePipeline]);

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setDatasetName(config.defaultDataset || 'linear');
    setShowResiduals(true);
    setShowGD(false);
  };

  const mainChartData = useMemo(() => {
    if (!rawPoints || rawPoints.length === 0) return [];
    const xVals = rawPoints.map((p) => p[0]);
    const yVals = rawPoints.map((p) => p[1]);

    const traces = [
      {
        x: xVals,
        y: yVals,
        mode: 'markers',
        type: 'scatter',
        name: 'Observations (x, y)',
        marker: {
          color: '#38bdf8',
          size: 7,
          opacity: 0.78,
          line: { color: '#0284c7', width: 1 },
        },
      },
    ];

    // Residual drop segments (draw subset when n > 120 to keep SVG/canvas crisp)
    if (showResiduals && modelResult?.predictions && modelResult.predictions.length === xVals.length) {
      const step = Math.max(1, Math.floor(xVals.length / 80));
      const resX = [];
      const resY = [];
      for (let i = 0; i < xVals.length; i += step) {
        resX.push(xVals[i], xVals[i], null);
        resY.push(yVals[i], modelResult.predictions[i], null);
      }
      traces.push({
        x: resX,
        y: resY,
        mode: 'lines',
        type: 'scatter',
        name: 'Residuals (y - ŷ)',
        line: { color: 'rgba(244, 63, 94, 0.45)', width: 1.4, dash: 'dot' },
        hoverinfo: 'skip',
      });
    }

    // Optimal OLS line from sklearn
    if (modelResult?.coefficients) {
      const [slope, intercept] = modelResult.coefficients;
      const minX = Math.min(...xVals);
      const maxX = Math.max(...xVals);
      traces.push({
        x: [minX, maxX],
        y: [slope * minX + intercept, slope * maxX + intercept],
        mode: 'lines',
        type: 'scatter',
        name: `OLS Fit: ŷ = ${formatMetric(slope, 2)}x + ${formatMetric(intercept, 2)}`,
        line: { color: '#10b981', width: 3 },
      });
    }

    // Optional Gradient Descent candidate line at selected epoch
    if (showGD && modelResult?.gd_history?.length > 0) {
      const idx = Math.min(gdStepIdx, modelResult.gd_history.length - 1);
      const step = modelResult.gd_history[idx];
      const minX = Math.min(...xVals);
      const maxX = Math.max(...xVals);
      traces.push({
        x: [minX, maxX],
        y: [step.slope * minX + step.intercept, step.slope * maxX + step.intercept],
        mode: 'lines',
        type: 'scatter',
        name: `GD Epoch ${step.epoch} (MSE ${formatMetric(step.mse, 3)})`,
        line: { color: '#f59e0b', width: 2.5, dash: 'dash' },
      });
    }

    return traces;
  }, [rawPoints, modelResult, showResiduals, showGD, gdStepIdx]);

  const residualChartData = useMemo(() => {
    if (!modelResult?.residuals || rawPoints.length !== modelResult.residuals.length) return [];
    const xVals = rawPoints.map((p) => p[0]);
    return [
      {
        x: xVals,
        y: modelResult.residuals,
        mode: 'markers',
        type: 'scatter',
        name: 'Residual (y - ŷ)',
        marker: { color: '#f43f5e', size: 6, opacity: 0.75 },
      },
    ];
  }, [rawPoints, modelResult]);

  const gdChartData = useMemo(() => {
    if (!modelResult?.gd_history || modelResult.gd_history.length === 0) return [];
    const hist = modelResult.gd_history;
    const active = hist[Math.min(gdStepIdx, hist.length - 1)];
    return [
      {
        x: hist.map((h) => h.epoch),
        y: hist.map((h) => h.mse),
        mode: 'lines+markers',
        type: 'scatter',
        name: 'GD Loss (MSE)',
        line: { color: '#f59e0b', width: 2.5 },
        marker: { size: 5 },
      },
      {
        x: [active.epoch],
        y: [active.mse],
        mode: 'markers',
        type: 'scatter',
        name: `Epoch ${active.epoch}`,
        marker: { color: '#38bdf8', size: 11, line: { color: '#fff', width: 1.5 } },
      },
    ];
  }, [modelResult, gdStepIdx]);

  const activeGd = modelResult?.gd_history?.[Math.min(gdStepIdx, (modelResult?.gd_history?.length || 1) - 1)];

  return (
    <LaboratoryLayout
      config={config}
      loading={loading}
      error={error}
      onRetry={() => executePipeline(params, datasetName)}
      onReset={handleReset}
      stageTitle="Ordinary Least Squares Fit & Residual Diagnostics"
      stageSubtitle={
        <>
          Trained via <code>sklearn.linear_model.LinearRegression</code> minimizing squared errors
        </>
      }
      datasetControls={
        <>
          <LabSelect
            id="lr-dataset-select"
            label="Dataset Distribution"
            value={datasetName}
            options={config.datasets}
            onChange={setDatasetName}
          />
          <LabSlider
            id="lr-samples-slider"
            label="Sample Count (n)"
            value={params.n_samples}
            min={50}
            max={500}
            step={25}
            onChange={(v) => setParams((p) => ({ ...p, n_samples: v }))}
          />
          <LabSlider
            id="lr-noise-slider"
            label="Gaussian Noise (σ)"
            value={params.noise}
            displayValue={params.noise.toFixed(2)}
            min={0}
            max={0.5}
            step={0.05}
            onChange={(v) => setParams((p) => ({ ...p, noise: v }))}
          />
          <LabSlider
            id="lr-seed-slider"
            label="Random Seed"
            value={params.seed}
            min={1}
            max={100}
            step={1}
            onChange={(v) => setParams((p) => ({ ...p, seed: v }))}
          />
        </>
      }
      parameterControls={
        <>
          <LabToggle
            id="lr-residuals-toggle"
            label="Visualize Residuals (y - ŷ)"
            checked={showResiduals}
            onChange={setShowResiduals}
          />
          <LabToggle
            id="lr-gd-toggle"
            label="Overlay Gradient Descent Path"
            checked={showGD}
            onChange={setShowGD}
            hint="Inspect how iterative GD converges toward the exact OLS optimum."
          />
          {showGD && modelResult?.gd_history?.length > 1 && (
            <>
              <LabSlider
                id="lr-gd-lr-slider"
                label="GD Learning Rate (η)"
                value={params.gd_lr}
                displayValue={params.gd_lr.toFixed(2)}
                min={0.02}
                max={0.45}
                step={0.02}
                onChange={(v) => setParams((p) => ({ ...p, gd_lr: v }))}
              />
              <LabSlider
                id="lr-gd-epoch-slider"
                label="Inspect GD Epoch"
                value={gdStepIdx}
                displayValue={activeGd ? `Epoch ${activeGd.epoch}` : '0'}
                min={0}
                max={modelResult.gd_history.length - 1}
                step={1}
                onChange={setGdStepIdx}
              />
            </>
          )}
        </>
      }
      actionButtons={
        <Button
          variant="primary"
          icon={Play}
          onClick={() => executePipeline(params, datasetName)}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Training...' : 'Retrain OLS Model'}
        </Button>
      }
      visualization={
        loading && !modelResult ? (
          <Loading text="Fitting OLS model in scikit-learn..." />
        ) : (
          <div className="lab-multi-chart">
            <PlotlyChart
              data={mainChartData}
              layout={{
                xaxis: { title: 'Input Feature (x)', zeroline: true },
                yaxis: { title: 'Target (y)', zeroline: true },
                margin: { t: 24, r: 20, b: 40, l: 50 },
              }}
              height={340}
            />

            {(showResiduals || showGD) && (
              <div className="lab-companion-charts">
                {showResiduals && residualChartData.length > 0 && (
                  <div className="lab-companion-chart-box">
                    <h4 className="lab-dt-chart-title">Residuals Plot (rᵢ = yᵢ - ŷᵢ)</h4>
                    <PlotlyChart
                      data={residualChartData}
                      layout={{
                        xaxis: { title: 'x' },
                        yaxis: { title: 'Error (y - ŷ)', zeroline: true },
                        margin: { t: 12, r: 16, b: 36, l: 46 },
                      }}
                      height={200}
                    />
                  </div>
                )}

                {showGD && gdChartData.length > 0 && (
                  <div className="lab-companion-chart-box">
                    <h4 className="lab-dt-chart-title">Gradient Descent MSE Convergence</h4>
                    <PlotlyChart
                      data={gdChartData}
                      layout={{
                        xaxis: { title: 'Iteration Epoch' },
                        yaxis: { title: 'MSE Loss' },
                        margin: { t: 12, r: 16, b: 36, l: 46 },
                      }}
                      height={200}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="R² Score"
            value={modelResult?.metrics ? formatMetric(modelResult.metrics.r_squared, 4) : '—'}
            sub="Explained Variance (1.0 = ideal)"
            color="#10b981"
          />
          <LabMetricCard
            label="MSE"
            value={modelResult?.metrics ? formatMetric(modelResult.metrics.mse, 4) : '—'}
            sub="Mean Squared Error"
            color="#38bdf8"
          />
          <LabMetricCard
            label="MAE"
            value={modelResult?.metrics ? formatMetric(modelResult.metrics.mae, 4) : '—'}
            sub="Mean Absolute Error"
            color="#8b5cf6"
          />
          <LabMetricCard
            label="Slope (m) & Intercept (b)"
            value={
              modelResult
                ? `${formatMetric(modelResult.slope ?? modelResult.coefficients?.[0], 3)}, ${formatMetric(modelResult.intercept ?? modelResult.coefficients?.[1], 3)}`
                : '—'
            }
            sub="Fitted Line Parameters"
            color="#f59e0b"
          />
        </>
      }
    />
  );
}
