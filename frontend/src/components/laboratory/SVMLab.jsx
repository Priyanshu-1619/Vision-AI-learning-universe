import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { runSVMLab, fetchLabDataset } from '../../api/client';
import { colorPalette } from '../../utils/labEngine';
import PlotlyChart from '../mathematics/PlotlyChart';
import Loading from '../common/Loading';
import LaboratoryLayout, {
  LabMetricCard,
  LabSlider,
  LabSelect,
} from './LaboratoryLayout';

const DEFAULT_PARAMS = {
  c_param: 1.0,
  kernel: 'rbf',
  gamma: 'scale',
  n_samples: 160,
  noise: 0.15,
};

export default function SVMLab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [datasetName, setDatasetName] = useState(config.defaultDataset || 'moons');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [svmResult, setSvmResult] = useState(null);
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
      const res = await runSVMLab(combined, {
        cParam: currentParams.c_param,
        kernel: currentParams.kernel,
        gamma: currentParams.gamma,
      });
      setSvmResult(res);
    } catch (err) {
      setError(err.message || 'Failed to fit Support Vector Machine.');
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
    if (svmResult?.mesh?.probabilities) {
      const { x_range, y_range, probabilities, grid_size } = svmResult.mesh;
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
          [1, 'rgba(168, 85, 247, 0.25)'],
        ],
        contours: {
          coloring: 'heatmap',
          showlines: true,
          size: 0.1,
        },
        colorbar: {
          title: 'Margin Dist',
          titleside: 'right',
          len: 0.75,
          tickfont: { color: '#94a3b8', size: 10 },
        },
        hoverinfo: 'none',
        showscale: true,
      });
    }

    // Support Vectors halo markers
    if (svmResult?.support_vectors && svmResult.support_vectors.length > 0) {
      chartTraces.push({
        x: svmResult.support_vectors.map((pt) => pt[0]),
        y: svmResult.support_vectors.map((pt) => pt[1]),
        mode: 'markers',
        type: 'scatter',
        name: `Support Vectors (${svmResult.n_support_vectors})`,
        marker: {
          color: 'transparent',
          size: 15,
          line: { color: '#facc15', width: 2 },
        },
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
  }, [rawDataset, svmResult]);

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
            id="svm-dataset"
            label="Dataset Distribution"
            value={datasetName}
            options={config.datasets || []}
            onChange={setDatasetName}
          />
          <LabSlider
            id="svm-samples"
            label="Sample Count"
            value={params.n_samples}
            min={40}
            max={300}
            step={20}
            onChange={(v) => setParams((p) => ({ ...p, n_samples: v }))}
          />
          <LabSlider
            id="svm-noise"
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
          <LabSelect
            id="svm-kernel"
            label="Kernel Function"
            value={params.kernel}
            options={[
              { value: 'rbf', label: 'Radial Basis Function (RBF)' },
              { value: 'linear', label: 'Linear Hyperplane' },
              { value: 'poly', label: 'Polynomial (Degree 3)' },
            ]}
            onChange={(v) => setParams((p) => ({ ...p, kernel: v }))}
          />
          <LabSlider
            id="svm-c"
            label="Soft Margin Parameter (C)"
            value={params.c_param}
            displayValue={params.c_param.toFixed(2)}
            min={0.1}
            max={10.0}
            step={0.2}
            onChange={(v) => setParams((p) => ({ ...p, c_param: v }))}
          />
        </>
      }
      stageTitle="Support Vector Machine (SVC) Maximum Margin"
      stageSubtitle={`Kernel: ${params.kernel.toUpperCase()} · C=${params.c_param}`}
      visualization={
        loading && !svmResult ? (
          <div className="lab-chart-loading">
            <Loading text="Optimizing SVM dual Lagrangian..." />
          </div>
        ) : (
          <PlotlyChart data={traces} layout={layout} />
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="Accuracy"
            value={svmResult ? `${(svmResult.accuracy * 100).toFixed(1)}%` : '—'}
            color="#10b981"
          />
          <LabMetricCard
            label="Support Vectors"
            value={svmResult ? svmResult.n_support_vectors : '—'}
            color="#facc15"
          />
          <LabMetricCard
            label="Kernel"
            value={svmResult ? svmResult.kernel.toUpperCase() : '—'}
            color="#38bdf8"
          />
          <LabMetricCard
            label="Penalty C"
            value={svmResult ? svmResult.c_param.toFixed(2) : '—'}
            color="#cbd5e1"
          />
        </>
      }
    />
  );
}
