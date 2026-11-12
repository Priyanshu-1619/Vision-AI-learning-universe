import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play } from 'lucide-react';
import { fetchLabDataset, runDecisionTree } from '../../api/client';
import { colorPalette } from '../../utils/labEngine';
import PlotlyChart from '../mathematics/PlotlyChart';
import Button from '../common/Button';
import Loading from '../common/Loading';
import LaboratoryLayout, {
  LabMetricCard,
  LabSlider,
  LabSelect,
} from './LaboratoryLayout';

const DEFAULT_PARAMS = {
  max_depth: 3,
  min_samples_split: 2,
  n_samples: 200,
  noise: 0.14,
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
    return [idx / (n - 1), `rgba(${r}, ${g}, ${b}, 0.24)`];
  });
}

/** Recursively lay out binary decision tree nodes with clean (x, y) coordinates. */
function layoutTreeNodes(root, maxRenderDepth = 4) {
  if (!root) return { nodes: [], edges: [], width: 760, height: 320 };

  const nodes = [];
  const edges = [];
  let leafOrder = 0;

  function computeDepth(node) {
    if (!node || node.is_leaf || node.depth >= maxRenderDepth) return 0;
    return 1 + Math.max(computeDepth(node.left), computeDepth(node.right));
  }

  const effectiveDepth = Math.min(maxRenderDepth, computeDepth(root));
  const levelHeight = 92;
  const height = Math.max(240, (effectiveDepth + 1) * levelHeight + 40);

  function assign(node, parentId = null, branchLabel = '') {
    if (!node) return null;
    const stopHere = node.is_leaf || node.depth >= maxRenderDepth;

    let xPos;
    if (stopHere) {
      xPos = leafOrder++;
    } else {
      const leftX = assign(node.left, node.node_id, 'True');
      const rightX = assign(node.right, node.node_id, 'False');
      if (leftX !== null && rightX !== null) {
        xPos = (leftX + rightX) / 2;
      } else {
        xPos = leftX ?? rightX ?? leafOrder++;
      }
    }

    const record = {
      ...node,
      truncated: !node.is_leaf && node.depth >= maxRenderDepth,
      gridX: xPos,
      depthLevel: node.depth,
    };
    nodes.push(record);
    if (parentId !== null) {
      edges.push({ from: parentId, to: node.node_id, label: branchLabel });
    }
    return xPos;
  }

  assign(root);

  const totalLeaves = Math.max(2, leafOrder);
  const minSpacing = 128;
  const width = Math.max(680, totalLeaves * minSpacing);
  const padX = 72;
  const usableW = width - padX * 2;

  const coordById = {};
  for (const n of nodes) {
    n.svgX = padX + (n.gridX / Math.max(1, totalLeaves - 1)) * usableW;
    n.svgY = 46 + n.depthLevel * levelHeight;
    coordById[n.node_id] = { x: n.svgX, y: n.svgY };
  }

  const resolvedEdges = edges.map((e) => ({
    ...e,
    source: coordById[e.from],
    target: coordById[e.to],
  }));

  return { nodes, edges: resolvedEdges, width, height };
}

