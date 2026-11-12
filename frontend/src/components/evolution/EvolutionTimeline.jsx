import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Dna,
  ExternalLink,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { EVOLUTION_TRACKS, getEvolutionTrackById } from './evolutionData';
import EvolutionSimulators from './EvolutionSimulators';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import './EvolutionTimeline.css';

export default function EvolutionTimeline() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const trackParam = searchParams.get('track') || 'sequence';
  const activeTrack = useMemo(() => getEvolutionTrackById(trackParam), [trackParam]);

  const nodeParam = searchParams.get('node');
  const activeNodeIndex = useMemo(() => {
    const idx = activeTrack.nodes.findIndex((n) => n.id === nodeParam);
    return idx >= 0 ? idx : 0;
  }, [activeTrack, nodeParam]);

  const activeNode = activeTrack.nodes[activeNodeIndex];

  const selectTrack = (trackId) => {
    const nextTrack = getEvolutionTrackById(trackId);
    const next = new URLSearchParams(searchParams);
    next.set('track', nextTrack.id);
    next.set('node', nextTrack.nodes[0].id);
    setSearchParams(next, { replace: true });
  };

  const selectNode = (nodeId) => {
    const next = new URLSearchParams(searchParams);
    next.set('track', activeTrack.id);
    next.set('node', nodeId);
    setSearchParams(next, { replace: true });
  };

  const goStep = (delta) => {
    const nextIndex = Math.max(0, Math.min(activeTrack.nodes.length - 1, activeNodeIndex + delta));
    selectNode(activeTrack.nodes[nextIndex].id);
  };

  return (
    <div className="evo-page fade-in">
      {/* Page Header */}
      <header className="evo-header">
        <div>
          <div className="evo-header__eyebrow">
            <Dna size={14} />
            <span>Phase 8 · Algorithm Evolution</span>
          </div>
          <h1 className="evo-header__title">Why Did This Algorithm Replace the Previous One?</h1>
          <p className="evo-header__subtitle">
            Trace every architectural leap in machine learning as an engineering response to a
            concrete bottleneck—backed by interactive mathematical proof simulators.
          </p>
        </div>
      </header>

      {/* Track Switcher Tabs */}
      <nav className="evo-tracks" role="tablist" aria-label="Evolution tracks">
        {EVOLUTION_TRACKS.map((track) => {
          const isActive = track.id === activeTrack.id;
          return (
            <button
              key={track.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`evo-track-tab ${isActive ? 'evo-track-tab--active' : ''}`}
              style={{ '--track-accent': track.accentColor }}
              onClick={() => selectTrack(track.id)}
            >
              <span className="evo-track-tab__dot" style={{ background: track.accentColor }} />
              <span className="evo-track-tab__title">{track.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Interactive Node-and-Arrow Timeline Chain */}
      <section className="evo-chain-wrap">
        <div className="evo-chain-meta">
          <span className="evo-chain-meta__sub">{activeTrack.subtitle}</span>
          <div className="evo-chain-nav">
            <button
              type="button"
              className="evo-chip-btn"
              disabled={activeNodeIndex <= 0}
              onClick={() => goStep(-1)}
            >
              <ArrowLeft size={14} /> Previous
            </button>
            <button
              type="button"
              className="evo-chip-btn"
              disabled={activeNodeIndex >= activeTrack.nodes.length - 1}
              onClick={() => goStep(1)}
            >
              Next Breakthrough <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="evo-chain">
          {activeTrack.nodes.map((node, idx) => {
            const isActive = idx === activeNodeIndex;
            return (
              <div key={node.id} className="evo-chain__segment">
                <button
                  type="button"
                  className={`evo-node-btn ${isActive ? 'evo-node-btn--active' : ''}`}
                  style={{ '--track-accent': activeTrack.accentColor }}
                  onClick={() => selectNode(node.id)}
                >
                  <span className="evo-node-btn__era">{node.era}</span>
                  <span className="evo-node-btn__name">{node.name}</span>
                </button>
                {idx < activeTrack.nodes.length - 1 && (
                  <ChevronRight size={18} className="evo-chain__arrow" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Evolutionary Transition Detail Card */}
      <Card hoverable={false} className="evo-story-card">
        <div className="evo-story-card__top">
          <div>
            <div className="evo-story-card__badges">
              <Badge text={activeTrack.title} color={activeTrack.accentColor} size="md" />
              <Badge text={activeNode.era} color="#3b82f6" size="md" />
            </div>
            <h2 className="evo-story-card__title">
              {activeNode.previousAlgorithm} <span className="evo-arrow-inline">→</span>{' '}
              {activeNode.newAlgorithm}
            </h2>
          </div>

          {activeNode.conceptId && (
            <Button
              variant="secondary"
              icon={ExternalLink}
              onClick={() => navigate(`/concept/${activeNode.conceptId}`)}
            >
              Open Concept Page
            </Button>
          )}
        </div>

        {/* 4-Step Causal Transition Grid */}
        <div className="evo-causal-grid">
          <div className="evo-causal-box evo-causal-box--fail">
            <div className="evo-causal-box__head">
              <AlertTriangle size={16} />
              <span>1. Why {activeNode.previousAlgorithm} Failed</span>
            </div>
            <p>{activeNode.limitation}</p>
          </div>

          <div className="evo-causal-box evo-causal-box--idea">
            <div className="evo-causal-box__head">
              <Lightbulb size={16} />
              <span>2. The Breakthrough Idea</span>
            </div>
            <p>{activeNode.breakthroughIdea}</p>
          </div>

          <div className="evo-causal-box evo-causal-box--new">
            <div className="evo-causal-box__head">
              <Sparkles size={16} />
              <span>3. New Architecture: {activeNode.newAlgorithm}</span>
            </div>
            <div className="evo-compare-list">
              {activeNode.metrics.map((m) => (
                <div key={m.label} className="evo-compare-row">
                  <span className="evo-compare-row__label">{m.label}</span>
                  <div className="evo-compare-row__vals">
                    <span className="evo-before">{m.before}</span>
                    <ArrowRight size={12} />
                    <span className="evo-after">{m.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="evo-causal-box evo-causal-box--limit">
            <div className="evo-causal-box__head">
              <AlertTriangle size={16} />
              <span>4. Remaining Limitation</span>
            </div>
            <p>{activeNode.newLimitation}</p>
          </div>
        </div>
      </Card>

      {/* Interactive Proof Simulator for the Active Track */}
      <Card hoverable={false} className="evo-sim-card">
        <EvolutionSimulators trackId={activeTrack.id} />
      </Card>
    </div>
  );
}
