import { useState, useEffect, useCallback, useMemo } from 'react';
import { runCNNLab } from '../../api/client';
import PlotlyChart from '../mathematics/PlotlyChart';
import Loading from '../common/Loading';
import LaboratoryLayout, {
  LabMetricCard,
  LabSlider,
  LabSelect,
} from './LaboratoryLayout';

const DEFAULT_PARAMS = {
  kernel_type: 'sobel_x',
  stride: 1,
  padding: 0,
};

export default function CNNLab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cnnResult, setCnnResult] = useState(null);

  const executePipeline = useCallback(async (currentParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await runCNNLab({
        kernelType: currentParams.kernel_type,
        stride: currentParams.stride,
        padding: currentParams.padding,
      });
      setCnnResult(res);
    } catch (err) {
      setError(err.message || 'Failed to compute CNN convolution.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      executePipeline(params);
    }, 180);
    return () => clearTimeout(timer);
  }, [params, executePipeline]);

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
  };

  // Build Plotly subplots / multi-panel heatmap for Input, Feature Map, Pooled
  const traces = useMemo(() => {
    if (!cnnResult) return [];

    return [
      {
        z: cnnResult.input_image,
        type: 'heatmap',
        colorscale: 'Blues',
        name: 'Input (8x8)',
        showscale: false,
        xaxis: 'x',
        yaxis: 'y',
      },
      {
        z: cnnResult.relu_feature_map,
        type: 'heatmap',
        colorscale: 'Viridis',
        name: 'Feature Map',
        showscale: false,
        xaxis: 'x2',
        yaxis: 'y2',
      },
      {
        z: cnnResult.pooled_map,
        type: 'heatmap',
        colorscale: 'Electric',
        name: 'Max Pooled',
        showscale: false,
        xaxis: 'x3',
        yaxis: 'y3',
      },
    ];
  }, [cnnResult]);

  const layout = useMemo(
    () => ({
      autosize: true,
      margin: { l: 30, r: 30, t: 40, b: 40 },
      plot_bgcolor: 'rgba(5, 8, 20, 0.8)',
      paper_bgcolor: 'transparent',
      grid: { rows: 1, columns: 3, pattern: 'independent' },
      xaxis: { title: { text: '1. Input Pattern (8x8)', font: { color: '#94a3b8', size: 11 } } },
      yaxis: { autorange: 'reversed' },
      xaxis2: { title: { text: '2. Feature Map (Conv + ReLU)', font: { color: '#94a3b8', size: 11 } } },
      yaxis2: { autorange: 'reversed' },
      xaxis3: { title: { text: '3. Max Pool 2x2', font: { color: '#94a3b8', size: 11 } } },
      yaxis3: { autorange: 'reversed' },
    }),
    []
  );

  return (
    <LaboratoryLayout
      config={config}
      loading={loading}
      error={error}
      onReset={handleReset}
      onRetry={() => executePipeline(params)}
      datasetControls={
        <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
          Synthetic geometric input image matrix with intersecting horizontal and vertical edge signals.
        </div>
      }
      parameterControls={
        <>
          <LabSelect
            id="cnn-kernel"
            label="Convolution Kernel"
            value={params.kernel_type}
            options={[
              { value: 'sobel_x', label: 'Sobel X (Vertical Edges)' },
              { value: 'sobel_y', label: 'Sobel Y (Horizontal Edges)' },
              { value: 'edge_detection', label: 'Laplacian (All Edges)' },
              { value: 'sharpen', label: 'Sharpen Kernel' },
              { value: 'gaussian_blur', label: 'Gaussian Blur' },
            ]}
            onChange={(v) => setParams((p) => ({ ...p, kernel_type: v }))}
          />
          <LabSlider
            id="cnn-stride"
            label="Stride (S)"
            value={params.stride}
            min={1}
            max={2}
            step={1}
            onChange={(v) => setParams((p) => ({ ...p, stride: v }))}
          />
          <LabSlider
            id="cnn-padding"
            label="Zero Padding (P)"
            value={params.padding}
            min={0}
            max={2}
            step={1}
            onChange={(v) => setParams((p) => ({ ...p, padding: v }))}
          />
        </>
      }
      extraLeftPanels={
        cnnResult?.kernel_matrix && (
          <div className="lab-panel-card" style={{ marginTop: '1rem', padding: '1rem', background: '#0b1633', borderRadius: '8px' }}>
            <h4 style={{ color: '#38bdf8', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              3×3 Kernel Matrix
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', textAlign: 'center' }}>
              {cnnResult.kernel_matrix.flat().map((val, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 2px', borderRadius: '4px', fontSize: '0.85rem', color: val !== 0 ? '#facc15' : '#64748b' }}>
                  {val}
                </div>
              ))}
            </div>
          </div>
        )
      }
      stageTitle="2D Spatial Convolution & Max Pooling Pipeline"
      stageSubtitle="Input Matrix → 3×3 Cross-Correlation → ReLU Non-Linearity → 2×2 Max Subsampling"
      visualization={
        loading && !cnnResult ? (
          <div className="lab-chart-loading">
            <Loading text="Performing 2D spatial convolution..." />
          </div>
        ) : (
          <PlotlyChart data={traces} layout={layout} />
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="Input Dim"
            value={cnnResult ? `${cnnResult.input_shape[0]}×${cnnResult.input_shape[1]}` : '—'}
            color="#38bdf8"
          />
          <LabMetricCard
            label="Feature Map"
            value={cnnResult ? `${cnnResult.feature_map_shape[0]}×${cnnResult.feature_map_shape[1]}` : '—'}
            color="#10b981"
          />
          <LabMetricCard
            label="Pooled Dim"
            value={cnnResult ? `${cnnResult.pooled_shape[0]}×${cnnResult.pooled_shape[1]}` : '—'}
            color="#facc15"
          />
          <LabMetricCard
            label="Stride / Pad"
            value={`S=${params.stride}, P=${params.padding}`}
            color="#cbd5e1"
          />
        </>
      }
    />
  );
}
