import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Crosshair, Play } from 'lucide-react';
import { fetchLabDataset, runKNN } from '../../api/client';
import { colorPalette, formatMetric } from '../../utils/labEngine';
import PlotlyChart from '../mathematics/PlotlyChart';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Loading from '../common/Loading';
import LaboratoryLayout, {
  LabMetricCard,
  LabSlider,
  LabSelect,
} from './LaboratoryLayout';

const DEFAULT_PARAMS = {
  k: 5,
  n_samples: 160,
  noise: 0.14,
  qx: 0.25,
  qy: 0.25,
};

function makeColorscale(uniqueClasses) {
  if (uniqueClasses.length <= 1) {
    return [
      [0, 'rgba(56, 189, 248, 0.20)'],
      [1, 'rgba(56, 189, 248, 0.20)'],
    ];
  }
  const n = uniqueClasses.length;
  return uniqueClasses.map((c, idx) => {
    const hex = colorPalette[c % colorPalette.length];
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [idx / (n - 1), `rgba(${r}, ${g}, ${b}, 0.22)`];
  });
}

export default function KNNLab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [datasetName, setDatasetName] = useState(config.defaultDataset || 'moons');
  const [metric, setMetric] = useState('euclidean');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [knnResult, setKnnResult] = useState(null);
  const [rawDataset, setRawDataset] = useState({ data: [], labels: [], feature_names: ['x1', 'x2'] });

  const cachedDsKeyRef = useRef('');
  const cachedDsRef = useRef(null);

  const executePipeline = useCallback(async (currentParams, currentDataset, currentMetric) => {
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

      const query = [currentParams.qx, currentParams.qy];
      const result = await runKNN(
        dataset.data,
        dataset.labels,
        query,
        currentParams.k,
        currentMetric
      );
      setKnnResult(result);
    } catch (err) {
      setError(err.message || 'Failed to compute KNN on backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      executePipeline(params, datasetName, metric);
    }, 180);
    return () => clearTimeout(timer);
  }, [params, datasetName, metric, executePipeline]);

  const handleReset = () => {
    cachedDsKeyRef.current = '';
    setParams(DEFAULT_PARAMS);
    setDatasetName(config.defaultDataset || 'moons');
    setMetric('euclidean');
  };

  const handleRandomizeQuery = () => {
    if (!rawDataset.data || rawDataset.data.length === 0) return;
    const xs = rawDataset.data.map((p) => p[0]);
    const ys = rawDataset.data.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const qx = Number((minX + Math.random() * (maxX - minX)).toFixed(2));
    const qy = Number((minY + Math.random() * (maxY - minY)).toFixed(2));
    setParams((p) => ({ ...p, qx, qy }));
  };

  const handlePlotClick = useCallback((eventData) => {
    const pt = eventData?.points?.[0];
    if (!pt || typeof pt.x !== 'number' || typeof pt.y !== 'number') return;
    setParams((p) => ({
      ...p,
      qx: Number(pt.x.toFixed(2)),
      qy: Number(pt.y.toFixed(2)),
    }));
  }, []);

  const chartData = useMemo(() => {
    if (!rawDataset.data || rawDataset.data.length === 0 || !knnResult) return [];

    const { data, labels } = rawDataset;
    const { neighbors, predicted_class, boundary } = knnResult;
    const neighborSet = new Set(neighbors || []);
    const uniqueClasses = Array.from(new Set(labels)).sort((a, b) => a - b);
    const traces = [];

    // 1. Real 2-D decision boundary heatmap from sklearn
    if (boundary?.x_grid && boundary?.y_grid && boundary?.z_classes) {
      traces.push({
        x: boundary.x_grid,
        y: boundary.y_grid,
        z: boundary.z_classes,
        type: 'heatmap',
        colorscale: makeColorscale(uniqueClasses),
        zmin: uniqueClasses[0],
        zmax: uniqueClasses[uniqueClasses.length - 1] || 1,
        showscale: false,
        opacity: 0.9,
        zsmooth: 'best',
        hovertemplate: 'Boundary region (x₁=%{x:.2f}, x₂=%{y:.2f}) → Class %{z}<extra></extra>',
      });
    }

    // 2. Lines connecting query point to its K nearest neighbors
    if (neighbors && neighbors.length > 0) {
      const lineX = [];
      const lineY = [];
      for (const idx of neighbors) {
        const pt = data[idx];
        if (pt) {
          lineX.push(params.qx, pt[0], null);
          lineY.push(params.qy, pt[1], null);
        }
      }
      traces.push({
        x: lineX,
        y: lineY,
        mode: 'lines',
        type: 'scatter',
        name: 'Neighbor Links',
        line: { color: 'rgba(255, 255, 255, 0.55)', width: 1.4, dash: 'dot' },
        hoverinfo: 'skip',
      });
    }

    // 3. Training points colored by true label
    for (const c of uniqueClasses) {
      const classPoints = data.filter((_, idx) => labels[idx] === c && !neighborSet.has(idx));
      traces.push({
        x: classPoints.map((p) => p[0]),
        y: classPoints.map((p) => p[1]),
        mode: 'markers',
        type: 'scatter',
        name: `Class ${c}`,
        marker: {
          color: colorPalette[c % colorPalette.length],
          size: 7,
          opacity: 0.85,
          line: { color: '#0f172a', width: 1 },
        },
      });
    }

    // 4. Highlighted K nearest neighbor rings
    if (neighbors && neighbors.length > 0) {
      const neighborPoints = neighbors.map((idx) => data[idx]).filter(Boolean);
      traces.push({
        x: neighborPoints.map((p) => p[0]),
        y: neighborPoints.map((p) => p[1]),
        mode: 'markers',
        type: 'scatter',
        name: `${params.k} Nearest Neighbors`,
        marker: {
          color: neighborPoints.map((_, i) => {
            const origIdx = neighbors[i];
            return colorPalette[(labels[origIdx] || 0) % colorPalette.length];
          }),
          size: 11,
          line: { color: '#ffffff', width: 2.5 },
        },
      });
    }

    // 5. Interactive Query Point
    traces.push({
      x: [params.qx],
      y: [params.qy],
      mode: 'markers',
      type: 'scatter',
      name: `Query (Pred: Class ${predicted_class})`,
      marker: {
        symbol: 'star',
        color: '#ffffff',
        size: 17,
        line: {
          color: colorPalette[(predicted_class || 0) % colorPalette.length],
          width: 2.5,
        },
      },
    });

    return traces;
  }, [rawDataset, knnResult, params.k, params.qx, params.qy]);

  const probEntries = useMemo(() => {
    if (!knnResult?.class_probabilities) return [];
    return Object.entries(knnResult.class_probabilities).map(([cls, prob]) => ({
      cls,
      prob: Number(prob),
      percent: (Number(prob) * 100).toFixed(1),
    }));
  }, [knnResult]);

  const xBounds = useMemo(() => {
    if (!rawDataset.data || rawDataset.data.length === 0) return { minX: -2, maxX: 3, minY: -2, maxY: 2 };
    const xs = rawDataset.data.map((p) => p[0]);
    const ys = rawDataset.data.map((p) => p[1]);
    return {
      minX: Number((Math.min(...xs) - 0.5).toFixed(1)),
      maxX: Number((Math.max(...xs) + 0.5).toFixed(1)),
      minY: Number((Math.min(...ys) - 0.5).toFixed(1)),
      maxY: Number((Math.max(...ys) + 0.5).toFixed(1)),
    };
  }, [rawDataset]);

  const fNames = rawDataset.feature_names || ['x1', 'x2'];

  return (
    <LaboratoryLayout
      config={config}
      loading={loading}
      error={error}
      onRetry={() => executePipeline(params, datasetName, metric)}
      onReset={handleReset}
      stageTitle="Decision Boundary & Query Neighborhood Voting"
      stageSubtitle={
        <>
          Click anywhere on the plot to move the query point <code>q</code> — live surface by{' '}
          <code>sklearn.neighbors.KNeighborsClassifier</code>
        </>
      }
      stageHeaderExtra={
        <Button
          variant="secondary"
          icon={Crosshair}
          onClick={handleRandomizeQuery}
          style={{ padding: '4px 10px' }}
        >
          Random Query
        </Button>
      }
      datasetControls={
        <>
          <LabSelect
            id="knn-dataset-select"
            label="Dataset Geometry"
            value={datasetName}
            options={config.datasets}
            onChange={(v) => {
              setDatasetName(v);
              if (v === 'iris') {
                setParams((p) => ({ ...p, qx: 3.8, qy: 1.2 }));
              } else {
                setParams((p) => ({ ...p, qx: 0.25, qy: 0.25 }));
              }
            }}
          />
          <LabSlider
            id="knn-samples-slider"
            label="Sample Count (n)"
            value={params.n_samples}
            min={80}
            max={300}
            step={20}
            onChange={(v) => setParams((p) => ({ ...p, n_samples: v }))}
          />
          <LabSlider
            id="knn-noise-slider"
            label="Class Overlap Noise (σ)"
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
            id="knn-k-slider"
            label="Neighbors (K)"
            value={params.k}
            min={1}
            max={15}
            step={2}
            onChange={(v) => setParams((p) => ({ ...p, k: v }))}
          />
          <LabSelect
            id="knn-metric-select"
            label="Distance Metric"
            value={metric}
            options={[
              { value: 'euclidean', label: 'Euclidean (L₂ Distance)' },
              { value: 'manhattan', label: 'Manhattan (L₁ City-Block)' },
              { value: 'chebyshev', label: 'Chebyshev (L∞ Max-Coord)' },
            ]}
            onChange={setMetric}
          />
          <div className="lab-control-group">
            <div className="lab-slider-head">
              <label htmlFor="knn-qx-slider">Query Coordinate ({params.qx.toFixed(2)}, {params.qy.toFixed(2)})</label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                id="knn-qx-slider"
                type="range"
                className="lab-slider"
                min={xBounds.minX}
                max={xBounds.maxX}
                step={0.05}
                value={params.qx}
                onChange={(e) => setParams((p) => ({ ...p, qx: Number(e.target.value) }))}
                title={`x1 = ${params.qx}`}
              />
              <input
                id="knn-qy-slider"
                type="range"
                className="lab-slider"
                min={xBounds.minY}
                max={xBounds.maxY}
                step={0.05}
                value={params.qy}
                onChange={(e) => setParams((p) => ({ ...p, qy: Number(e.target.value) }))}
                title={`x2 = ${params.qy}`}
              />
            </div>
            <span className="lab-control-hint">Tip: Click directly on the chart canvas to place q.</span>
          </div>
        </>
      }
      actionButtons={
        <Button
          variant="primary"
          icon={Play}
          onClick={() => executePipeline(params, datasetName, metric)}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Classifying...' : 'Recompute Boundary'}
        </Button>
      }
      visualization={
        loading && !knnResult ? (
          <Loading text="Computing KNN decision surface..." />
        ) : (
          <PlotlyChart
            data={chartData}
            layout={{
              xaxis: { title: fNames[0] || 'Feature x₁', zeroline: true },
              yaxis: { title: fNames[1] || 'Feature x₂', zeroline: true },
              margin: { t: 24, r: 20, b: 40, l: 50 },
              hovermode: 'closest',
            }}
            height={380}
            onPlotClick={handlePlotClick}
          />
        )
      }
      extraStagePanels={
        knnResult && (
          <div className="lab-knn-summary">
            <div className="lab-knn-summary__pred">
              <span className="lab-metric-card__label">Predicted Class</span>
              <div className="lab-knn-summary__badge">
                <Badge
                  text={`Class ${knnResult.predicted_class}`}
                  color={colorPalette[(knnResult.predicted_class || 0) % colorPalette.length]}
                  size="md"
                />
              </div>
            </div>

            <div className="lab-knn-summary__probs">
              <span className="lab-metric-card__label">Class Posterior Probabilities P(y|q)</span>
              <div className="lab-prob-bars">
                {probEntries.map(({ cls, percent }) => (
                  <div key={cls} className="lab-prob-bar-row">
                    <span className="lab-prob-bar-label">Class {cls}:</span>
                    <div className="lab-prob-bar-track">
                      <div
                        className="lab-prob-bar-fill"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: colorPalette[Number(cls) % colorPalette.length],
                        }}
                      />
                    </div>
                    <span className="lab-prob-bar-val">{percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="Validation Accuracy"
            value={
              knnResult?.validation_accuracy !== undefined
                ? `${(knnResult.validation_accuracy * 100).toFixed(1)}%`
                : '—'
            }
            sub="Holdout Split (30%)"
            color="#10b981"
          />
          <LabMetricCard
            label="Closest Neighbor"
            value={
              knnResult?.neighbor_distances?.[0] !== undefined
                ? formatMetric(knnResult.neighbor_distances[0], 4)
                : '—'
            }
            sub={`Distance (${metric})`}
            color="#38bdf8"
          />
          <LabMetricCard
            label="Kth Radius"
            value={
              knnResult?.neighbor_distances?.length > 0
                ? formatMetric(
                    knnResult.neighbor_distances[knnResult.neighbor_distances.length - 1],
                    4
                  )
                : '—'
            }
            sub={`Ball covering K=${params.k}`}
            color="#f59e0b"
          />
          <LabMetricCard
            label="Query Coordinates"
            value={`(${params.qx.toFixed(2)}, ${params.qy.toFixed(2)})`}
            sub="Click chart to move"
            color="#8b5cf6"
          />
        </>
      }
    />
  );
}
