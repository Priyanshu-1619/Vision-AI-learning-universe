import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { runLogisticRegressionLab, fetchLabDataset } from '../../api/client';
import { colorPalette, formatMetric } from '../../utils/labEngine';
import PlotlyChart from '../mathematics/PlotlyChart';
import Loading from '../common/Loading';
import LaboratoryLayout, {
  LabMetricCard,
  LabSlider,
  LabSelect,
} from './LaboratoryLayout';

const DEFAULT_PARAMS = {
  c_param: 1.0,
  max_iter: 100,
  n_samples: 160,
  noise: 0.15,
};

export default function LogisticRegressionLab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [datasetName, setDatasetName] = useState(config.defaultDataset || 'moons');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelResult, setModelResult] = useState(null);
  const [rawDataset, setRawDataset] = useState({ data: [], labels: [], feature_names: ['x1', 'x2'] });

  const cachedDsKeyRef = useRef('');
  const cachedDsRef = useRef(null);

  const executePipeline = useCallback(async (currentParams, currentDataset) => {
    setLoading(true);
    setError(null);
    try {
      const dsKey = `${currentDataset}:${currentParams.n_samples}:${currentParams.noise}`;
      let dataset = cachedDsRef.current;
      if (cachedDsKeyRef.current !== dsKey || !dataset) {
        dataset = await fetchLabDataset(
          currentDataset,
          currentParams.n_samples,
          currentParams.noise
        );
        cachedDsKeyRef.current = dsKey;
        cachedDsRef.current = dataset;
        setRawDataset(dataset);
      }

      // Combine [x1, x2, label]
      const combined = dataset.data.map((pt, i) => [pt[0], pt[1], dataset.labels[i] ?? 0]);
      const res = await runLogisticRegressionLab(combined, {
        cParam: currentParams.c_param,
        maxIter: currentParams.max_iter,
        penalty: 'l2',
      });
      setModelResult(res);
    } catch (err) {
      setError(err.message || 'Failed to fit Logistic Regression model.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      executePipeline(params, datasetName);
    }, 180);
    return () => clearTimeout(timer);
  }, [params, datasetName, executePipeline]);

  const handleReset = () => {
    cachedDsKeyRef.current = '';
    setParams(DEFAULT_PARAMS);
    setDatasetName(config.defaultDataset || 'moons');
  };

  const traces = useMemo(() => {
    if (!rawDataset.data || rawDataset.data.length === 0) return [];
    const chartTraces = [];

    // Decision probability heatmap / mesh if available
    if (modelResult?.mesh?.probabilities) {
      const { x_range, y_range, probabilities, grid_size } = modelResult.mesh;
      const xGrid = Array.from({ length: grid_size }, (_, i) =>
        x_range[0] + (i / (grid_size - 1)) * (x_range[1] - x_range[0])
      );
      const yGrid = Array.from({ length: grid_size }, (_, i) =>
        y_range[0] + (i / (grid_size - 1)) * (y_range[1] - y_range[0])
      );

      chartTraces.push({
        x: xGrid,
        y: yGrid,
        z: probabilities,
        type: 'contour',
        colorscale: [
          [0, 'rgba(56, 189, 248, 0.28)'],
          [0.5, 'rgba(15, 23, 42, 0.4)'],
          [1, 'rgba(244, 63, 94, 0.28)'],
        ],
        contours: {
          coloring: 'heatmap',
          showlines: true,
          size: 0.1,
        },
        colorbar: {
          title: 'P(y=1)',
          titleside: 'right',
          len: 0.75,
          tickfont: { color: '#94a3b8', size: 10 },
        },
        hoverinfo: 'none',
        showscale: true,
      });
    }

    // Separating line when linear: w1*x1 + w2*x2 + b = 0 => x2 = (-w1*x1 - b)/w2
    if (modelResult?.coefficients && Math.abs(modelResult.coefficients[1]) > 1e-4) {
      const [w1, w2] = modelResult.coefficients;
      const b = modelResult.intercept;
      const xs = rawDataset.data.map((p) => p[0]);
      const minX = Math.min(...xs) - 0.5;
      const maxX = Math.max(...xs) + 0.5;
      const lineX = [minX, maxX];
      const lineY = [(-w1 * minX - b) / w2, (-w1 * maxX - b) / w2];

      chartTraces.push({
        x: lineX,
        y: lineY,
        mode: 'lines',
        type: 'scatter',
        name: 'Decision Boundary (p=0.5)',
        line: { color: '#facc15', width: 2.5, dash: 'solid' },
      });
    }

    // Scatter data points
    const uniqueClasses = Array.from(new Set(rawDataset.labels));
    for (const c of uniqueClasses) {
      const classPts = rawDataset.data.filter((_, i) => rawDataset.labels[i] === c);
      chartTraces.push({
        x: classPts.map((p) => p[0]),
        y: classPts.map((p) => p[1]),
        mode: 'markers',
        type: 'scatter',
        name: `Class ${c}`,
        marker: {
          color: colorPalette[c % colorPalette.length],
          size: 7,
          opacity: 0.88,
          line: { color: '#050814', width: 1 },
        },
      });
    }

    return chartTraces;
  }, [rawDataset, modelResult]);

  const layout = useMemo(
    () => ({
      autosize: true,
      margin: { l: 48, r: 24, t: 32, b: 40 },
      plot_bgcolor: 'rgba(5, 8, 20, 0.8)',
      paper_bgcolor: 'transparent',
      xaxis: {
        title: { text: rawDataset.feature_names?.[0] || 'Feature 1', font: { color: '#94a3b8', size: 12 } },
        gridcolor: 'rgba(255, 255, 255, 0.07)',
        zerolinecolor: 'rgba(255, 255, 255, 0.15)',
        tickfont: { color: '#64748b', size: 11 },
      },
      yaxis: {
        title: { text: rawDataset.feature_names?.[1] || 'Feature 2', font: { color: '#94a3b8', size: 12 } },
        gridcolor: 'rgba(255, 255, 255, 0.07)',
        zerolinecolor: 'rgba(255, 255, 255, 0.15)',
        tickfont: { color: '#64748b', size: 11 },
      },
      legend: {
        x: 0.02,
        y: 0.98,
        font: { color: '#cbd5e1', size: 11 },
        bgcolor: 'rgba(11, 22, 51, 0.75)',
        bordercolor: 'rgba(255, 255, 255, 0.1)',
        borderwidth: 1,
      },
    }),
    [rawDataset]
  );

  return (
    <LaboratoryLayout
      config={config}
      loading={loading}
      error={error}
      onReset={handleReset}
      onRetry={() => executePipeline(params, datasetName)}
      datasetControls={
        <>
          <LabSelect
            id="logreg-dataset"
            label="Dataset Distribution"
            value={datasetName}
            options={config.datasets || []}
            onChange={setDatasetName}
          />
          <LabSlider
            id="logreg-samples"
            label="Sample Count"
            value={params.n_samples}
            min={40}
            max={300}
            step={20}
            onChange={(v) => setParams((p) => ({ ...p, n_samples: v }))}
          />
          <LabSlider
            id="logreg-noise"
            label="Label Noise"
            value={params.noise}
            displayValue={`${Math.round(params.noise * 100)}%`}
            min={0.02}
            max={0.35}
            step={0.02}
            onChange={(v) => setParams((p) => ({ ...p, noise: v }))}
          />
        </>
      }
      parameterControls={
        <>
          <LabSlider
            id="logreg-c"
            label="Inverse Regularization (C)"
            value={params.c_param}
            displayValue={params.c_param.toFixed(2)}
            min={0.05}
            max={10.0}
            step={0.1}
            onChange={(v) => setParams((p) => ({ ...p, c_param: v }))}
          />
          <LabSlider
            id="logreg-maxiter"
            label="Max Iterations"
            value={params.max_iter}
            min={10}
            max={300}
            step={10}
            onChange={(v) => setParams((p) => ({ ...p, max_iter: v }))}
          />
        </>
      }
      stageTitle="Logistic Regression Decision Boundary & Odds"
      stageSubtitle={
        modelResult?.formula ? `Fitted Model: ${modelResult.formula}` : 'Visualizing Sigmoid probability surface'
      }
      visualization={
        loading && !modelResult ? (
          <div className="lab-chart-loading">
            <Loading text="Fitting Logistic Regression via scikit-learn..." />
          </div>
        ) : (
          <PlotlyChart data={traces} layout={layout} />
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="Accuracy"
            value={modelResult ? `${(modelResult.accuracy * 100).toFixed(1)}%` : '—'}
            color="#10b981"
          />
          <LabMetricCard
            label="Log Loss"
            value={modelResult ? formatMetric(modelResult.log_loss) : '—'}
            color="#38bdf8"
          />
          <LabMetricCard
            label="Weight w₁"
            value={modelResult?.coefficients ? modelResult.coefficients[0].toFixed(3) : '—'}
            color="#facc15"
          />
          <LabMetricCard
            label="Weight w₂"
            value={modelResult?.coefficients ? modelResult.coefficients[1].toFixed(3) : '—'}
            color="#facc15"
          />
          <LabMetricCard
            label="Intercept b"
            value={modelResult ? modelResult.intercept.toFixed(3) : '—'}
            color="#cbd5e1"
          />
        </>
      }
    />
  );
}
