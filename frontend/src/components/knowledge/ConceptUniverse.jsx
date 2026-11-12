import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as d3 from 'd3';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Circle,
  Compass,
  ExternalLink,
  GitBranch,
  Layers,
  Maximize2,
  Search,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useConcepts } from '../../hooks/useConcepts';
import { useGraph } from '../../hooks/useGraph';
import {
  EXPLORED_UPDATED_EVENT,
  MOCK_CONCEPTS,
  buildGraphFromConcepts,
  getConceptLineage,
  getExploredIds,
  resolveConceptLinks,
  toggleConceptExplored,
} from '../../concept-engine/ConceptEngine';
import { categoryColors } from '../../theme/colors';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Loading from '../common/Loading';
import './ConceptUniverse.css';

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1100;

const CLUSTER_ANCHORS = {
  Foundations: { x: 270, y: 245 },
  Mathematics: { x: 780, y: 210 },
  'Data Science': { x: 1320, y: 235 },
  'Core ML': { x: 485, y: 530 },
  Algorithms: { x: 1155, y: 545 },
  Optimization: { x: 265, y: 850 },
  'Deep Learning': { x: 825, y: 835 },
  Evaluation: { x: 1355, y: 865 },
};

const DIFFICULTY_RADIUS = {
  Beginner: 15,
  Intermediate: 18,
  Advanced: 21,
};

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const MASTERY_FILTERS = ['All', 'Explored', 'Unexplored'];
const CONNECTION_MODES = [
  { id: 'selected', label: 'Selected Paths' },
  { id: 'prerequisites', label: 'Prerequisites Only' },
  { id: 'all', label: 'All Connections' },
];

// Deterministic background starfield so the cosmos stays crisp across renders
const BACKGROUND_STARS = Array.from({ length: 130 }, (_, i) => {
  const sx = ((i * 397 + 73) % (WORLD_WIDTH - 40)) + 20;
  const sy = ((i * 613 + 131) % (WORLD_HEIGHT - 40)) + 20;
  const r = i % 7 === 0 ? 1.7 : i % 3 === 0 ? 1.2 : 0.8;
  const opacity = 0.16 + ((i * 29) % 45) / 100;
  return { id: i, x: sx, y: sy, r, opacity };
});

function sanitizeId(value) {
  return String(value || 'cluster').replace(/[^a-zA-Z0-9_-]/g, '-');
}

function buildCurvedEdgePath(sourceNode, targetNode) {
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const dist = Math.hypot(dx, dy) || 1;
  const offset = Math.min(42, dist * 0.13);

  const mx = (sourceNode.x + targetNode.x) / 2;
  const my = (sourceNode.y + targetNode.y) / 2;
  const cx = mx - (dy / dist) * offset;
  const cy = my + (dx / dist) * offset;

  const sVecX = cx - sourceNode.x;
  const sVecY = cy - sourceNode.y;
  const sLen = Math.hypot(sVecX, sVecY) || 1;
  const startPad = sourceNode.radius + 4;
  const sx = sourceNode.x + (sVecX / sLen) * startPad;
  const sy = sourceNode.y + (sVecY / sLen) * startPad;

  const tVecX = targetNode.x - cx;
  const tVecY = targetNode.y - cy;
  const tLen = Math.hypot(tVecX, tVecY) || 1;
  const endPad = targetNode.radius + 9;
  const tx = targetNode.x - (tVecX / tLen) * endPad;
  const ty = targetNode.y - (tVecY / tLen) * endPad;

  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;
}

