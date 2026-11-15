import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { runRandomForestLab, fetchLabDataset } from '../../api/client';
import { colorPalette } from '../../utils/labEngine';
import PlotlyChart from '../mathematics/PlotlyChart';
import Loading from '../common/Loading';
import LaboratoryLayout, {
  LabMetricCard,
  LabSlider,
  LabSelect,
} from './LaboratoryLayout';

const DEFAULT_PARAMS = {
  n_estimators: 20,
  max_depth: 4,
  criterion: 'gini',
  n_samples: 160,
  noise: 0.15,
};

export default function RandomForestLab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [datasetName, setDatasetName] = useState(config.defaultDataset || 'moons');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rfResult, setRfResult] = useState(null);
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

      const combined = dataset.data.map((pt, i) => [pt[0], pt[1], dataset.labels[i] ?? 0]);
      const res = await runRandomForestLab(combined, {
        nEstimators: currentParams.n_estimators,
        maxDepth: currentParams.max_depth,
        criterion: currentParams.criterion,
      });
      setRfResult(res);
    } catch (err) {
      setError(err.message || 'Failed to fit Random Forest.');
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

    // Decision probability heatmap
    if (rfResult?.mesh?.probabilities) {
      const { x_range, y_range, probabilities, grid_size } = rfResult.mesh;
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
          [0, 'rgba(56, 189, 248, 0.25)'],
          [0.5, 'rgba(15, 23, 42, 0.4)'],
          [1, 'rgba(16, 185, 129, 0.25)'],
        ],
        contours: {
          coloring: 'heatmap',
          showlines: false,
        },
        colorbar: {
          title: 'Forest Vote',
          titleside: 'right',
          len: 0.75,
          tickfont: { color: '#94a3b8', size: 10 },
        },
        hoverinfo: 'none',
        showscale: true,
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
  }, [rawDataset, rfResult]);

  const layout = useMemo(
    () => ({
      autosize: true,
      margin: { l: 48, r: 24, t: 32, b: 40 },
      plot_bgcolor: 'rgba(5, 8, 20, 0.8)',
      paper_bgcolor: 'transparent',
      xaxis: {
        title: { text: rawDataset.feature_names?.[0] || 'Feature 1', font: { color: '#94a3b8', size: 12 } },
        gridcolor: 'rgba(255, 255, 255, 0.07)',
        tickfont: { color: '#64748b', size: 11 },
      },
      yaxis: {
        title: { text: rawDataset.feature_names?.[1] || 'Feature 2', font: { color: '#94a3b8', size: 12 } },
        gridcolor: 'rgba(255, 255, 255, 0.07)',
        tickfont: { color: '#64748b', size: 11 },
      },
      legend: {
        x: 0.02,
        y: 0.98,
        font: { color: '#cbd5e1', size: 11 },
        bgcolor: 'rgba(11, 22, 51, 0.75)',
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
            id="rf-dataset"
            label="Dataset Distribution"
            value={datasetName}
            options={config.datasets || []}
            onChange={setDatasetName}
          />
          <LabSlider
            id="rf-samples"
            label="Sample Count"
            value={params.n_samples}
            min={40}
            max={300}
            step={20}
            onChange={(v) => setParams((p) => ({ ...p, n_samples: v }))}
          />
          <LabSlider
            id="rf-noise"
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
            id="rf-trees"
            label="Number of Trees (n_estimators)"
            value={params.n_estimators}
            min={5}
            max={60}
            step={5}
            onChange={(v) => setParams((p) => ({ ...p, n_estimators: v }))}
          />
          <LabSlider
            id="rf-depth"
            label="Max Depth"
            value={params.max_depth}
            min={1}
            max={10}
            step={1}
            onChange={(v) => setParams((p) => ({ ...p, max_depth: v }))}
          />
          <LabSelect
            id="rf-criterion"
            label="Split Criterion"
            value={params.criterion}
            options={[
              { value: 'gini', label: 'Gini Impurity' },
              { value: 'entropy', label: 'Information Gain (Entropy)' },
            ]}
            onChange={(v) => setParams((p) => ({ ...p, criterion: v }))}
          />
        </>
      }
      stageTitle="Random Forest Ensemble Decision Boundary"
      stageSubtitle={`Aggregating ${params.n_estimators} bootstrap decision trees`}
      visualization={
        loading && !rfResult ? (
          <div className="lab-chart-loading">
            <Loading text="Fitting Random Forest ensemble..." />
          </div>
        ) : (
          <PlotlyChart data={traces} layout={layout} />
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="Accuracy"
            value={rfResult ? `${(rfResult.accuracy * 100).toFixed(1)}%` : '—'}
            color="#10b981"
          />
          <LabMetricCard
            label="OOB Score"
            value={rfResult?.oob_score !== null && rfResult?.oob_score !== undefined ? `${(rfResult.oob_score * 100).toFixed(1)}%` : 'N/A'}
            color="#38bdf8"
          />
          <LabMetricCard
            label="Trees"
            value={rfResult ? rfResult.n_estimators : '—'}
            color="#facc15"
          />
          <LabMetricCard
            label="Feature 1 Importance"
            value={rfResult?.feature_importances ? `${(rfResult.feature_importances.feature_1 * 100).toFixed(1)}%` : '—'}
            color="#06b6d4"
          />
          <LabMetricCard
            label="Feature 2 Importance"
            value={rfResult?.feature_importances ? `${(rfResult.feature_importances.feature_2 * 100).toFixed(1)}%` : '—'}
            color="#06b6d4"
          />
        </>
      }
    />
  );
}
