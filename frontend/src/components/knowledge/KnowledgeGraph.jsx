import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as d3 from 'd3';
import {
  ArrowRight,
  Calculator,
  ExternalLink,
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
  MOCK_CONCEPTS,
  buildGraphFromConcepts,
  resolveConceptLinks,
} from '../../concept-engine/ConceptEngine';
import { categoryColors } from '../../theme/colors';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Loading from '../common/Loading';
import './KnowledgeGraph.css';

const NODE_RADIUS = 22;

export default function KnowledgeGraph() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { concepts, loading: conceptsLoading } = useConcepts();
  const { graph: apiGraph, loading: graphLoading } = useGraph();

  const selectedCategory = searchParams.get('category') || 'All';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const zoomBehaviorRef = useRef(null);

  const effectiveConcepts = useMemo(
    () => (concepts.length > 0 ? concepts : MOCK_CONCEPTS),
    [concepts]
  );

  const conceptMap = useMemo(
    () => new Map(effectiveConcepts.map((c) => [c.id, c])),
    [effectiveConcepts]
  );

  const rawGraph = useMemo(() => {
    if (apiGraph?.nodes?.length > 0) {
      return apiGraph;
    }
    return buildGraphFromConcepts(effectiveConcepts);
  }, [apiGraph, effectiveConcepts]);

  const categories = useMemo(() => {
    const counts = new Map();
    for (const node of rawGraph.nodes) {
      counts.set(node.category, (counts.get(node.category) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({
        name,
        count,
        color: categoryColors[name] || '#06b6d4',
      }));
  }, [rawGraph.nodes]);

  const filteredGraph = useMemo(() => {
    const activeNodes =
      selectedCategory === 'All'
        ? rawGraph.nodes
        : rawGraph.nodes.filter((n) => n.category === selectedCategory);

    const visibleIds = new Set(activeNodes.map((n) => n.id));
    const activeEdges = rawGraph.edges.filter((e) => {
      const s = typeof e.source === 'object' ? e.source.id : e.source;
      const t = typeof e.target === 'object' ? e.target.id : e.target;
      return visibleIds.has(s) && visibleIds.has(t);
    });

    return {
      nodes: activeNodes.map((n) => ({ ...n })),
      edges: activeEdges.map((e) => ({
        ...e,
        source: typeof e.source === 'object' ? e.source.id : e.source,
        target: typeof e.target === 'object' ? e.target.id : e.target,
      })),
    };
  }, [rawGraph, selectedCategory]);

  const searchLower = searchQuery.trim().toLowerCase();
  const matchedIds = useMemo(() => {
    if (!searchLower) return null;
    return new Set(
      filteredGraph.nodes
        .filter(
          (n) =>
            n.title?.toLowerCase().includes(searchLower) ||
            n.category?.toLowerCase().includes(searchLower) ||
            n.id?.toLowerCase().includes(searchLower)
        )
        .map((n) => n.id)
    );
  }, [filteredGraph.nodes, searchLower]);

  const selectedConcept = useMemo(() => {
    if (!selectedNodeId) return null;
    return conceptMap.get(selectedNodeId) || null;
  }, [selectedNodeId, conceptMap]);

  const selectedLinks = useMemo(
    () => resolveConceptLinks(selectedConcept, effectiveConcepts),
    [selectedConcept, effectiveConcepts]
  );

  const handleCategoryChange = (cat) => {
    const next = new URLSearchParams(searchParams);
    if (cat === 'All') {
      next.delete('category');
    } else {
      next.set('category', cat);
    }
    setSearchParams(next, { replace: true });
  };

  // Build / rebuild D3 force simulation when graph topology changes
  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl) return;

    const width = containerEl.clientWidth || 860;
    const height = containerEl.clientHeight || 600;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Defs: arrowhead markers & glow filter
    const defs = svg.append('defs');

    defs
      .append('marker')
      .attr('id', 'arrow-prereq')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', NODE_RADIUS + 10)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#38bdf8');

    defs
      .append('marker')
      .attr('id', 'arrow-prereq-dim')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', NODE_RADIUS + 10)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'rgba(56, 189, 248, 0.25)');

    const zoomLayer = svg.append('g').attr('class', 'kg-zoom-layer');

    const zoom = d3
      .zoom()
      .scaleExtent([0.3, 3.2])
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    const nodes = filteredGraph.nodes.map((d) => ({ ...d }));
    const edges = filteredGraph.edges.map((d) => ({ ...d }));

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(edges)
          .id((d) => d.id)
          .distance((d) => (d.type === 'prerequisite' ? 115 : 135))
          .strength(0.65)
      )
      .force('charge', d3.forceManyBody().strength(-340))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.06))
      .force('y', d3.forceY(height / 2).strength(0.06))
      .force('collision', d3.forceCollide().radius(NODE_RADIUS + 20));

    const linkSelection = zoomLayer
      .append('g')
      .attr('class', 'kg-links')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('class', (d) => `kg-link kg-link--${d.type}`)
      .attr('stroke', (d) =>
        d.type === 'prerequisite' ? 'rgba(56, 189, 248, 0.55)' : 'rgba(148, 163, 184, 0.32)'
      )
      .attr('stroke-width', (d) => (d.type === 'prerequisite' ? 1.8 : 1.25))
      .attr('stroke-dasharray', (d) => (d.type === 'related' ? '5 4' : null))
      .attr('marker-end', (d) =>
        d.type === 'prerequisite' ? 'url(#arrow-prereq)' : null
      );

    let dragMoved = false;

    const drag = d3
      .drag()
      .on('start', (event, d) => {
        dragMoved = false;
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        dragMoved = true;
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const nodeSelection = zoomLayer
      .append('g')
      .attr('class', 'kg-nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'kg-node')
      .style('cursor', 'pointer')
      .call(drag)
      .on('click', (event, d) => {
        event.stopPropagation();
        if (!dragMoved) {
          setSelectedNodeId(d.id);
        }
      });

    // Outer subtle halo ring
    nodeSelection
      .append('circle')
      .attr('class', 'kg-node__halo')
      .attr('r', NODE_RADIUS + 5)
      .attr('fill', 'none')
      .attr('stroke', (d) => d.color || '#06b6d4')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0);

    // Main circle
    nodeSelection
      .append('circle')
      .attr('class', 'kg-node__circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', '#111827')
      .attr('stroke', (d) => d.color || '#06b6d4')
      .attr('stroke-width', 2.2);

    // Emoji / icon inside circle
    nodeSelection
      .append('text')
      .attr('class', 'kg-node__icon')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '16px')
      .text((d) => d.icon || '◆');

    // Label below node
    nodeSelection
      .append('text')
      .attr('class', 'kg-node__label')
      .attr('y', NODE_RADIUS + 15)
      .attr('text-anchor', 'middle')
      .text((d) => d.title);

    svg.on('click', () => {
      setSelectedNodeId(null);
    });

    simulation.on('tick', () => {
      linkSelection
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      nodeSelection.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredGraph]);

  // Update visual highlight / dimming without restarting physics simulation
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);

    const neighborIds = new Set();
    if (selectedNodeId) {
      neighborIds.add(selectedNodeId);
      for (const e of filteredGraph.edges) {
        const s = typeof e.source === 'object' ? e.source.id : e.source;
        const t = typeof e.target === 'object' ? e.target.id : e.target;
        if (s === selectedNodeId) neighborIds.add(t);
        if (t === selectedNodeId) neighborIds.add(s);
      }
    }

    svg
      .selectAll('.kg-node')
      .transition()
      .duration(150)
      .style('opacity', (d) => {
        if (matchedIds && !matchedIds.has(d.id)) return 0.18;
        if (selectedNodeId && !neighborIds.has(d.id)) return 0.28;
        return 1;
      });

    svg
      .selectAll('.kg-node__halo')
      .attr('stroke-opacity', (d) => {
        if (d.id === selectedNodeId) return 0.9;
        if (matchedIds && matchedIds.has(d.id)) return 0.7;
        return 0;
      })
      .attr('stroke-width', (d) => (d.id === selectedNodeId ? 2.5 : 1.5));

    svg
      .selectAll('.kg-link')
      .transition()
      .duration(150)
      .style('opacity', (d) => {
        const s = typeof d.source === 'object' ? d.source.id : d.source;
        const t = typeof d.target === 'object' ? d.target.id : d.target;
        if (matchedIds && !matchedIds.has(s) && !matchedIds.has(t)) return 0.12;
        if (selectedNodeId && s !== selectedNodeId && t !== selectedNodeId) return 0.14;
        return 1;
      });
  }, [selectedNodeId, matchedIds, filteredGraph.edges]);

  const handleZoom = (factor) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(220)
      .call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  if (conceptsLoading && graphLoading) {
    return <Loading text="Building Knowledge Graph..." />;
  }

  return (
    <div className="kg-page fade-in">
      {/* Header + Controls */}
      <div className="kg-toolbar">
        <div className="kg-toolbar__top">
          <div>
            <h1 className="kg-toolbar__title">AI Knowledge Graph</h1>
            <p className="kg-toolbar__subtitle">
              Drag nodes, scroll to zoom, and click any concept to inspect prerequisites and math.
            </p>
          </div>

          <div className="kg-search">
            <Search size={15} className="kg-search__icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Highlight nodes..."
              className="kg-search__input"
              aria-label="Highlight graph nodes"
            />
            {searchQuery && (
              <button
                type="button"
                className="kg-search__clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear filter"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="kg-filters">
          <button
            type="button"
            className={`kg-pill ${selectedCategory === 'All' ? 'kg-pill--active' : ''}`}
            onClick={() => handleCategoryChange('All')}
          >
            All ({rawGraph.nodes.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              className={`kg-pill ${selectedCategory === cat.name ? 'kg-pill--active' : ''}`}
              style={{ '--pill-color': cat.color }}
              onClick={() => handleCategoryChange(cat.name)}
            >
              <span className="kg-pill__dot" style={{ background: cat.color }} />
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Main Graph + Side Panel Area */}
      <div className={`kg-workspace ${selectedConcept ? 'kg-workspace--with-panel' : ''}`}>
        <div className="kg-canvas-wrap" ref={containerRef}>
          <svg ref={svgRef} className="kg-svg" />

          {/* Legend */}
          <div className="kg-legend">
            <div className="kg-legend__item">
              <span className="kg-legend__line kg-legend__line--prereq" />
              <span>Prerequisite</span>
            </div>
            <div className="kg-legend__item">
              <span className="kg-legend__line kg-legend__line--related" />
              <span>Related</span>
            </div>
            {matchedIds && (
              <div className="kg-legend__item kg-legend__matches">
                {matchedIds.size} match{matchedIds.size === 1 ? '' : 'es'}
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="kg-zoom-controls">
            <button
              type="button"
              className="kg-zoom-btn"
              onClick={() => handleZoom(1.25)}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              className="kg-zoom-btn"
              onClick={() => handleZoom(0.8)}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              className="kg-zoom-btn"
              onClick={handleResetZoom}
              title="Reset view"
              aria-label="Reset view"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* Selected Node Side Panel */}
        {selectedConcept && (
          <aside className="kg-panel fade-in">
            <div className="kg-panel__header">
              <div className="kg-panel__title-row">
                <span className="kg-panel__icon">{selectedConcept.icon}</span>
                <div>
                  <h2 className="kg-panel__title">{selectedConcept.title}</h2>
                  <div className="kg-panel__badges">
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
                className="kg-panel__close"
                onClick={() => setSelectedNodeId(null)}
                aria-label="Close detail panel"
              >
                <X size={18} />
              </button>
            </div>

            <div className="kg-panel__body">
              <div className="kg-panel__section">
                <h3 className="kg-panel__section-title">Definition</h3>
                <p className="kg-panel__text">{selectedConcept.definition}</p>
              </div>

              {(selectedConcept.mathematics?.formulas?.length > 0 ||
                selectedConcept.mathematics?.explanation) && (
                <div className="kg-panel__section">
                  <h3 className="kg-panel__section-title">
                    <Calculator size={14} /> Mathematics
                  </h3>
                  {selectedConcept.mathematics?.formulas?.map((f, idx) => (
                    <pre key={idx} className="kg-panel__formula">
                      <code>{f}</code>
                    </pre>
                  ))}
                  {selectedConcept.mathematics?.explanation && (
                    <p className="kg-panel__text kg-panel__text--muted">
                      {selectedConcept.mathematics.explanation}
                    </p>
                  )}
                </div>
              )}

              {selectedConcept.visualization?.type && (
                <div className="kg-panel__section">
                  <h3 className="kg-panel__section-title">
                    <Sparkles size={14} /> Visualization Spec
                  </h3>
                  <div className="kg-panel__viz-badge">
                    <code>{selectedConcept.visualization.type}</code>
                  </div>
                </div>
              )}

              {selectedLinks.prerequisites.length > 0 && (
                <div className="kg-panel__section">
                  <h3 className="kg-panel__section-title">Prerequisites</h3>
                  <div className="kg-panel__chips">
                    {selectedLinks.prerequisites.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="kg-panel__chip"
                        onClick={() => setSelectedNodeId(p.id)}
                      >
                        <span>{p.icon}</span> {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedLinks.relatedConcepts.length > 0 && (
                <div className="kg-panel__section">
                  <h3 className="kg-panel__section-title">Related Concepts</h3>
                  <div className="kg-panel__chips">
                    {selectedLinks.relatedConcepts.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className="kg-panel__chip"
                        onClick={() => setSelectedNodeId(r.id)}
                      >
                        <span>{r.icon}</span> {r.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedLinks.nextConcepts.length > 0 && (
                <div className="kg-panel__section">
                  <h3 className="kg-panel__section-title">Next Concepts</h3>
                  <div className="kg-panel__chips">
                    {selectedLinks.nextConcepts.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className="kg-panel__chip"
                        onClick={() => setSelectedNodeId(n.id)}
                      >
                        <span>{n.icon}</span> {n.title} <ArrowRight size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="kg-panel__footer">
              <Button
                icon={ExternalLink}
                className="kg-panel__open-btn"
                onClick={() => navigate(`/concept/${selectedConcept.id}`)}
              >
                Open Concept Page
              </Button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
