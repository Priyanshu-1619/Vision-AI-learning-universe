import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import { fetchConcepts } from '../../api/client';
import { useConcepts } from '../../hooks/useConcepts';
import { getExploredIds, EXPLORED_UPDATED_EVENT } from '../../concept-engine/ConceptEngine';
import VisualizationEngine from '../visualization/VisualizationEngine';
import { getVisualizationsForDomain } from '../visualization/visualizationRegistry';
import ConceptCard from '../common/ConceptCard';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Loading from '../common/Loading';
import './DomainLanding.css';

const LEVELS = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Fundamental concepts, definitions, and visual explanations',
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Algorithm details, mathematical foundations, and hands-on experiments',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Deep technical understanding, optimization, and real-world applications',
  },
];

export default function DomainLanding({
  domainId,
  domainTitle,
  domainDescription,
  accentColor = '#06b6d4',
  glowColor = 'rgba(6, 182, 212, 0.15)',
  icon: DomainIcon,
  toolLinks = [],
}) {
  const navigate = useNavigate();
  const { concepts: allConcepts } = useConcepts();
  const [selectedLevel, setSelectedLevel] = useState('basic');
  const [levelConcepts, setLevelConcepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progressTick, setProgressTick] = useState(0);

  // Filter domain concepts from full set for counts
  const domainConcepts = useMemo(() => {
    return allConcepts.filter((c) => {
      if (c.domain) return c.domain === domainId;
      if (domainId === 'data-science') {
        return ['Foundations', 'Mathematics', 'Data Science'].includes(c.category);
      }
      if (domainId === 'deep-learning') {
        return c.category === 'Deep Learning';
      }
      return !['Foundations', 'Mathematics', 'Data Science', 'Deep Learning'].includes(c.category);
    });
  }, [allConcepts, domainId]);

  // Concept counts per level
  const countsByLevel = useMemo(() => {
    const counts = { basic: 0, intermediate: 0, advanced: 0 };
    for (const c of domainConcepts) {
      const lvl = c.level || (c.difficulty === 'Beginner' ? 'basic' : c.difficulty === 'Advanced' ? 'advanced' : 'intermediate');
      if (counts[lvl] !== undefined) counts[lvl]++;
    }
    return counts;
  }, [domainConcepts]);

  // Fetch or filter concepts for selected domain + level
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchConcepts(domainId, selectedLevel)
      .then((data) => {
        if (!cancelled) {
          if (Array.isArray(data) && data.length > 0) {
            setLevelConcepts(data);
          } else {
            // Fallback filtering from client concepts
            const filtered = domainConcepts.filter((c) => {
              const lvl = c.level || (c.difficulty === 'Beginner' ? 'basic' : c.difficulty === 'Advanced' ? 'advanced' : 'intermediate');
              return lvl === selectedLevel;
            });
            setLevelConcepts(filtered);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          const filtered = domainConcepts.filter((c) => {
            const lvl = c.level || (c.difficulty === 'Beginner' ? 'basic' : c.difficulty === 'Advanced' ? 'advanced' : 'intermediate');
            return lvl === selectedLevel;
          });
          setLevelConcepts(filtered);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [domainId, selectedLevel, domainConcepts]);

  // Track progress
  useEffect(() => {
    const onExplored = () => setProgressTick((t) => t + 1);
    window.addEventListener(EXPLORED_UPDATED_EVENT, onExplored);
    window.addEventListener('storage', onExplored);
    return () => {
      window.removeEventListener(EXPLORED_UPDATED_EVENT, onExplored);
      window.removeEventListener('storage', onExplored);
    };
  }, []);

  const progress = useMemo(() => {
    const explored = new Set(getExploredIds());
    const total = levelConcepts.length;
    let completed = 0;
    for (const c of levelConcepts) {
      if (explored.has(c.id)) completed++;
    }
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelConcepts, progressTick]);

  // Available interactive visualizations for this domain
  const domainVisualizations = useMemo(() => {
    return getVisualizationsForDomain(domainId);
  }, [domainId]);

  const [activeVizTopicId, setActiveVizTopicId] = useState(() => {
    const list = getVisualizationsForDomain(domainId);
    return list[0]?.id || null;
  });

  // Keep active topic synchronized when switching domains
  useEffect(() => {
    if (domainVisualizations.length > 0 && !domainVisualizations.some((v) => v.id === activeVizTopicId)) {
      setActiveVizTopicId(domainVisualizations[0].id);
    }
  }, [domainId, domainVisualizations, activeVizTopicId]);

  return (
    <div
      className="domain-landing fade-in"
      style={{
        '--dom-accent': accentColor,
        '--dom-glow': glowColor,
      }}
    >
      {/* Domain Header */}
      <section className="domain-landing__header">
        <div className="domain-landing__header-content">
          <div className="domain-landing__badge-row">
            <Badge text="Core Domain" color={accentColor} size="md" />
            <span className="domain-landing__topic-count">
              {domainConcepts.length} Total Concepts
            </span>
          </div>

          <div className="domain-landing__title-row">
            <div className="domain-landing__icon-box">
              {DomainIcon && <DomainIcon size={34} style={{ color: accentColor }} />}
            </div>
            <div>
              <h1 className="domain-landing__title">{domainTitle}</h1>
              <p className="domain-landing__desc">{domainDescription}</p>
            </div>
          </div>

          <div className="domain-landing__actions">
            <Button
              icon={Map}
              onClick={() => navigate(`/roadmap/${domainId}`)}
              style={{ background: accentColor, color: '#050814' }}
            >
              View Learning Roadmap
            </Button>
            {toolLinks.map((tl) => (
              <Button
                key={tl.path}
                variant="secondary"
                icon={tl.icon || ExternalLink}
                onClick={() => navigate(tl.path)}
              >
                {tl.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Level Selector Cards */}
      <section className="domain-landing__levels">
        <div className="domain-landing__section-head">
          <h2 className="section-title">Proficiency Levels</h2>
          <span className="domain-landing__progress-text">
            Explored in {LEVELS.find((l) => l.id === selectedLevel)?.name}:{' '}
            <strong>
              {progress.completed}/{progress.total} ({progress.percent}%)
            </strong>
          </span>
        </div>

        <div className="level-cards-grid">
          {LEVELS.map((lvl) => {
            const isSelected = selectedLevel === lvl.id;
            const count = countsByLevel[lvl.id] || 0;
            return (
              <Card
                key={lvl.id}
                className={`level-card ${isSelected ? 'level-card--active' : ''}`}
                onClick={() => setSelectedLevel(lvl.id)}
                hoverable={true}
              >
                <div className="level-card__header">
                  <h3 className="level-card__name">{lvl.name}</h3>
                  <span className="level-card__badge">{count} Concepts</span>
                </div>
                <p className="level-card__desc">{lvl.description}</p>
                <div className="level-card__footer">
                  <span className="level-card__cta">
                    {isSelected ? 'Currently Viewing' : 'Select Level'}
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Interactive Domain Visualization Studio */}
      {domainVisualizations.length > 0 && (
        <section className="domain-landing__viz-studio">
          <div className="domain-landing__section-head">
            <div className="domain-landing__section-title-wrap">
              <Sparkles size={20} style={{ color: accentColor }} />
              <h2 className="section-title">Interactive {domainTitle} Studio</h2>
            </div>
            <span className="domain-landing__viz-count">
              {domainVisualizations.length} Interactive Topics Available
            </span>
          </div>

          {/* Visualization Topic Selector Tabs */}
          <div className="domain-landing__viz-tabs" role="tablist" aria-label={`${domainTitle} Visual Topics`}>
            {domainVisualizations.map((v) => {
              const isActive = activeVizTopicId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`domain-landing__viz-tab ${isActive ? 'domain-landing__viz-tab--active' : ''}`}
                  onClick={() => setActiveVizTopicId(v.id)}
                >
                  <span>{v.title}</span>
                </button>
              );
            })}
          </div>

          {/* Unified Modular Visualization Engine */}
          {activeVizTopicId && (
            <div className="domain-landing__viz-frame">
              <VisualizationEngine topicId={activeVizTopicId} />
            </div>
          )}
        </section>
      )}

      {/* Filtered Concept Grid */}
      <section className="domain-landing__concepts">
        <div className="domain-landing__section-head">
          <h2 className="section-title">
            {LEVELS.find((l) => l.id === selectedLevel)?.name} Concepts ({levelConcepts.length})
          </h2>
          <div className="level-progress-bar">
            <div
              className="level-progress-bar__fill"
              style={{ width: `${progress.percent}%`, background: accentColor }}
            />
          </div>
        </div>

        {loading ? (
          <Loading text={`Loading ${selectedLevel} concepts...`} />
        ) : levelConcepts.length === 0 ? (
          <div className="domain-landing__empty">
            <p>No concepts found for this domain and level.</p>
          </div>
        ) : (
          <div className="domain-concepts-grid">
            {levelConcepts.map((concept) => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
