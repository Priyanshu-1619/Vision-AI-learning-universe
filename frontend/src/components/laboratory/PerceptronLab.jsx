import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { runPerceptronLab, fetchLabDataset } from '../../api/client';
import { colorPalette } from '../../utils/labEngine';
import PlotlyChart from '../mathematics/PlotlyChart';
import Loading from '../common/Loading';
import LaboratoryLayout, {
  LabMetricCard,
  LabSlider,
  LabSelect,
} from './LaboratoryLayout';

const DEFAULT_PARAMS = {
  learning_rate: 0.1,
  max_epochs: 25,
  n_samples: 140,
  noise: 0.1,
};

export default function PerceptronLab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [datasetName, setDatasetName] = useState(config.defaultDataset || 'linear');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [percResult, setPercResult] = useState(null);
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
      const res = await runPerceptronLab(combined, {
        learningRate: currentParams.learning_rate,
        maxEpochs: currentParams.max_epochs,
      });
      setPercResult(res);
    } catch (err) {
      setError(err.message || 'Failed to train Perceptron.');
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
    setDatasetName(config.defaultDataset || 'linear');
  };

  const traces = useMemo(() => {
    if (!rawDataset.data || rawDataset.data.length === 0) return [];
    const chartTraces = [];

    // Separating boundary line: w1*x1 + w2*x2 + b = 0 => x2 = (-w1*x1 - b)/w2
    if (percResult?.weights && Math.abs(percResult.weights[1]) > 1e-5) {
      const [w1, w2] = percResult.weights;
      const b = percResult.bias;
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
        name: 'Perceptron Hyperplane',
        line: { color: '#facc15', width: 2.5 },
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
  }, [rawDataset, percResult]);

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
            id="perc-dataset"
            label="Dataset Distribution"
            value={datasetName}
            options={config.datasets || []}
            onChange={setDatasetName}
          />
          <LabSlider
            id="perc-samples"
            label="Sample Count"
            value={params.n_samples}
            min={30}
            max={250}
            step={10}
            onChange={(v) => setParams((p) => ({ ...p, n_samples: v }))}
          />
          <LabSlider
            id="perc-noise"
            label="Noise"
            value={params.noise}
            displayValue={`${Math.round(params.noise * 100)}%`}
            min={0.02}
            max={0.3}
            step={0.02}
            onChange={(v) => setParams((p) => ({ ...p, noise: v }))}
          />
        </>
      }
      parameterControls={
        <>
          <LabSlider
            id="perc-lr"
            label="Learning Rate (η)"
            value={params.learning_rate}
            displayValue={params.learning_rate.toFixed(2)}
            min={0.01}
            max={1.0}
            step={0.05}
            onChange={(v) => setParams((p) => ({ ...p, learning_rate: v }))}
          />
          <LabSlider
            id="perc-epochs"
            label="Max Epochs"
            value={params.max_epochs}
            min={5}
            max={60}
            step={5}
            onChange={(v) => setParams((p) => ({ ...p, max_epochs: v }))}
          />
        </>
      }
      stageTitle="Single-Layer Perceptron Linear Separator"
      stageSubtitle={
        percResult
          ? `Weights: [${percResult.weights.join(', ')}] · Bias: ${percResult.bias}`
          : 'Rosenblatt linear threshold neuron'
      }
      visualization={
        loading && !percResult ? (
          <div className="lab-chart-loading">
            <Loading text="Updating Perceptron weights epoch-by-epoch..." />
          </div>
        ) : (
          <PlotlyChart data={traces} layout={layout} />
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="Final Accuracy"
            value={percResult ? `${(percResult.final_accuracy * 100).toFixed(1)}%` : '—'}
            color="#10b981"
          />
          <LabMetricCard
            label="Converged"
            value={percResult ? (percResult.converged ? 'Yes' : 'No') : '—'}
            color={percResult?.converged ? '#10b981' : '#ef4444'}
          />
          <LabMetricCard
            label="Epochs Taken"
            value={percResult ? percResult.epochs_taken : '—'}
            color="#38bdf8"
          />
          <LabMetricCard
            label="Weight w₁"
            value={percResult?.weights ? percResult.weights[0].toFixed(3) : '—'}
            color="#facc15"
          />
          <LabMetricCard
            label="Weight w₂"
            value={percResult?.weights ? percResult.weights[1].toFixed(3) : '—'}
            color="#facc15"
          />
        </>
      }
    />
  );
}
