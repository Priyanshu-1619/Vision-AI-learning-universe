import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { runAutoencoderLab, fetchLabDataset } from '../../api/client';
import { formatMetric } from '../../utils/labEngine';
import PlotlyChart from '../mathematics/PlotlyChart';
import Loading from '../common/Loading';
import LaboratoryLayout, {
  LabMetricCard,
  LabSlider,
  LabSelect,
} from './LaboratoryLayout';

const DEFAULT_PARAMS = {
  latent_dim: 1,
  n_samples: 120,
  noise: 0.12,
};

export default function AutoencoderLab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [datasetName, setDatasetName] = useState(config.defaultDataset || 'correlated');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aeResult, setAeResult] = useState(null);
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

      const res = await runAutoencoderLab(dataset.data, {
        latentDim: currentParams.latent_dim,
      });
      setAeResult(res);
    } catch (err) {
      setError(err.message || 'Failed to compute Autoencoder reconstruction.');
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
    setDatasetName(config.defaultDataset || 'correlated');
  };

  const traces = useMemo(() => {
    if (!rawDataset.data || rawDataset.data.length === 0) return [];
    const chartTraces = [];

    // Residual error lines connecting original to reconstructed
    if (aeResult?.reconstructed_samples && aeResult.reconstructed_samples.length > 0) {
      const lineX = [];
      const lineY = [];
      const nPts = Math.min(rawDataset.data.length, aeResult.reconstructed_samples.length);
      for (let i = 0; i < nPts; i++) {
        const orig = rawDataset.data[i];
        const rec = aeResult.reconstructed_samples[i];
        lineX.push(orig[0], rec[0], null);
        lineY.push(orig[1], rec[1], null);
      }
      chartTraces.push({
        x: lineX,
        y: lineY,
        mode: 'lines',
        type: 'scatter',
        name: 'Reconstruction Loss (Error)',
        line: { color: 'rgba(239, 68, 68, 0.45)', width: 1.2, dash: 'dot' },
        hoverinfo: 'skip',
      });
    }

    // Original data points
    chartTraces.push({
      x: rawDataset.data.map((p) => p[0]),
      y: rawDataset.data.map((p) => p[1]),
      mode: 'markers',
      type: 'scatter',
      name: 'Original 2-D Space',
      marker: {
        color: '#06b6d4',
        size: 7,
        opacity: 0.8,
        line: { color: '#050814', width: 1 },
      },
    });

    // Reconstructed data points
    if (aeResult?.reconstructed_samples && aeResult.reconstructed_samples.length > 0) {
      chartTraces.push({
        x: aeResult.reconstructed_samples.map((p) => p[0]),
        y: aeResult.reconstructed_samples.map((p) => p[1]),
        mode: 'markers',
        type: 'scatter',
        name: `Reconstructed (Latent Dim = ${params.latent_dim})`,
        marker: {
          color: '#facc15',
          symbol: 'diamond',
          size: 8,
          line: { color: '#050814', width: 1 },
        },
      });
    }

    return chartTraces;
  }, [rawDataset, aeResult, params.latent_dim]);

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
            id="ae-dataset"
            label="Dataset Distribution"
            value={datasetName}
            options={config.datasets || []}
            onChange={setDatasetName}
          />
          <LabSlider
            id="ae-samples"
            label="Sample Count"
            value={params.n_samples}
            min={40}
            max={200}
            step={20}
            onChange={(v) => setParams((p) => ({ ...p, n_samples: v }))}
          />
          <LabSlider
            id="ae-noise"
            label="Noise Level"
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
          <LabSelect
            id="ae-latent"
            label="Bottleneck Latent Dimension (z)"
            value={String(params.latent_dim)}
            options={[
              { value: '1', label: '1-D Bottleneck (50% compression)' },
              { value: '2', label: '2-D Full Subspace (Lossless identity)' },
            ]}
            onChange={(v) => setParams((p) => ({ ...p, latent_dim: Number(v) }))}
          />
        </>
      }
      stageTitle="Autoencoder Bottleneck Compression & Reconstruction"
      stageSubtitle="Higher-Dimensional Feature Vector → Bottleneck Latent Space z → Reconstructed Output x̂"
      visualization={
        loading && !aeResult ? (
          <div className="lab-chart-loading">
            <Loading text="Compressing and decoding latent vectors..." />
          </div>
        ) : (
          <PlotlyChart data={traces} layout={layout} />
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="Reconstruction MSE"
            value={aeResult ? formatMetric(aeResult.reconstruction_mse) : '—'}
            color="#ef4444"
          />
          <LabMetricCard
            label="Compression"
            value={params.latent_dim === 1 ? '50% (2D→1D)' : '0% (2D→2D)'}
            color="#38bdf8"
          />
          <LabMetricCard
            label="Latent Dim"
            value={aeResult ? aeResult.latent_dim : '—'}
            color="#facc15"
          />
          <LabMetricCard
            label="Explained Var"
            value={aeResult?.explained_variance_ratio ? `${(aeResult.explained_variance_ratio[0] * 100).toFixed(1)}%` : '—'}
            color="#10b981"
          />
        </>
      }
    />
  );
}
