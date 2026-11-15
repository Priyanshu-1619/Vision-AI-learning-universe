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
import SpaceshipCursor from './SpaceshipCursor';
import './ConceptUniverse.css';

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1600;

const CLUSTER_ANCHORS = {
  Foundations: { x: 380, y: 350 },
  Mathematics: { x: 1200, y: 320 },
  'Data Science': { x: 2020, y: 360 },
  'Core ML': { x: 580, y: 820 },
  Algorithms: { x: 1820, y: 840 },
  Optimization: { x: 380, y: 1280 },
  'Deep Learning': { x: 1200, y: 1260 },
  Evaluation: { x: 2020, y: 1280 },
};

const DIFFICULTY_RADIUS = {
  Beginner: 15,
  Intermediate: 18,
  Advanced: 21,
};

const DOMAIN_OPTIONS = [
  { id: 'All', label: 'All Domains' },
  { id: 'data-science', label: 'Data Science' },
  { id: 'machine-learning', label: 'Machine Learning' },
  { id: 'deep-learning', label: 'Deep Learning' },
  { id: 'mathematics', label: 'Mathematics' },
];

const LEVEL_OPTIONS = [
  { id: 'All', label: 'All Levels' },
  { id: 'basic', label: 'Basic' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const MASTERY_FILTERS = ['All', 'Explored', 'Unexplored'];
const CONNECTION_MODES = [
  { id: 'selected', label: 'Selected Paths' },
  { id: 'prerequisites', label: 'Prerequisites Only' },
  { id: 'all', label: 'All Connections' },
];

// Deterministic background starfield across 2400x1600 cosmic cosmos
const BACKGROUND_STARS = Array.from({ length: 240 }, (_, i) => {
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
  const [domainFilter, setDomainFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [masteryFilter, setMasteryFilter] = useState('All');
  const [connectionMode, setConnectionMode] = useState('selected');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [exploredList, setExploredList] = useState(() => getExploredIds());

  const canvasWrapRef = useRef(null);
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
        x: WORLD_WIDTH / 2 + Math.cos(angle) * 520,
        y: WORLD_HEIGHT / 2 + Math.sin(angle) * 360,
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
        const dist = 28 + Math.sqrt(idx) * 36;
        const radius = DIFFICULTY_RADIUS[node.difficulty] || 17;
        const fullConcept = conceptMap.get(node.id);
        simNodes.push({
          ...node,
          color: node.color || categoryColors[node.category] || '#06b6d4',
          domain: fullConcept?.domain || 'machine-learning',
          level: fullConcept?.level || 'intermediate',
          definition: fullConcept?.definition || '',
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
      .force('x', d3.forceX((d) => d.anchorX).strength(0.38))
      .force('y', d3.forceY((d) => d.anchorY).strength(0.38))
      .force('charge', d3.forceManyBody().strength(-75))
      .force('collide', d3.forceCollide((d) => d.radius + 24).strength(0.95).iterations(3))
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
        radius: Math.max(120, maxReach + 48),
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
  }, [rawGraph, conceptMap]);

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
      .scaleExtent([0.35, 3.8])
      .extent([
        [0, 0],
        [WORLD_WIDTH, WORLD_HEIGHT],
      ])
      .translateExtent([
        [-350, -250],
        [WORLD_WIDTH + 350, WORLD_HEIGHT + 250],
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
      const pad = cluster.radius * 2.4;
      const scale = Math.min(2.8, Math.max(0.65, Math.min(WORLD_WIDTH / pad, WORLD_HEIGHT / pad)));
      const tx = WORLD_WIDTH / 2 - scale * cluster.cx;
      const ty = WORLD_HEIGHT / 2 - scale * cluster.cy;
      applyZoomTransform(d3.zoomIdentity.translate(tx, ty).scale(scale), 550);
    },
    [applyZoomTransform]
  );

  const zoomToNode = useCallback(
    (node) => {
      if (!node) return;
      const scale = 2.1;
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

  // Search + domain + level + difficulty + mastery filtering
  const searchLower = searchQuery.trim().toLowerCase();
  const hasActiveFilter =
    Boolean(searchLower) ||
    domainFilter !== 'All' ||
    levelFilter !== 'All' ||
    difficultyFilter !== 'All' ||
    masteryFilter !== 'All';

  const matchingIds = useMemo(() => {
    const ids = new Set();
    for (const node of layout.nodes) {
      const matchesSearch =
        !searchLower ||
        node.title?.toLowerCase().includes(searchLower) ||
        node.category?.toLowerCase().includes(searchLower) ||
        node.id?.toLowerCase().includes(searchLower) ||
        node.domain?.toLowerCase().includes(searchLower) ||
        node.definition?.toLowerCase().includes(searchLower);

      const matchesDomain =
        domainFilter === 'All' || node.domain === domainFilter;
      const matchesLevel =
        levelFilter === 'All' || node.level === levelFilter;
      const matchesDiff =
        difficultyFilter === 'All' || node.difficulty === difficultyFilter;
      const isExplored = exploredSet.has(node.id);
      const matchesMastery =
        masteryFilter === 'All' ||
        (masteryFilter === 'Explored' && isExplored) ||
        (masteryFilter === 'Unexplored' && !isExplored);

      if (matchesSearch && matchesDomain && matchesLevel && matchesDiff && matchesMastery) {
        ids.add(node.id);
      }
    }
    return ids;
  }, [layout.nodes, searchLower, domainFilter, levelFilter, difficultyFilter, masteryFilter, exploredSet]);

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
              <span>Phase 2 · Cosmic Spatial Knowledge Constellation</span>
            </div>
            <h1 className="cu-header__title">AI Concept Universe</h1>
            <p className="cu-header__subtitle">
              Navigate {layout.nodes.length} interconnected nodes across Data Science,
              Machine Learning, Deep Learning, and Mathematics. Trace prerequisite lineages,
              filter by domain and level, and inspect granular formulas.
            </p>
          </div>

          <div className="cu-mastery-pill" title="Explored concepts stored in browser">
            <Compass size={16} />
            <span>
              <strong>{exploredTotal}</strong> / {layout.nodes.length} Explored
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="cu-controls">
          <div className="cu-search">
            <Search size={15} className="cu-search__icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Find node across cosmos (Enter to focus)..."
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

          {/* Domain Filter */}
          <div className="cu-control-group" role="group" aria-label="Domain filter">
            <span className="cu-control-label">Domain</span>
            <div className="cu-segmented">
              {DOMAIN_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`cu-seg-btn ${domainFilter === opt.id ? 'cu-seg-btn--active' : ''}`}
                  onClick={() => setDomainFilter(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Level Filter */}
          <div className="cu-control-group" role="group" aria-label="Level filter">
            <span className="cu-control-label">Level</span>
            <div className="cu-segmented">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`cu-seg-btn ${levelFilter === opt.id ? 'cu-seg-btn--active' : ''}`}
                  onClick={() => setLevelFilter(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
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

          {/* Mastery Filter */}
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

          {/* Links Display Mode */}
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
        <div className="cu-canvas-wrap" ref={canvasWrapRef}>
          {/* Spaceship Exploration Probe Cursor */}
          <SpaceshipCursor containerRef={canvasWrapRef} />

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

              <pattern id="cu-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path
                  d="M 100 0 L 0 0 0 100"
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
                <path d="M0,-5L10,0L0,5" fill="#facc15" />
              </marker>
            </defs>

            {/* Cosmos Deep Space Base */}
            <rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#cu-space-bg)" />
            <rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#cu-grid)" opacity="0.6" />

            {/* Dynamic Zoom/Pan Transformation Layer */}
            <g ref={zoomLayerRef} className="cu-zoom-layer">
              {/* Starfield */}
              <g className="cu-starfield" opacity="0.85">
                {BACKGROUND_STARS.map((s) => (
                  <circle
                    key={s.id}
                    cx={s.x}
                    cy={s.y}
                    r={s.r}
                    fill="#e2e8f0"
                    opacity={s.opacity}
                  />
                ))}
              </g>

              {/* Cluster Nebula Clouds */}
              <g className="cu-nebulae">
                {layout.clusters.map((cluster) => {
                  const isFocused = focusedCategory === 'All' || focusedCategory === cluster.name;
                  return (
                    <g key={cluster.slug} className="cu-nebula-group">
                      <circle
                        cx={cluster.cx}
                        cy={cluster.cy}
                        r={cluster.radius}
                        fill={`url(#nebula-${cluster.slug})`}
                        opacity={isFocused ? 1 : 0.28}
                        className="cu-nebula-glow"
                      />
                      <circle
                        cx={cluster.cx}
                        cy={cluster.cy}
                        r={cluster.radius}
                        fill="none"
                        stroke={cluster.color}
                        strokeWidth="1"
                        strokeDasharray="4 6"
                        opacity={isFocused ? 0.35 : 0.12}
                      />
                      <text
                        x={cluster.cx}
                        y={cluster.cy - cluster.radius + 18}
                        textAnchor="middle"
                        className="cu-cluster-label"
                        fill={cluster.color}
                        opacity={isFocused ? 0.85 : 0.35}
                      >
                        {cluster.name.toUpperCase()}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Inter-Concept Gravitational Edges */}
              <g className="cu-edges">
                {layout.edges.map((edge) => {
                  const isUpstream =
                    edge.targetId === activeFocusId && lineage.ancestorIds.has(edge.sourceId);
                  const isDownstream =
                    edge.sourceId === activeFocusId && lineage.descendantIds.has(edge.targetId);
                  const isRelatedEdge =
                    (edge.sourceId === activeFocusId && lineage.relatedIds.has(edge.targetId)) ||
                    (edge.targetId === activeFocusId && lineage.relatedIds.has(edge.sourceId));

                  const isLineageEdge = isUpstream || isDownstream || isRelatedEdge;

                  let shouldRender = false;
                  if (connectionMode === 'all') {
                    shouldRender = true;
                  } else if (connectionMode === 'prerequisites') {
                    shouldRender = edge.type === 'prerequisite';
                  } else {
                    // connectionMode === 'selected'
                    shouldRender = isLineageEdge;
                  }

                  if (!shouldRender && !isLineageEdge) return null;

                  let stroke = 'rgba(148, 163, 184, 0.14)';
                  let strokeWidth = 1;
                  let strokeDasharray = edge.type === 'related' ? '3 3' : 'none';
                  let markerEnd = 'url(#cu-arrow-base)';
                  let opacity = 0.55;

                  if (isUpstream) {
                    stroke = '#38bdf8';
                    strokeWidth = 2.4;
                    markerEnd = 'url(#cu-arrow-upstream)';
                    opacity = 1;
                  } else if (isDownstream) {
                    stroke = '#facc15';
                    strokeWidth = 2.4;
                    markerEnd = 'url(#cu-arrow-downstream)';
                    opacity = 1;
                  } else if (isRelatedEdge) {
                    stroke = '#a855f7';
                    strokeWidth = 1.8;
                    strokeDasharray = '4 3';
                    opacity = 0.85;
                  } else if (activeFocusId) {
                    opacity = 0.08;
                  }

                  return (
                    <path
                      key={edge.key}
                      d={edge.d}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      markerEnd={markerEnd}
                      opacity={opacity}
                      className="cu-edge"
                    />
                  );
                })}
              </g>

              {/* Concept Star Nodes */}
              <g className="cu-nodes">
                {layout.nodes.map((node) => {
                  const isSelected = node.id === selectedNodeId;
                  const isHovered = node.id === hoveredNodeId;
                  const isFocused = isSelected || isHovered;
                  const isExplored = exploredSet.has(node.id);

                  const isUpstream = lineage.ancestorIds.has(node.id);
                  const isDownstream = lineage.descendantIds.has(node.id);
                  const isRelated = lineage.relatedIds.has(node.id);
                  const isInLineage = isUpstream || isDownstream || isRelated;

                  const isMatched = matchingIds.has(node.id);

                  let opacity = 1;
                  if (hasActiveFilter && !isMatched) {
                    opacity = 0.15;
                  } else if (activeFocusId && !isFocused && !isInLineage) {
                    opacity = 0.28;
                  }

                  let ringColor = 'transparent';
                  let ringWidth = 0;
                  if (isFocused) {
                    ringColor = '#ffffff';
                    ringWidth = 3;
                  } else if (isUpstream) {
                    ringColor = '#38bdf8';
                    ringWidth = 2.2;
                  } else if (isDownstream) {
                    ringColor = '#facc15';
                    ringWidth = 2.2;
                  } else if (isRelated) {
                    ringColor = '#a855f7';
                    ringWidth = 1.6;
                  }

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x.toFixed(1)}, ${node.y.toFixed(1)})`}
                      opacity={opacity}
                      className={`cu-node ${isFocused ? 'cu-node--focused' : ''} ${
                        isExplored ? 'cu-node--explored' : ''
                      }`}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAndFocusNode(node.id);
                      }}
                    >
                      {/* Aura glow when focused or matched */}
                      {(isFocused || (hasActiveFilter && isMatched)) && (
                        <circle
                          r={node.radius + 14}
                          fill={node.color}
                          opacity="0.25"
                          className="cu-node__glow"
                        />
                      )}

                      {/* Lineage / Selection indicator ring */}
                      {ringWidth > 0 && (
                        <circle
                          r={node.radius + 5}
                          fill="none"
                          stroke={ringColor}
                          strokeWidth={ringWidth}
                          strokeDasharray={isRelated ? '3 3' : 'none'}
                          className="cu-node__ring"
                        />
                      )}

                      {/* Main node orb */}
                      <circle
                        r={node.radius}
                        fill="#0b1633"
                        stroke={node.color}
                        strokeWidth={isExplored ? 2.5 : 1.5}
                        className="cu-node__core"
                      />

                      {/* Explored orbital bead */}
                      {isExplored && (
                        <circle
                          cx={node.radius - 3}
                          cy={-node.radius + 3}
                          r={4.2}
                          fill="#10b981"
                          stroke="#0b1633"
                          strokeWidth="1.2"
                        />
                      )}

                      {/* Center Emoji Icon */}
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={node.radius * 0.95}
                        className="cu-node__icon"
                        pointerEvents="none"
                      >
                        {node.icon || '✦'}
                      </text>

                      {/* Star Title Label */}
                      <text
                        y={node.radius + 15}
                        textAnchor="middle"
                        className="cu-node__label"
                        fill="#f8fafc"
                        pointerEvents="none"
                      >
                        {node.title}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>

          {/* Canvas Floating Navigation Controls */}
          <div className="cu-canvas-controls" role="toolbar" aria-label="Constellation Zoom Controls">
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
                    {selectedConcept.domain && (
                      <Badge
                        text={
                          selectedConcept.domain === 'data-science'
                            ? 'Data Science'
                            : selectedConcept.domain === 'deep-learning'
                            ? 'Deep Learning'
                            : selectedConcept.domain === 'mathematics'
                            ? 'Mathematics'
                            : 'Machine Learning'
                        }
                        color="#10b981"
                      />
                    )}
                    {selectedConcept.level && (
                      <Badge
                        text={selectedConcept.level.toUpperCase()}
                        color="#f59e0b"
                      />
                    )}
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
                <h3 className="cu-panel__section-title">Definition & Overview</h3>
                <p className="cu-panel__text">{selectedConcept.definition}</p>
                {selectedConcept.beginnerExplanation && (
                  <p className="cu-panel__text cu-panel__text--muted" style={{ marginTop: '8px' }}>
                    {selectedConcept.beginnerExplanation}
                  </p>
                )}
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
                onClick={() => {
                  if (selectedConcept.lessonRoute) {
                    navigate(selectedConcept.lessonRoute);
                  } else {
                    navigate(`/concept/${selectedConcept.id}`);
                  }
                }}
              >
                Open Full Concept Lesson
              </Button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
