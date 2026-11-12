import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, FastForward } from 'lucide-react';
import { fetchLabDataset, runKMeans } from '../../api/client';
import { colorPalette, formatMetric } from '../../utils/labEngine';
import PlotlyChart from '../mathematics/PlotlyChart';
import Button from '../common/Button';
import Loading from '../common/Loading';
import LaboratoryLayout, {
  LabMetricCard,
  LabSlider,
  LabSelect,
} from './LaboratoryLayout';

const DEFAULT_PARAMS = {
  k: 3,
  n_samples: 180,
  noise: 0.12,
  seed: 42,
};

export default function KMeansLab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [datasetName, setDatasetName] = useState(config.defaultDataset || 'blobs');
  const [initMethod, setInitMethod] = useState('k-means++');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clusterResult, setClusterResult] = useState(null);
  const [rawPoints, setRawPoints] = useState([]);

  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const executePipeline = useCallback(
    async (currentParams, currentDataset, currentInit) => {
      setLoading(true);
      setError(null);
      setIsPlaying(false);
      try {
        const dataset = await fetchLabDataset(
          currentDataset,
          currentParams.n_samples,
          currentParams.noise,
          currentParams.seed
        );
        setRawPoints(dataset.data);

        const result = await runKMeans(dataset.data, currentParams.k, {
          initMethod: currentInit,
          seed: currentParams.seed,
          maxIter: 18,
        });
        setClusterResult(result);
        const total = result.iterations?.length || 1;
        // Start on final frame when params update, or let user scrub/animate
        setStepIdx(Math.max(0, total - 1));
      } catch (err) {
        setError(err.message || 'Failed to execute K-Means on backend.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      executePipeline(params, datasetName, initMethod);
    }, 220);
    return () => clearTimeout(timer);
  }, [params, datasetName, initMethod, executePipeline]);

  // Animation timer stepping cleanly through real backend iterations[]
  useEffect(() => {
    if (!isPlaying || !clusterResult?.iterations?.length) return undefined;
    const lastIdx = clusterResult.iterations.length - 1;
    const timer = setTimeout(() => {
      setStepIdx((prev) => {
        if (prev >= lastIdx) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 650);
    return () => clearTimeout(timer);
  }, [isPlaying, stepIdx, clusterResult]);

  const handleReset = () => {
    setIsPlaying(false);
    setParams(DEFAULT_PARAMS);
    setDatasetName(config.defaultDataset || 'blobs');
    setInitMethod('k-means++');
  };

  const handleAnimate = () => {
    if (!clusterResult?.iterations?.length) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    // Restart from iteration 0 if already at end
    if (stepIdx >= clusterResult.iterations.length - 1) {
      setStepIdx(0);
    }
    setIsPlaying(true);
  };

  const iterations = useMemo(() => clusterResult?.iterations || [], [clusterResult]);
  const activeSnap = useMemo(
    () =>
      iterations.length > 0
        ? iterations[Math.min(stepIdx, iterations.length - 1)]
        : null,
    [iterations, stepIdx]
  );

  const chartData = useMemo(() => {
    if (!rawPoints || rawPoints.length === 0 || !activeSnap) return [];
    const { clusters, centroids } = activeSnap;
    const traces = [];

    for (let c = 0; c < params.k; c++) {
      const pts = rawPoints.filter((_, idx) => clusters[idx] === c);
      const color = colorPalette[c % colorPalette.length];
      traces.push({
        x: pts.map((p) => p[0]),
        y: pts.map((p) => p[1]),
        mode: 'markers',
        type: 'scatter',
        name: `Cluster ${c + 1}`,
        marker: { color, size: 7, opacity: 0.72 },
      });

      // Centroid trajectory trail across iterations 0..stepIdx
      if (stepIdx > 0 && iterations.length > 1) {
        const pathX = [];
        const pathY = [];
        for (let s = 0; s <= Math.min(stepIdx, iterations.length - 1); s++) {
          const cent = iterations[s]?.centroids?.[c];
          if (cent) {
            pathX.push(cent[0]);
            pathY.push(cent[1]);
          }
        }
        if (pathX.length > 1) {
          traces.push({
            x: pathX,
            y: pathY,
            mode: 'lines',
            type: 'scatter',
            name: `μ${c + 1} path`,
            showlegend: false,
            line: { color, width: 2, dash: 'dot' },
            hoverinfo: 'skip',
          });
        }
      }
    }

    if (centroids && centroids.length > 0) {
      traces.push({
        x: centroids.map((c) => c[0]),
        y: centroids.map((c) => c[1]),
        mode: 'markers',
        type: 'scatter',
        name: `Centroids (Iter ${activeSnap.iteration})`,
        marker: {
          symbol: 'x',
          color: '#ffffff',
          size: 15,
          line: { color: '#0f172a', width: 2 },
        },
      });
    }

    return traces;
  }, [rawPoints, activeSnap, params.k, stepIdx, iterations]);

  const inertiaChartData = useMemo(() => {
    if (iterations.length === 0) return [];
    return [
      {
        x: iterations.map((it) => it.iteration),
        y: iterations.map((it) => it.inertia),
        mode: 'lines+markers',
        type: 'scatter',
        name: 'WCSS / Inertia',
        line: { color: '#38bdf8', width: 2.5 },
        marker: { size: 5 },
      },
      activeSnap && {
        x: [activeSnap.iteration],
        y: [activeSnap.inertia],
        mode: 'markers',
        type: 'scatter',
        name: 'Current Step',
        marker: { color: '#f59e0b', size: 11, line: { color: '#fff', width: 1.5 } },
      },
    ].filter(Boolean);
  }, [iterations, activeSnap]);

  const maxStep = Math.max(0, iterations.length - 1);

  return (
    <LaboratoryLayout
      config={config}
      loading={loading}
      error={error}
      onRetry={() => executePipeline(params, datasetName, initMethod)}
      onReset={handleReset}
      stageTitle="Voronoi Cluster Assignments & Centroid Convergence"
      stageSubtitle={
        <>
          Real iteration history from <code>sklearn.cluster.KMeans</code> ({initMethod})
        </>
      }
      stageHeaderExtra={
        activeSnap && (
          <div className="lab-iter-controls">
            <Button
              variant="secondary"
              icon={SkipBack}
              onClick={() => {
                setIsPlaying(false);
                setStepIdx((s) => Math.max(0, s - 1));
              }}
              disabled={stepIdx <= 0}
              style={{ padding: '4px 9px' }}
              title="Previous iteration"
            />
            <Button
              variant="primary"
              icon={isPlaying ? Pause : Play}
              onClick={handleAnimate}
              disabled={maxStep === 0}
              style={{ padding: '4px 12px' }}
            >
              {isPlaying ? 'Pause' : 'Animate'}
            </Button>
            <Button
              variant="secondary"
              icon={SkipForward}
              onClick={() => {
                setIsPlaying(false);
                setStepIdx((s) => Math.min(maxStep, s + 1));
              }}
              disabled={stepIdx >= maxStep}
              style={{ padding: '4px 9px' }}
              title="Next iteration"
            />
            <Button
              variant="ghost"
              icon={FastForward}
              onClick={() => {
                setIsPlaying(false);
                setStepIdx(maxStep);
              }}
              disabled={stepIdx >= maxStep}
              style={{ padding: '4px 9px' }}
              title="Jump to final iteration"
            />
          </div>
        )
      }
      datasetControls={
        <>
          <LabSelect
            id="kmeans-dataset-select"
            label="Dataset Manifold"
            value={datasetName}
            options={config.datasets}
            onChange={setDatasetName}
          />
          <LabSlider
            id="kmeans-samples-slider"
            label="Sample Count (n)"
            value={params.n_samples}
            min={50}
            max={400}
            step={50}
            onChange={(v) => setParams((p) => ({ ...p, n_samples: v }))}
          />
          <LabSlider
            id="kmeans-noise-slider"
            label="Spread / Noise (σ)"
            value={params.noise}
            displayValue={params.noise.toFixed(2)}
            min={0}
            max={0.4}
            step={0.05}
            onChange={(v) => setParams((p) => ({ ...p, noise: v }))}
          />
        </>
      }
      parameterControls={
        <>
          <LabSlider
            id="kmeans-k-slider"
            label="Clusters (K)"
            value={params.k}
            min={2}
            max={8}
            step={1}
            onChange={(v) => setParams((p) => ({ ...p, k: v }))}
          />
          <LabSelect
            id="kmeans-init-select"
            label="Initialization Method"
            value={initMethod}
            options={[
              { value: 'k-means++', label: 'k-means++ (Smart Spread)' },
              { value: 'random', label: 'Random Centroid Sampling' },
            ]}
            onChange={setInitMethod}
          />
          <LabSlider
            id="kmeans-seed-slider"
            label="Random Seed"
            value={params.seed}
            min={1}
            max={100}
            step={1}
            onChange={(v) => setParams((p) => ({ ...p, seed: v }))}
          />
          {maxStep > 0 && (
            <LabSlider
              id="kmeans-iter-slider"
              label="Scrub Iteration Step"
              value={stepIdx}
              displayValue={`${activeSnap?.iteration ?? 0} / ${maxStep}`}
              min={0}
              max={maxStep}
              step={1}
              onChange={(v) => {
                setIsPlaying(false);
                setStepIdx(v);
              }}
            />
          )}
        </>
      }
      actionButtons={
        <Button
          variant="primary"
          icon={Play}
          onClick={() => executePipeline(params, datasetName, initMethod)}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Clustering...' : 'Run K-Means'}
        </Button>
      }
      visualization={
        loading && !clusterResult ? (
          <Loading text="Iterating centroids in scikit-learn..." />
        ) : (
          <div className="lab-multi-chart">
            <PlotlyChart
              data={chartData}
              layout={{
                xaxis: { title: 'Feature x₁', zeroline: true },
                yaxis: { title: 'Feature x₂', zeroline: true },
                margin: { t: 24, r: 20, b: 40, l: 50 },
              }}
              height={340}
            />

            {inertiaChartData.length > 0 && (
              <div className="lab-companion-chart-box" style={{ marginTop: '0.75rem' }}>
                <h4 className="lab-dt-chart-title">Inertia (WCSS) Convergence Curve</h4>
                <PlotlyChart
                  data={inertiaChartData}
                  layout={{
                    xaxis: { title: 'Iteration', dtick: 1 },
                    yaxis: { title: 'WCSS Inertia' },
                    margin: { t: 10, r: 16, b: 34, l: 50 },
                  }}
                  height={175}
                />
              </div>
            )}
          </div>
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="Iteration"
            value={activeSnap ? `${activeSnap.iteration} / ${maxStep}` : '—'}
            sub={activeSnap?.iteration === 0 ? 'Initial Centroids' : 'EM Step'}
            color="#38bdf8"
          />
          <LabMetricCard
            label="Inertia (WCSS)"
            value={activeSnap ? formatMetric(activeSnap.inertia, 2) : '—'}
            sub="Within-Cluster Sum of Squares"
            color="#f59e0b"
          />
          <LabMetricCard
            label="Centroid Shift (Δμ)"
            value={activeSnap ? formatMetric(activeSnap.centroid_shift, 4) : '—'}
            sub="Euclidean Norm Moved"
            color="#8b5cf6"
          />
          <LabMetricCard
            label="Convergence"
            value={
              clusterResult
                ? stepIdx === maxStep && clusterResult.converged
                  ? 'Converged'
                  : stepIdx === maxStep
                    ? 'Max Iter'
                    : 'Stepping'
                : '—'
            }
            sub={`Init: ${initMethod}`}
            color="#10b981"
          />
        </>
      }
    />
  );
}