export default function ConceptUniverse() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { concepts, loading: conceptsLoading } = useConcepts();
  const { graph: apiGraph, loading: graphLoading } = useGraph();

  const focusedCategory = searchParams.get('category') || 'All';

  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [masteryFilter, setMasteryFilter] = useState('All');
  const [connectionMode, setConnectionMode] = useState('selected');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [exploredList, setExploredList] = useState(() => getExploredIds());

  const svgRef = useRef(null);
  const zoomLayerRef = useRef(null);
  const zoomBehaviorRef = useRef(null);

  useEffect(() => {
    const syncExplored = () => setExploredList(getExploredIds());
    window.addEventListener(EXPLORED_UPDATED_EVENT, syncExplored);
    window.addEventListener('storage', syncExplored);
    return () => {
      window.removeEventListener(EXPLORED_UPDATED_EVENT, syncExplored);
      window.removeEventListener('storage', syncExplored);
    };
  }, []);

  const exploredSet = useMemo(() => new Set(exploredList), [exploredList]);

  const effectiveConcepts = useMemo(
    () => (concepts.length > 0 ? concepts : MOCK_CONCEPTS),
    [concepts]
  );

  const conceptMap = useMemo(
    () => new Map(effectiveConcepts.map((c) => [c.id, c])),
    [effectiveConcepts]
  );

  const rawGraph = useMemo(() => {
    if (apiGraph?.nodes?.length > 0) return apiGraph;
    return buildGraphFromConcepts(effectiveConcepts);
  }, [apiGraph, effectiveConcepts]);

  // Deterministic clustered constellation layout using D3 forceSimulation
  const layout = useMemo(() => {
    const rawNodes = rawGraph.nodes || [];
    const rawEdges = rawGraph.edges || [];

    const categoryNames = Array.from(new Set(rawNodes.map((n) => n.category))).sort((a, b) =>
      a.localeCompare(b)
    );

    const anchorForCategory = (cat) => {
      if (CLUSTER_ANCHORS[cat]) return CLUSTER_ANCHORS[cat];
      const idx = Math.max(0, categoryNames.indexOf(cat));
      const angle = (idx / Math.max(1, categoryNames.length)) * Math.PI * 2;
      return {
        x: WORLD_WIDTH / 2 + Math.cos(angle) * 460,
        y: WORLD_HEIGHT / 2 + Math.sin(angle) * 320,
      };
    };

    const grouped = new Map();
    for (const node of rawNodes) {
      if (!grouped.has(node.category)) grouped.set(node.category, []);
      grouped.get(node.category).push(node);
    }

    const simNodes = [];
    for (const [cat, members] of grouped.entries()) {
      const anchor = anchorForCategory(cat);
      const sortedMembers = [...members].sort((a, b) => a.title.localeCompare(b.title));
      sortedMembers.forEach((node, idx) => {
        const angle = idx * 2.39996; // Golden angle spiral inside cluster
        const dist = 24 + Math.sqrt(idx) * 34;
        const radius = DIFFICULTY_RADIUS[node.difficulty] || 17;
        simNodes.push({
          ...node,
          color: node.color || categoryColors[node.category] || '#06b6d4',
          radius,
          anchorX: anchor.x,
          anchorY: anchor.y,
          x: anchor.x + Math.cos(angle) * dist,
          y: anchor.y + Math.sin(angle) * dist,
        });
      });
    }

    const simulation = d3
      .forceSimulation(simNodes)
      .force('x', d3.forceX((d) => d.anchorX).strength(0.36))
      .force('y', d3.forceY((d) => d.anchorY).strength(0.36))
      .force('charge', d3.forceManyBody().strength(-70))
      .force('collide', d3.forceCollide((d) => d.radius + 26).strength(0.95).iterations(3))
      .stop();

    for (let i = 0; i < 180; i += 1) {
      simulation.tick();
    }

    const nodeById = new Map(simNodes.map((n) => [n.id, n]));

    // Build cluster nebula bounding circles from settled node coordinates
    const clusters = [];
    for (const [cat, members] of grouped.entries()) {
      const settled = members.map((m) => nodeById.get(m.id)).filter(Boolean);
      if (settled.length === 0) continue;

      const cx = settled.reduce((sum, n) => sum + n.x, 0) / settled.length;
      const cy = settled.reduce((sum, n) => sum + n.y, 0) / settled.length;
      const maxReach = settled.reduce(
        (max, n) => Math.max(max, Math.hypot(n.x - cx, n.y - cy) + n.radius),
        0
      );

      clusters.push({
        name: cat,
        slug: sanitizeId(cat),
        color: categoryColors[cat] || settled[0]?.color || '#06b6d4',
        cx,
        cy,
        radius: Math.max(108, maxReach + 42),
        nodeIds: settled.map((n) => n.id),
      });
    }

    clusters.sort((a, b) => a.name.localeCompare(b.name));

    const edges = rawEdges
      .map((e, idx) => {
        const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
        const targetId = typeof e.target === 'object' ? e.target.id : e.target;
        const sourceNode = nodeById.get(sourceId);
        const targetNode = nodeById.get(targetId);
        if (!sourceNode || !targetNode || sourceId === targetId) return null;
        return {
          key: `${sourceId}-${targetId}-${e.type}-${idx}`,
          source: sourceId,
          target: targetId,
          sourceId,
          targetId,
          type: e.type,
          d: buildCurvedEdgePath(sourceNode, targetNode),
        };
      })
      .filter(Boolean);

    return { nodes: simNodes, nodeById, clusters, edges };
  }, [rawGraph]);

  const isLoading = conceptsLoading && graphLoading;

  // Attach D3 zoom/pan behavior to SVG viewport
  useEffect(() => {
    if (isLoading) return undefined;
    const svgEl = svgRef.current;
    const layerEl = zoomLayerRef.current;
    if (!svgEl || !layerEl) return undefined;

    const svg = d3.select(svgEl);
    const layer = d3.select(layerEl);

    const zoom = d3
      .zoom()
      .scaleExtent([0.45, 3.6])
      .extent([
        [0, 0],
        [WORLD_WIDTH, WORLD_HEIGHT],
      ])
      .translateExtent([
        [-260, -200],
        [WORLD_WIDTH + 260, WORLD_HEIGHT + 200],
      ])
      .on('zoom', (event) => {
        layer.attr('transform', event.transform.toString());
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    return () => {
      svg.on('.zoom', null);
    };
  }, [isLoading, layout.nodes.length]);

  const applyZoomTransform = useCallback((transform, duration = 550) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .call(zoomBehaviorRef.current.transform, transform);
  }, []);

  const zoomToCluster = useCallback(
    (cluster) => {
      if (!cluster) {
        applyZoomTransform(d3.zoomIdentity, 550);
        return;
      }
      const pad = cluster.radius * 2.55;
      const scale = Math.min(2.6, Math.max(0.85, Math.min(WORLD_WIDTH / pad, WORLD_HEIGHT / pad)));
      const tx = WORLD_WIDTH / 2 - scale * cluster.cx;
      const ty = WORLD_HEIGHT / 2 - scale * cluster.cy;
      applyZoomTransform(d3.zoomIdentity.translate(tx, ty).scale(scale), 550);
    },
    [applyZoomTransform]
  );

  const zoomToNode = useCallback(
    (node) => {
      if (!node) return;
      const scale = 1.9;
      const tx = WORLD_WIDTH / 2 - scale * node.x;
      const ty = WORLD_HEIGHT / 2 - scale * node.y;
      applyZoomTransform(d3.zoomIdentity.translate(tx, ty).scale(scale), 550);
    },
    [applyZoomTransform]
  );

  // Semantic cluster zoom when ?category= changes
  useEffect(() => {
    if (isLoading) return;
    if (focusedCategory === 'All') {
      applyZoomTransform(d3.zoomIdentity, 500);
      return;
    }
    const targetCluster = layout.clusters.find((c) => c.name === focusedCategory);
    if (targetCluster) {
      zoomToCluster(targetCluster);
    }
  }, [isLoading, focusedCategory, layout.clusters, applyZoomTransform, zoomToCluster]);

  const handleCategoryFocus = (catName) => {
    const next = new URLSearchParams(searchParams);
    if (catName === 'All' || catName === focusedCategory) {
      next.delete('category');
    } else {
      next.set('category', catName);
    }
    setSearchParams(next, { replace: true });
  };

  const handleResetUniverse = () => {
    setSelectedNodeId(null);
    if (focusedCategory !== 'All') {
      const next = new URLSearchParams(searchParams);
      next.delete('category');
      setSearchParams(next, { replace: true });
    }
    applyZoomTransform(d3.zoomIdentity, 500);
  };

  const handleZoomBy = (factor) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(220)
      .call(zoomBehaviorRef.current.scaleBy, factor);
  };

  // Search + difficulty + mastery filtering
  const searchLower = searchQuery.trim().toLowerCase();
  const hasActiveFilter =
    Boolean(searchLower) || difficultyFilter !== 'All' || masteryFilter !== 'All';

  const matchingIds = useMemo(() => {
    const ids = new Set();
    for (const node of layout.nodes) {
      const matchesSearch =
        !searchLower ||
        node.title?.toLowerCase().includes(searchLower) ||
        node.category?.toLowerCase().includes(searchLower) ||
        node.id?.toLowerCase().includes(searchLower);
      const matchesDiff =
        difficultyFilter === 'All' || node.difficulty === difficultyFilter;
      const isExplored = exploredSet.has(node.id);
      const matchesMastery =
        masteryFilter === 'All' ||
        (masteryFilter === 'Explored' && isExplored) ||
        (masteryFilter === 'Unexplored' && !isExplored);

      if (matchesSearch && matchesDiff && matchesMastery) {
        ids.add(node.id);
      }
    }
    return ids;
  }, [layout.nodes, searchLower, difficultyFilter, masteryFilter, exploredSet]);

  const activeFocusId = hoveredNodeId || selectedNodeId;
  const lineage = useMemo(
    () => getConceptLineage(activeFocusId, layout.edges),
    [activeFocusId, layout.edges]
  );

  const selectedLineage = useMemo(
    () =>
      selectedNodeId === activeFocusId
        ? lineage
        : getConceptLineage(selectedNodeId, layout.edges),
    [selectedNodeId, activeFocusId, lineage, layout.edges]
  );

  const selectedConcept = useMemo(() => {
    if (!selectedNodeId) return null;
    return conceptMap.get(selectedNodeId) || null;
  }, [selectedNodeId, conceptMap]);

  const selectedLinks = useMemo(
    () => resolveConceptLinks(selectedConcept, effectiveConcepts),
    [selectedConcept, effectiveConcepts]
  );

  const handleSelectAndFocusNode = (nodeId) => {
    setSelectedNodeId(nodeId);
    const targetNode = layout.nodeById.get(nodeId);
    if (targetNode) {
      zoomToNode(targetNode);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && matchingIds.size > 0) {
      const firstMatch = layout.nodes.find((n) => matchingIds.has(n.id));
      if (firstMatch) {
        handleSelectAndFocusNode(firstMatch.id);
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
    }
  };

  const exploredTotal = useMemo(
    () => layout.nodes.filter((n) => exploredSet.has(n.id)).length,
    [layout.nodes, exploredSet]
  );

  if (isLoading) {
    return <Loading text="Mapping AI Concept Universe..." />;
  }

  return (
    <div className="cu-page fade-in">
      {/* Header & Controls */}
      <header className="cu-header">
        <div className="cu-header__top">
          <div>
            <div className="cu-header__eyebrow">
              <Sparkles size={14} />
              <span>Phase 2 · Spatial Knowledge Constellation</span>
            </div>
            <h1 className="cu-header__title">AI Concept Universe</h1>
            <p className="cu-header__subtitle">
              Zoom into domain constellations, trace prerequisite lineages, and track your
              mastery across {layout.nodes.length} interconnected concepts.
            </p>
          </div>

          <div className="cu-mastery-pill" title="Explored concepts stored in browser">
            <Compass size={16} />
            <span>
              <strong>{exploredTotal}</strong> / {layout.nodes.length} Explored
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="cu-controls">
          <div className="cu-search">
            <Search size={15} className="cu-search__icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Find star (Enter to focus)..."
              className="cu-search__input"
              aria-label="Search Concept Universe"
            />
            {searchQuery && (
              <button
                type="button"
                className="cu-search__clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="cu-control-group" role="group" aria-label="Difficulty filter">
            <span className="cu-control-label">Difficulty</span>
            <div className="cu-segmented">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  type="button"
                  className={`cu-seg-btn ${difficultyFilter === diff ? 'cu-seg-btn--active' : ''}`}
                  onClick={() => setDifficultyFilter(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div className="cu-control-group" role="group" aria-label="Mastery filter">
            <span className="cu-control-label">Mastery</span>
            <div className="cu-segmented">
              {MASTERY_FILTERS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`cu-seg-btn ${masteryFilter === m ? 'cu-seg-btn--active' : ''}`}
                  onClick={() => setMasteryFilter(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="cu-control-group" role="group" aria-label="Connection display mode">
            <span className="cu-control-label">Links</span>
            <div className="cu-segmented">
              {CONNECTION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`cu-seg-btn ${connectionMode === mode.id ? 'cu-seg-btn--active' : ''}`}
                  onClick={() => setConnectionMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Constellation Quick-Zoom Pills */}
        <div className="cu-constellations-bar">
          <button
            type="button"
            className={`cu-cluster-pill ${focusedCategory === 'All' ? 'cu-cluster-pill--active' : ''}`}
            onClick={() => handleCategoryFocus('All')}
          >
            All Constellations ({layout.nodes.length})
          </button>
          {layout.clusters.map((cluster) => {
            const clusterExplored = cluster.nodeIds.filter((id) => exploredSet.has(id)).length;
            const isActive = focusedCategory === cluster.name;
            return (
              <button
                key={cluster.name}
                type="button"
                className={`cu-cluster-pill ${isActive ? 'cu-cluster-pill--active' : ''}`}
                style={{ '--cluster-color': cluster.color }}
                onClick={() => handleCategoryFocus(cluster.name)}
              >
                <span className="cu-cluster-pill__dot" style={{ background: cluster.color }} />
                <span>{cluster.name}</span>
                <span className="cu-cluster-pill__progress">
                  {clusterExplored}/{cluster.nodeIds.length}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Cosmic Viewport + Side Inspector */}
      <div className={`cu-workspace ${selectedConcept ? 'cu-workspace--with-panel' : ''}`}>
        <div className="cu-canvas-wrap">
          <svg
            ref={svgRef}
            className="cu-svg"
            viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            onClick={(e) => {
              if (!e.defaultPrevented) {
                setSelectedNodeId(null);
              }
            }}
          >
            <defs>
              <radialGradient id="cu-space-bg" cx="50%" cy="48%" r="70%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="60%" stopColor="#080d1a" />
                <stop offset="100%" stopColor="#04070f" />
              </radialGradient>

              <pattern id="cu-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path
                  d="M 80 0 L 0 0 0 80"
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.05)"
                  strokeWidth="1"
                />
              </pattern>

              {layout.clusters.map((cluster) => (
                <radialGradient
                  key={cluster.slug}
                  id={`nebula-${cluster.slug}`}
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <stop offset="0%" stopColor={cluster.color} stopOpacity="0.16" />
                  <stop offset="65%" stopColor={cluster.color} stopOpacity="0.06" />
                  <stop offset="100%" stopColor={cluster.color} stopOpacity="0" />
                </radialGradient>
              ))}

              <marker
                id="cu-arrow-base"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M0,-4L9,0L0,4" fill="rgba(56, 189, 248, 0.45)" />
              </marker>
              <marker
                id="cu-arrow-upstream"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,-5L10,0L0,5" fill="#38bdf8" />
              </marker>
              <marker
                id="cu-arrow-downstream"
                viewBox="0 -5 10 10"
                refX="8"
                refY="0"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,-5L10,0L0,5" fill="#34d399" />
              </marker>
            </defs>

            {/* Fixed backdrop */}
            <rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#cu-space-bg)" />
            <rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#cu-grid)" />

            {/* Zoomable Cosmic Universe Layer */}
            <g ref={zoomLayerRef}>
              {/* Starfield */}
              <g className="cu-starfield" pointerEvents="none">
                {BACKGROUND_STARS.map((star) => (
                  <circle
                    key={star.id}
                    cx={star.x}
                    cy={star.y}
                    r={star.r}
                    fill="#e2e8f0"
                    opacity={star.opacity}
                  />
                ))}
              </g>

              {/* Domain Constellations */}
              <g className="cu-clusters">
                {layout.clusters.map((cluster) => {
                  const isFocused = focusedCategory === cluster.name;
                  const clusterExplored = cluster.nodeIds.filter((id) =>
                    exploredSet.has(id)
                  ).length;

                  return (
                    <g
                      key={cluster.name}
                      className={`cu-cluster ${isFocused ? 'cu-cluster--focused' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryFocus(cluster.name);
                      }}
                    >
                      <circle
                        cx={cluster.cx}
                        cy={cluster.cy}
                        r={cluster.radius}
                        fill={`url(#nebula-${cluster.slug})`}
                        stroke={cluster.color}
                        strokeOpacity={isFocused ? 0.65 : 0.28}
                        strokeWidth={isFocused ? 2 : 1.25}
                        strokeDasharray={isFocused ? 'none' : '5 7'}
                      />

                      {/* Cluster Label Header */}
                      <g transform={`translate(${cluster.cx}, ${cluster.cy - cluster.radius - 14})`}>
                        <text className="cu-cluster__name" textAnchor="middle" fill={cluster.color}>
                          {cluster.name.toUpperCase()}
                        </text>
                        <text className="cu-cluster__stats" y="16" textAnchor="middle">
                          {clusterExplored}/{cluster.nodeIds.length} explored
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* Cosmic Filaments (Edges) */}
              <g className="cu-edges" pointerEvents="none">
                {layout.edges.map((edge) => {
                  if (connectionMode === 'prerequisites' && edge.type !== 'prerequisite') {
                    return null;
                  }

                  const isUpstream =
                    Boolean(activeFocusId) &&
                    edge.type === 'prerequisite' &&
                    lineage.ancestorIds.has(edge.sourceId) &&
                    (edge.targetId === activeFocusId || lineage.ancestorIds.has(edge.targetId));

                  const isDownstream =
                    Boolean(activeFocusId) &&
                    edge.type === 'prerequisite' &&
                    (edge.sourceId === activeFocusId || lineage.descendantIds.has(edge.sourceId)) &&
                    lineage.descendantIds.has(edge.targetId);

                  const isDirectRelated =
                    Boolean(activeFocusId) &&
                    edge.type === 'related' &&
                    ((edge.sourceId === activeFocusId && lineage.relatedIds.has(edge.targetId)) ||
                      (edge.targetId === activeFocusId && lineage.relatedIds.has(edge.sourceId)));

                  const isHighlighted = isUpstream || isDownstream || isDirectRelated;

                  if (connectionMode === 'selected' && !activeFocusId && edge.type === 'related') {
                    return null;
                  }

                  let stroke = 'rgba(56, 189, 248, 0.14)';
                  let strokeWidth = 1.2;
                  let opacity = 0.7;
                  let markerEnd = edge.type === 'prerequisite' ? 'url(#cu-arrow-base)' : undefined;

                  if (edge.type === 'related') {
                    stroke = 'rgba(148, 163, 184, 0.2)';
                    strokeWidth = 1.1;
                  }

                  if (activeFocusId) {
                    if (isUpstream) {
                      stroke = '#38bdf8';
                      strokeWidth = 2.4;
                      opacity = 1;
                      markerEnd = 'url(#cu-arrow-upstream)';
                    } else if (isDownstream) {
                      stroke = '#34d399';
                      strokeWidth = 2.4;
                      opacity = 1;
                      markerEnd = 'url(#cu-arrow-downstream)';
                    } else if (isDirectRelated) {
                      stroke = '#a78bfa';
                      strokeWidth = 2;
                      opacity = 0.95;
                    } else {
                      opacity = connectionMode === 'selected' ? 0.08 : 0.14;
                    }
                  } else if (connectionMode === 'selected') {
                    opacity = 0.45;
                  }

                  return (
                    <path
                      key={edge.key}
                      d={edge.d}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      strokeDasharray={edge.type === 'related' ? '5 5' : undefined}
                      strokeOpacity={opacity}
                      markerEnd={markerEnd}
                      className={isHighlighted ? 'cu-edge--active' : ''}
                    />
                  );
                })}
              </g>

              {/* Concept Stars (Nodes) */}
              <g className="cu-nodes">
                {layout.nodes.map((node) => {
                  const isExplored = exploredSet.has(node.id);
                  const isSelected = selectedNodeId === node.id;
                  const isHovered = hoveredNodeId === node.id;
                  const isAncestor = lineage.ancestorIds.has(node.id);
                  const isDescendant = lineage.descendantIds.has(node.id);
                  const isRelated = lineage.relatedIds.has(node.id);
                  const isLineageMember =
                    isSelected || isHovered || isAncestor || isDescendant || isRelated;

                  const matchesCurrentFilters = matchingIds.has(node.id);
                  const categoryDimmed =
                    focusedCategory !== 'All' &&
                    node.category !== focusedCategory &&
                    !isLineageMember;

                  let opacity = 1;
                  if (hasActiveFilter && !matchesCurrentFilters) {
                    opacity = 0.16;
                  } else if (activeFocusId && !isLineageMember) {
                    opacity = 0.25;
                  } else if (categoryDimmed) {
                    opacity = 0.42;
                  }

                  const ringColor = isAncestor
                    ? '#38bdf8'
                    : isDescendant
                    ? '#34d399'
                    : isRelated
                    ? '#a78bfa'
                    : node.color;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className={`cu-star ${isSelected ? 'cu-star--selected' : ''} ${
                        isExplored ? 'cu-star--explored' : ''
                      }`}
                      style={{ opacity }}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                      }}
                    >
                      {/* Explored Mastery Aura */}
                      {isExplored && (
                        <circle
                          r={node.radius + 7}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1.5"
                          strokeOpacity="0.65"
                        />
                      )}

                      {/* Difficulty Orbit Rings for Intermediate / Advanced */}
                      {node.difficulty === 'Intermediate' && (
                        <circle
                          r={node.radius + 4}
                          fill="none"
                          stroke={ringColor}
                          strokeWidth="1"
                          strokeOpacity="0.45"
                        />
                      )}
                      {node.difficulty === 'Advanced' && (
                        <circle
                          r={node.radius + 5}
                          fill="none"
                          stroke={ringColor}
                          strokeWidth="1.3"
                          strokeDasharray="3 3"
                          strokeOpacity="0.7"
                        />
                      )}

                      {/* Active Selection / Lineage Halo */}
                      {(isSelected || isHovered || isLineageMember) && (
                        <circle
                          r={node.radius + 10}
                          fill="none"
                          stroke={ringColor}
                          strokeWidth={isSelected ? 2.5 : 1.6}
                          strokeOpacity={isSelected ? 0.95 : 0.7}
                        />
                      )}

                      {/* Core Star Body */}
                      <circle
                        r={node.radius}
                        fill={isExplored ? '#0f2229' : '#0f172a'}
                        stroke={ringColor}
                        strokeWidth={isSelected ? 2.8 : 2}
                      />

                      {/* Star Icon */}
                      <text
                        className="cu-star__icon"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={node.radius > 18 ? '16px' : '14px'}
                      >
                        {node.icon || '✦'}
                      </text>

                      {/* Explored Checkmark Badge */}
                      {isExplored && (
                        <g transform={`translate(${node.radius * 0.72}, ${-node.radius * 0.72})`}>
                          <circle r="6" fill="#10b981" stroke="#080d1a" strokeWidth="1.5" />
                          <path
                            d="M-2.5 0 L-0.7 1.8 L2.8 -1.8"
                            fill="none"
                            stroke="#04120e"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      )}

                      {/* Star Title */}
                      <text
                        className="cu-star__label"
                        y={node.radius + 16}
                        textAnchor="middle"
                      >
                        {node.title}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>

          {/* Filter Match Pill */}
          {hasActiveFilter && (
            <div className="cu-filter-status">
              <span>
                Showing <strong>{matchingIds.size}</strong> of {layout.nodes.length} concepts
              </span>
              {matchingIds.size > 0 && searchLower && (
                <button
                  type="button"
                  className="cu-filter-status__btn"
                  onClick={() => {
                    const first = layout.nodes.find((n) => matchingIds.has(n.id));
                    if (first) handleSelectAndFocusNode(first.id);
                  }}
                >
                  Focus First
                </button>
              )}
              <button
                type="button"
                className="cu-filter-status__clear"
                onClick={() => {
                  setSearchQuery('');
                  setDifficultyFilter('All');
                  setMasteryFilter('All');
                }}
              >
                Clear
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="cu-legend">
            <span className="cu-legend__item">
              <span className="cu-legend__swatch cu-legend__swatch--upstream" />
              Prerequisite
            </span>
            <span className="cu-legend__item">
              <span className="cu-legend__swatch cu-legend__swatch--downstream" />
              Unlocks
            </span>
            <span className="cu-legend__item">
              <span className="cu-legend__swatch cu-legend__swatch--related" />
              Related
            </span>
            <span className="cu-legend__item">
              <span className="cu-legend__check">✓</span>
              Explored
            </span>
          </div>

          {/* Zoom Controls */}
          <div className="cu-zoom-controls">
            <button
              type="button"
              className="cu-zoom-btn"
              onClick={() => handleZoomBy(1.25)}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              className="cu-zoom-btn"
              onClick={() => handleZoomBy(0.8)}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              className="cu-zoom-btn"
              onClick={handleResetUniverse}
              title="Reset Universe"
              aria-label="Reset Universe"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* Concept Inspector Side Panel */}
        {selectedConcept && (
          <aside className="cu-panel fade-in">
            <div className="cu-panel__header">
              <div className="cu-panel__title-row">
                <span className="cu-panel__icon">{selectedConcept.icon}</span>
                <div>
                  <h2 className="cu-panel__title">{selectedConcept.title}</h2>
                  <div className="cu-panel__badges">
                    <Badge
                      text={selectedConcept.category}
                      color={selectedConcept.color || '#06b6d4'}
                    />
                    <Badge text={selectedConcept.difficulty} color="#3b82f6" />
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="cu-panel__close"
                onClick={() => setSelectedNodeId(null)}
                aria-label="Close concept inspector"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cu-panel__mastery-bar">
              <button
                type="button"
                className={`cu-mastery-toggle ${
                  exploredSet.has(selectedConcept.id) ? 'cu-mastery-toggle--explored' : ''
                }`}
                onClick={() => {
                  const res = toggleConceptExplored(selectedConcept.id);
                  setExploredList(res.exploredIds);
                }}
              >
                {exploredSet.has(selectedConcept.id) ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Explored</span>
                  </>
                ) : (
                  <>
                    <Circle size={16} />
                    <span>Mark as Explored</span>
                  </>
                )}
              </button>
              <span className="cu-lineage-summary">
                {selectedLineage.ancestorIds.size} prereq · {selectedLineage.descendantIds.size} unlocks
              </span>
            </div>

            <div className="cu-panel__body">
              <div className="cu-panel__section">
                <h3 className="cu-panel__section-title">Definition</h3>
                <p className="cu-panel__text">{selectedConcept.definition}</p>
              </div>

              {(selectedConcept.mathematics?.formulas?.length > 0 ||
                selectedConcept.mathematics?.explanation) && (
                <div className="cu-panel__section">
                  <h3 className="cu-panel__section-title">
                    <Calculator size={14} /> Mathematics
                  </h3>
                  {selectedConcept.mathematics?.formulas?.map((f, idx) => (
                    <pre key={idx} className="cu-panel__formula">
                      <code>{f}</code>
                    </pre>
                  ))}
                  {selectedConcept.mathematics?.explanation && (
                    <p className="cu-panel__text cu-panel__text--muted">
                      {selectedConcept.mathematics.explanation}
                    </p>
                  )}
                </div>
              )}

              {selectedConcept.visualization?.type && (
                <div className="cu-panel__section">
                  <h3 className="cu-panel__section-title">
                    <Sparkles size={14} /> Visualization Engine
                  </h3>
                  <div className="cu-panel__viz-badge">
                    <code>{selectedConcept.visualization.type}</code>
                  </div>
                </div>
              )}

              {selectedLinks.prerequisites.length > 0 && (
                <div className="cu-panel__section">
                  <h3 className="cu-panel__section-title">
                    <GitBranch size={14} /> Prerequisites
                  </h3>
                  <div className="cu-panel__chips">
                    {selectedLinks.prerequisites.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="cu-panel__chip cu-panel__chip--prereq"
                        onClick={() => handleSelectAndFocusNode(p.id)}
                      >
                        <span>{p.icon}</span> {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedLinks.nextConcepts.length > 0 && (
                <div className="cu-panel__section">
                  <h3 className="cu-panel__section-title">
                    <ArrowRight size={14} /> Next Unlocks
                  </h3>
                  <div className="cu-panel__chips">
                    {selectedLinks.nextConcepts.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className="cu-panel__chip cu-panel__chip--next"
                        onClick={() => handleSelectAndFocusNode(n.id)}
                      >
                        <span>{n.icon}</span> {n.title}
                        <ArrowRight size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedLinks.relatedConcepts.length > 0 && (
                <div className="cu-panel__section">
                  <h3 className="cu-panel__section-title">
                    <Layers size={14} /> Related Concepts
                  </h3>
                  <div className="cu-panel__chips">
                    {selectedLinks.relatedConcepts.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className="cu-panel__chip"
                        onClick={() => handleSelectAndFocusNode(r.id)}
                      >
                        <span>{r.icon}</span> {r.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="cu-panel__footer">
              <Button
                icon={ExternalLink}
                className="cu-panel__open-btn"
                onClick={() => navigate(`/concept/${selectedConcept.id}`)}
              >
                Open Full Concept Page
              </Button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
