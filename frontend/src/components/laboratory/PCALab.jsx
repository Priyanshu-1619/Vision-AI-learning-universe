import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play } from 'lucide-react';
import { fetchLabDataset, runPCA } from '../../api/client';
import { colorPalette, formatMetric } from '../../utils/labEngine';
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
  n_components: 2,
  n_samples: 200,
};

export default function PCALab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [datasetName, setDatasetName] = useState(config.defaultDataset || 'correlated');
  const [standardize, setStandardize] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pcaResult, setPcaResult] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState({ labels: [], feature_names: ['x1', 'x2'], n_features: 2 });

  const executePipeline = useCallback(async (currentParams, currentDataset, currentStd) => {
    setLoading(true);
    setError(null);
    try {
      const apiDatasetName = currentDataset === 'iris_4d' ? 'iris' : currentDataset;
      const allFeatures = currentDataset === 'iris_4d';
      const dataset = await fetchLabDataset(
        apiDatasetName,
        currentParams.n_samples,
        0.1,
        42,
        allFeatures
      );
      setDatasetInfo(dataset);

      const safeK = Math.min(currentParams.n_components, dataset.n_features);
      const result = await runPCA(dataset.data, safeK, currentStd);
      setPcaResult(result);
    } catch (err) {
      setError(err.message || 'Failed to compute PCA on backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      executePipeline(params, datasetName, standardize);
    }, 220);
    return () => clearTimeout(timer);
  }, [params, datasetName, standardize, executePipeline]);

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setDatasetName(config.defaultDataset || 'correlated');
    setStandardize(true);
  };

  // Plot 1: Prepared (Centered / Standardized) Data + Principal Component Eigenvector Arrows
  const originalVectorsChart = useMemo(() => {
    if (!pcaResult?.prepared_data?.length) return [];
    const prepared = pcaResult.prepared_data;
    const labels = datasetInfo.labels || [];
    const uniqueClasses = Array.from(new Set(labels)).sort((a, b) => a - b);

    // If >2 features (like 4D iris), show PC1/PC2 on dims [2,3] or [0,1] without false 2D arrows
    const is2D = (datasetInfo.n_features || 2) === 2;
    const dimA = is2D ? 0 : 2;
    const dimB = is2D ? 1 : 3;

    const traces = uniqueClasses.map((c) => {
      const pts = prepared.filter((_, idx) => labels[idx] === c);
      return {
        x: pts.map((p) => p[dimA]),
        y: pts.map((p) => p[dimB]),
        mode: 'markers',
        type: 'scatter',
        name: `Class ${c}`,
        marker: { color: colorPalette[c % colorPalette.length], size: 6.5, opacity: 0.7 },
      };
    });

    if (is2D && pcaResult.components?.length && pcaResult.explained_variance?.length) {
      pcaResult.components.forEach((vec, idx) => {
        const lambda = Math.max(0.05, pcaResult.explained_variance[idx] || 0.5);
        const len = 2.0 * Math.sqrt(lambda);
        traces.push({
          x: [0, vec[0] * len],
          y: [0, vec[1] * len],
          mode: 'lines+markers+text',
          type: 'scatter',
          name: `PC${idx + 1} Axis`,
          text: ['', `PC${idx + 1}`],
          textposition: 'top center',
          textfont: { color: idx === 0 ? '#f59e0b' : '#ec4899', size: 12 },
          line: { color: idx === 0 ? '#f59e0b' : '#ec4899', width: 3.5 },
          marker: { size: [4, 9], color: idx === 0 ? '#f59e0b' : '#ec4899' },
        });
      });
    }

    return traces;
  }, [pcaResult, datasetInfo]);

  // Plot 2: Projected Reduced Data (Z = X W_k)
  const projectionChartData = useMemo(() => {
    if (!pcaResult?.projected?.length) return [];
    const projected = pcaResult.projected;
    const labels = datasetInfo.labels || [];
    const uniqueClasses = Array.from(new Set(labels)).sort((a, b) => a - b);

    return uniqueClasses.map((c) => {
      const pts = projected.filter((_, idx) => labels[idx] === c);
      return {
        x: pts.map((p) => p[0]),
        y: pts.map((p) => (p.length > 1 ? p[1] : 0)),
        mode: 'markers',
        type: 'scatter',
        name: `Class ${c}`,
        marker: { color: colorPalette[c % colorPalette.length], size: 7, opacity: 0.78 },
      };
    });
  }, [pcaResult, datasetInfo.labels]);

  // Plot 3: Scree + Cumulative Explained Variance
  const varianceChartData = useMemo(() => {
    const ratios = pcaResult?.full_explained_variance_ratio || pcaResult?.explained_variance_ratio;
    if (!ratios?.length) return [];
    const cumPct = [];
    for (let i = 0; i < ratios.length; i++) {
      const prev = i > 0 ? cumPct[i - 1] : 0;
      cumPct.push(Number((prev + ratios[i] * 100).toFixed(1)));
    }
    const compLabels = ratios.map((_, i) => `PC${i + 1}`);
    return [
      {
        x: compLabels,
        y: ratios.map((r) => Number((r * 100).toFixed(1))),
        type: 'bar',
        name: 'Individual EVR %',
        marker: { color: '#06b6d4' },
      },
      {
        x: compLabels,
        y: cumPct,
        mode: 'lines+markers',
        type: 'scatter',
        name: 'Cumulative EVR %',
        line: { color: '#10b981', width: 2.5 },
      },
    ];
  }, [pcaResult]);

  const maxComp = datasetName === 'iris_4d' ? 4 : 2;
  const cumulativePct = pcaResult?.cumulative_variance?.length
    ? (pcaResult.cumulative_variance[pcaResult.cumulative_variance.length - 1] * 100).toFixed(1)
    : '—';

  return (
    <LaboratoryLayout
      config={config}
      loading={loading}
      error={error}
      onRetry={() => executePipeline(params, datasetName, standardize)}
      onReset={handleReset}
      stageTitle="Variance Decomposition, Eigenvector Axes & Subspace Projection"
      stageSubtitle={
        <>
          Computed via <code>sklearn.decomposition.PCA</code> ({standardize ? 'StandardScaler + PCA' : 'Mean-Centered PCA'})
        </>
      }
      datasetControls={
        <>
          <LabSelect
            id="pca-dataset-select"
            label="Dataset"
            value={datasetName}
            options={config.datasets}
            onChange={(val) => {
              setDatasetName(val);
              if (val !== 'iris_4d' && params.n_components > 2) {
                setParams((p) => ({ ...p, n_components: 2 }));
              }
            }}
          />
          <LabSlider
            id="pca-samples-slider"
            label="Sample Count (n)"
            value={params.n_samples}
            min={80}
            max={400}
            step={40}
            onChange={(v) => setParams((p) => ({ ...p, n_samples: v }))}
          />
        </>
      }
      parameterControls={
        <>
          <LabSlider
            id="pca-comp-slider"
            label="Principal Components (k)"
            value={Math.min(params.n_components, maxComp)}
            min={1}
            max={maxComp}
            step={1}
            onChange={(v) => setParams((p) => ({ ...p, n_components: v }))}
          />
          <LabToggle
            id="pca-std-toggle"
            label="Standardize Features (z-score)"
            checked={standardize}
            onChange={setStandardize}
            hint="Scale all features to μ=0, σ=1 before covariance (crucial on 8x scale gap!)."
          />
        </>
      }
      actionButtons={
        <Button
          variant="primary"
          icon={Play}
          onClick={() => executePipeline(params, datasetName, standardize)}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Decomposing...' : 'Recompute PCA'}
        </Button>
      }
      visualization={
        loading && !pcaResult ? (
          <Loading text="Computing covariance & principal components..." />
        ) : (
          <div className="lab-multi-chart">
            {/* Pipeline Flow Indicator */}
            <div className="lab-pca-flow">
              <span>Original ({datasetInfo.n_features}D)</span>
              <span>→</span>
              <span>{standardize ? 'StandardScaler (μ=0, σ=1)' : 'Centered (μ=0)'}</span>
              <span>→</span>
              <span>Covariance Σ</span>
              <span>→</span>
              <span>Top {Math.min(params.n_components, maxComp)} PCs</span>
              <span>→</span>
              <strong>Reduced Subspace</strong>
            </div>

            <div className="lab-pca-charts-pair">
              <div className="lab-dt-chart-box">
                <h4 className="lab-dt-chart-title">
                  {datasetInfo.n_features === 2
                    ? 'Prepared Space + Principal Axes'
                    : 'Prepared Original Slice (Petal dims)'}
                </h4>
                <PlotlyChart
                  data={originalVectorsChart}
                  layout={{
                    xaxis: { title: datasetInfo.n_features === 2 ? datasetInfo.feature_names?.[0] : 'petal_length', zeroline: true, scaleanchor: datasetInfo.n_features === 2 && standardize ? 'y' : undefined },
                    yaxis: { title: datasetInfo.n_features === 2 ? datasetInfo.feature_names?.[1] : 'petal_width', zeroline: true },
                    margin: { t: 18, r: 16, b: 36, l: 48 },
                  }}
                  height={280}
                />
              </div>

              <div className="lab-dt-chart-box">
                <h4 className="lab-dt-chart-title">Projected Reduced Data (Z = X · Wₖ)</h4>
                <PlotlyChart
                  data={projectionChartData}
                  layout={{
                    xaxis: { title: 'Principal Component 1 (PC1)', zeroline: true },
                    yaxis: {
                      title: params.n_components === 1 ? '1-D Collapse (y=0)' : 'Principal Component 2 (PC2)',
                      zeroline: true,
                    },
                    margin: { t: 18, r: 16, b: 36, l: 48 },
                  }}
                  height={280}
                />
              </div>
            </div>

            <div className="lab-companion-chart-box" style={{ marginTop: '0.75rem' }}>
              <h4 className="lab-dt-chart-title">Explained & Cumulative Variance Spectrum</h4>
              <PlotlyChart
                data={varianceChartData}
                layout={{
                  yaxis: { title: 'Variance Explained (%)', range: [0, 108] },
                  margin: { t: 14, r: 16, b: 34, l: 48 },
                }}
                height={190}
              />
            </div>
          </div>
        )
      }
      extraStagePanels={
        pcaResult && (
          <div className="lab-pca-matrix-card">
            <h4 className="lab-dt-chart-title">Real sklearn PCA Attributes</h4>
            <div className="lab-pca-matrix-grid">
              <div>
                <span className="lab-metric-card__label">explained_variance_ (Eigenvalues λ)</span>
                <code className="lab-pca-code">
                  [{pcaResult.explained_variance?.map((v) => formatMetric(v, 4)).join(', ')}]
                </code>
              </div>
              <div>
                <span className="lab-metric-card__label">explained_variance_ratio_</span>
                <code className="lab-pca-code">
                  [{pcaResult.explained_variance_ratio?.map((v) => formatMetric(v, 4)).join(', ')}]
                </code>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span className="lab-metric-card__label">components_ (Principal Eigenvector Loadings)</span>
                <div className="lab-pca-components-list">
                  {pcaResult.components?.map((comp, idx) => (
                    <code key={idx} className="lab-pca-code">
                      PC{idx + 1}: [{comp.map((v) => formatMetric(v, 3)).join(', ')}]
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="Cumulative Variance Retained"
            value={`${cumulativePct}%`}
            sub={`Using top ${Math.min(params.n_components, maxComp)} PCs`}
            color="#10b981"
          />
          <LabMetricCard
            label="PC1 Eigenvalue (λ₁)"
            value={pcaResult?.explained_variance?.[0] !== undefined ? formatMetric(pcaResult.explained_variance[0], 3) : '—'}
            sub="Principal Dispersion"
            color="#38bdf8"
          />
          <LabMetricCard
            label="PC1 Variance Ratio"
            value={
              pcaResult?.explained_variance_ratio?.[0] !== undefined
                ? `${(pcaResult.explained_variance_ratio[0] * 100).toFixed(1)}%`
                : '—'
            }
            sub="Share of Total Variance"
            color="#f59e0b"
          />
          <LabMetricCard
            label="Preprocessing"
            value={standardize ? 'Standardized' : 'Centered Only'}
            sub={standardize ? 'Zero Mean, Unit Var' : 'Raw Units Preserved'}
            color="#8b5cf6"
          />
        </>
      }
    />
  );
}