function TreeDiagram({ treeStructure }) {
  const [selectedNodeId, setSelectedNodeId] = useState(0);
  const layout = useMemo(() => layoutTreeNodes(treeStructure, 4), [treeStructure]);

  if (!treeStructure) return null;
  const inspected =
    layout.nodes.find((n) => n.node_id === selectedNodeId) || layout.nodes[0];

  return (
    <div className="lab-tree-viz-wrap">
      <div className="lab-tree-scroll">
        <svg
          className="lab-tree-svg"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
          height={layout.height}
          role="img"
          aria-label="Trained Decision Tree splits"
        >
          {layout.edges.map((edge, i) => {
            if (!edge.source || !edge.target) return null;
            const midX = (edge.source.x + edge.target.x) / 2;
            const midY = (edge.source.y + edge.target.y) / 2 - 4;
            return (
              <g key={i}>
                <line
                  x1={edge.source.x}
                  y1={edge.source.y + 24}
                  x2={edge.target.x}
                  y2={edge.target.y - 24}
                  stroke="rgba(148, 163, 184, 0.4)"
                  strokeWidth={1.6}
                />
                <text
                  x={midX}
                  y={midY}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {layout.nodes.map((node) => {
            const clsColor = colorPalette[(node.predicted_class || 0) % colorPalette.length];
            const isSelected = inspected?.node_id === node.node_id;
            return (
              <g
                key={node.node_id}
                transform={`translate(${node.svgX}, ${node.svgY})`}
                onClick={() => setSelectedNodeId(node.node_id)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={-56}
                  y={-25}
                  width={112}
                  height={50}
                  rx={8}
                  fill={node.is_leaf ? 'rgba(15, 23, 42, 0.92)' : 'rgba(15, 23, 42, 0.88)'}
                  stroke={isSelected ? '#ffffff' : clsColor}
                  strokeWidth={isSelected ? 2 : 1.3}
                />
                <text
                  y={-7}
                  fill="#f1f5f9"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {node.is_leaf
                    ? `Leaf → Class ${node.predicted_class}`
                    : `${node.feature_name} ≤ ${node.threshold}`}
                </text>
                <text y={8} fill="#94a3b8" fontSize="9.5" textAnchor="middle">
                  {node.is_leaf
                    ? `imp=${node.impurity} · n=${node.n_samples}`
                    : `gain=${node.info_gain} · n=${node.n_samples}`}
                </text>
                <text y={20} fill={clsColor} fontSize="9" textAnchor="middle">
                  [{node.value?.join(', ')}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {inspected && (
        <div className="lab-tree-inspector">
          <span>
            <strong>Node #{inspected.node_id}</strong> ({inspected.is_leaf ? 'Leaf Node' : 'Split Node'})
          </span>
          {!inspected.is_leaf && (
            <span>
              Rule: <code>{inspected.feature_name} ≤ {inspected.threshold}</code>
            </span>
          )}
          <span>Impurity: <strong>{inspected.impurity}</strong></span>
          {!inspected.is_leaf && (
            <span>Info Gain: <strong>{inspected.info_gain}</strong></span>
          )}
          <span>Samples: <strong>{inspected.n_samples}</strong></span>
          <span>Distribution: <code>[{inspected.value?.join(', ')}]</code></span>
        </div>
      )}
    </div>
  );
}

export default function DecisionTreeLab({ config }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [datasetName, setDatasetName] = useState(config.defaultDataset || 'moons');
  const [criterion, setCriterion] = useState('gini');
  const [vizTab, setVizTab] = useState('boundary'); // boundary | tree | curves

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [treeResult, setTreeResult] = useState(null);
  const [rawDataset, setRawDataset] = useState({ data: [], labels: [], feature_names: ['x1', 'x2'] });

  const executePipeline = useCallback(async (currentParams, currentDataset, currentCriterion) => {
    setLoading(true);
    setError(null);
    try {
      const dataset = await fetchLabDataset(
        currentDataset,
        currentParams.n_samples,
        currentParams.noise
      );
      setRawDataset(dataset);

      const result = await runDecisionTree(dataset.data, dataset.labels, {
        maxDepth: currentParams.max_depth,
        minSamplesSplit: currentParams.min_samples_split,
        criterion: currentCriterion,
        featureNames: dataset.feature_names,
      });
      setTreeResult(result);
    } catch (err) {
      setError(err.message || 'Failed to train Decision Tree on backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      executePipeline(params, datasetName, criterion);
    }, 220);
    return () => clearTimeout(timer);
  }, [params, datasetName, criterion, executePipeline]);

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setDatasetName(config.defaultDataset || 'moons');
    setCriterion('gini');
    setVizTab('boundary');
  };

  const boundaryChartData = useMemo(() => {
    if (!rawDataset.data || rawDataset.data.length === 0 || !treeResult) return [];
    const { data, labels } = rawDataset;
    const uniqueClasses = Array.from(new Set(labels)).sort((a, b) => a - b);
    const traces = [];

    const b = treeResult.boundary;
    if (b?.x_grid && b?.y_grid && b?.z_classes) {
      traces.push({
        x: b.x_grid,
        y: b.y_grid,
        z: b.z_classes,
        type: 'heatmap',
        colorscale: makeColorscale(uniqueClasses),
        zmin: uniqueClasses[0],
        zmax: uniqueClasses[uniqueClasses.length - 1] || 1,
        showscale: false,
        zsmooth: false, // keep orthogonal decision regions crisp!
        hovertemplate: 'Predicted Class %{z}<extra></extra>',
      });
    }

    for (const c of uniqueClasses) {
      const pts = data.filter((_, idx) => labels[idx] === c);
      traces.push({
        x: pts.map((p) => p[0]),
        y: pts.map((p) => p[1]),
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

    return traces;
  }, [rawDataset, treeResult]);

  const importanceChartData = useMemo(() => {
    if (!treeResult?.feature_importances) return [];
    const fNames = rawDataset.feature_names || ['x1', 'x2'];
    return [
      {
        x: treeResult.feature_importances.map((_, i) => fNames[i] || `x${i + 1}`),
        y: treeResult.feature_importances,
        type: 'bar',
        marker: { color: ['#38bdf8', '#8b5cf6', '#10b981', '#f59e0b'] },
      },
    ];
  }, [treeResult, rawDataset.feature_names]);

  const depthChartData = useMemo(() => {
    if (!treeResult?.depth_accuracy) return [];
    const curve = treeResult.depth_accuracy;
    return [
      {
        x: curve.map((d) => d.depth),
        y: curve.map((d) => d.train_acc),
        mode: 'lines+markers',
        type: 'scatter',
        name: 'Train Accuracy',
        line: { color: '#38bdf8', width: 2.5 },
      },
      {
        x: curve.map((d) => d.depth),
        y: curve.map((d) => d.test_acc),
        mode: 'lines+markers',
        type: 'scatter',
        name: 'Validation Accuracy',
        line: { color: '#10b981', width: 2.5 },
      },
    ];
  }, [treeResult]);

  const fNames = rawDataset.feature_names || ['x1', 'x2'];

  return (
    <LaboratoryLayout
      config={config}
      loading={loading}
      error={error}
      onRetry={() => executePipeline(params, datasetName, criterion)}
      onReset={handleReset}
      stageTitle="Axis-Aligned Partitions, Actual Tree Structure & Impurity Splits"
      stageSubtitle={
        <>
          Trained via <code>sklearn.tree.DecisionTreeClassifier</code> ({criterion})
        </>
      }
      stageHeaderExtra={
        <div className="lab-subtabs" role="tablist" aria-label="Decision tree views">
          {[
            { id: 'boundary', label: 'Decision Boundary' },
            { id: 'tree', label: 'Trained Tree Nodes' },
            { id: 'curves', label: 'Depth & Importance' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={vizTab === tab.id}
              className={`lab-subtab ${vizTab === tab.id ? 'lab-subtab--active' : ''}`}
              onClick={() => setVizTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
      datasetControls={
        <>
          <LabSelect
            id="dt-dataset-select"
            label="Dataset Geometry"
            value={datasetName}
            options={config.datasets}
            onChange={setDatasetName}
          />
          <LabSlider
            id="dt-samples-slider"
            label="Sample Count (n)"
            value={params.n_samples}
            min={100}
            max={400}
            step={50}
            onChange={(v) => setParams((p) => ({ ...p, n_samples: v }))}
          />
          <LabSlider
            id="dt-noise-slider"
            label="Noise Level (σ)"
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
          <LabSelect
            id="dt-criterion-select"
            label="Split Criterion"
            value={criterion}
            options={[
              { value: 'gini', label: 'Gini Impurity' },
              { value: 'entropy', label: 'Shannon Entropy' },
              { value: 'log_loss', label: 'Log-Loss (Cross-Entropy)' },
            ]}
            onChange={setCriterion}
          />
          <LabSlider
            id="dt-depth-slider"
            label="max_depth"
            value={params.max_depth}
            min={1}
            max={8}
            step={1}
            onChange={(v) => setParams((p) => ({ ...p, max_depth: v }))}
          />
          <LabSlider
            id="dt-min-split-slider"
            label="min_samples_split"
            value={params.min_samples_split}
            min={2}
            max={25}
            step={1}
            onChange={(v) => setParams((p) => ({ ...p, min_samples_split: v }))}
          />
        </>
      }
      actionButtons={
        <Button
          variant="primary"
          icon={Play}
          onClick={() => executePipeline(params, datasetName, criterion)}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Training...' : 'Retrain Tree'}
        </Button>
      }
      visualization={
        loading && !treeResult ? (
          <Loading text="Building optimal recursive splits..." />
        ) : vizTab === 'boundary' ? (
          <PlotlyChart
            data={boundaryChartData}
            layout={{
              xaxis: { title: fNames[0] || 'x₁', zeroline: true },
              yaxis: { title: fNames[1] || 'x₂', zeroline: true },
              margin: { t: 24, r: 20, b: 40, l: 50 },
            }}
            height={380}
          />
        ) : vizTab === 'tree' ? (
          <TreeDiagram treeStructure={treeResult?.tree_structure} />
        ) : (
          <div className="lab-dt-charts-grid">
            <div className="lab-dt-chart-box">
              <h4 className="lab-dt-chart-title">Feature Importance</h4>
              <PlotlyChart
                data={importanceChartData}
                layout={{
                  yaxis: { title: 'Importance', range: [0, 1] },
                  margin: { t: 15, r: 15, b: 35, l: 45 },
                }}
                height={300}
              />
            </div>
            <div className="lab-dt-chart-box">
              <h4 className="lab-dt-chart-title">Train vs Validation Accuracy Across Depth</h4>
              <PlotlyChart
                data={depthChartData}
                layout={{
                  xaxis: { title: 'max_depth', dtick: 1 },
                  yaxis: { title: 'Accuracy', range: [0.4, 1.05] },
                  margin: { t: 15, r: 15, b: 35, l: 45 },
                }}
                height={300}
              />
            </div>
          </div>
        )
      }
      metrics={
        <>
          <LabMetricCard
            label="Validation Accuracy"
            value={treeResult?.accuracy !== undefined ? `${(treeResult.accuracy * 100).toFixed(1)}%` : '—'}
            sub="30% Holdout Set"
            color="#10b981"
          />
          <LabMetricCard
            label="Train Accuracy"
            value={treeResult?.train_accuracy !== undefined ? `${(treeResult.train_accuracy * 100).toFixed(1)}%` : '—'}
            sub="70% Training Set"
            color="#38bdf8"
          />
          <LabMetricCard
            label="Actual Depth / Leaves"
            value={treeResult ? `${treeResult.tree_depth} / ${treeResult.n_leaves}` : '—'}
            sub="Root-to-Leaf / Regions"
            color="#f59e0b"
          />
          <LabMetricCard
            label="Root Info Gain"
            value={treeResult?.tree_structure ? String(treeResult.tree_structure.info_gain) : '—'}
            sub={`Criterion: ${criterion}`}
            color="#8b5cf6"
          />
        </>
      }
    />
  );
}
