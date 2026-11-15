import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { runNaiveBayesLab, fetchLabDataset } from '../../api/client';
import { colorPalette } from '../../utils/labEngine';
import PlotlyChart from '../mathematics/PlotlyChart';
import Loading from '../common/Loading';
import LaboratoryLayout, {
  LabMetricCard,
  LabSlider,
  LabSelect,
} from './LaboratoryLayout';

const DEFAULT_PARAMS = {
  var_smoothing_exp: -9, // 10^-9
  n_samples: 160,
  noise: 0.15,
};

export default function NaiveBayesLab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [datasetName, setDatasetName] = useState(config.defaultDataset || 'blobs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nbResult, setNbResult] = useState(null);
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
      const res = await runNaiveBayesLab(combined, {
        varSmoothing: Math.pow(10, currentParams.var_smoothing_exp),
      });
      setNbResult(res);
    } catch (err) {
      setError(err.message || 'Failed to fit Gaussian Naive Bayes.');
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
    setDatasetName(config.defaultDataset || 'blobs');
  };

  const traces = useMemo(() => {
    if (!rawDataset.data || rawDataset.data.length === 0) return [];
    const chartTraces = [];

    // Posterior probability heatmap
    if (nbResult?.mesh?.probabilities) {
      const { x_range, y_range, probabilities, grid_size } = nbResult.mesh;
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
          [1, 'rgba(234, 179, 8, 0.25)'],
        ],
        contours: {
          coloring: 'heatmap',
          showlines: false,
        },
        colorbar: {
          title: 'Posterior P(y=1|x)',
          titleside: 'right',
          len: 0.75,
          tickfont: { color: '#94a3b8', size: 10 },
        },
        hoverinfo: 'none',
        showscale: true,
      });
    }

    // Class Gaussian Mean markers
    if (nbResult?.feature_means && nbResult.feature_means.length > 0) {
      nbResult.feature_means.forEach((mean, clsIdx) => {
        chartTraces.push({
          x: [mean[0]],
          y: [mean[1]],
          mode: 'markers+text',
          type: 'scatter',
          name: `Class ${clsIdx} Centroid (μ)`,
          text: [`μ_${clsIdx}`],
          textposition: 'top center',
          textfont: { color: '#ffffff', size: 12 },
          marker: {
            symbol: 'diamond',
            color: '#facc15',
            size: 14,
            line: { color: '#050814', width: 2 },
          },
        });
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
  }, [rawDataset, nbResult]);

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
            id="nb-dataset"
            label="Dataset Distribution"
            value={datasetName}
            options={config.datasets || []}
            onChange={setDatasetName}
          />
          <LabSlider
            id="nb-samples"
            label="Sample Count"
            value={params.n_samples}
            min={40}
            max={300}
            step={20}
            onChange={(v) => setParams((p) => ({ ...p, n_samples: v }))}
          />
          <LabSlider
            id="nb-noise"
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
            id="nb-smoothing"
            label="Variance Smoothing (10^x)"
            value={params.var_smoothing_exp}
            displayValue={`10^(${params.var_smoothing_exp})`}
            min={-12}
            max={-2}
            step={1}
            onChange={(v) => setParams((p) => ({ ...p, var_smoothing_exp: v }))}
          />
        </>
      }
      stageTitle="Gaussian Naive Bayes Posterior Probability"
      stageSubtitle="Independent univariate Gaussians per feature class conditional distribution"
      visualization={
        loading && !nbResult ? (
          <div className="lab-chart-loading">
            <Loading text="Estimating Gaussian parameters..." />
          </div>
        ) : (
          <PlotlyChart data={traces} layout={layout} />
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="Accuracy"
            value={nbResult ? `${(nbResult.accuracy * 100).toFixed(1)}%` : '—'}
            color="#10b981"
          />
          <LabMetricCard
            label="Class 0 Prior"
            value={nbResult?.class_priors ? `${(nbResult.class_priors[0] * 100).toFixed(1)}%` : '—'}
            color="#38bdf8"
          />
          <LabMetricCard
            label="Class 1 Prior"
            value={nbResult?.class_priors ? `${(nbResult.class_priors[1] * 100).toFixed(1)}%` : '—'}
            color="#facc15"
          />
          <LabMetricCard
            label="Smoothing"
            value={`10^${params.var_smoothing_exp}`}
            color="#cbd5e1"
          />
        </>
      }
    />
  );
}
