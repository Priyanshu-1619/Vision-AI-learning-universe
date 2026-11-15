import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { fetchConcepts } from '../../api/client';
import { useConcepts } from '../../hooks/useConcepts';
import { getExploredIds, EXPLORED_UPDATED_EVENT } from '../../concept-engine/ConceptEngine';
import VisualizationEngine from '../visualization/VisualizationEngine';
import { getVisualizationsForDomain } from '../visualization/visualizationRegistry';
import ConceptCard from '../common/ConceptCard';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';
import './DomainLanding.css';

const LEVELS = [
  {
    id: 'basic',
    code: 'LEVEL 01',
    name: 'Beginner',
    tagline: 'Foundations, Essential Math & Visual Intuition',
    description:
      'Core terminology, introductory intuition, fundamental algebra, basic datasets, and simple visualizations.',
    topics: [
      'Introduction & Core Terminology',
      'Fundamental Mathematics',
      'Basic Visualizations & Data Exploration',
    ],
  },
  {
    id: 'intermediate',
    code: 'LEVEL 02',
    name: 'Intermediate',
    tagline: 'Core Algorithms, Implementations & Experiments',
    description:
      'Algorithmic formulations, scikit-learn models, hyperparameter tuning, loss landscapes, and interactive testing.',
    topics: [
      'Core Classical & Neural Algorithms',
      'Loss Functions & Optimizers',
      'Cross-Validation & Performance Metrics',
    ],
  },
  {
    id: 'advanced',
    code: 'LEVEL 03',
    name: 'Advanced',
    tagline: 'Complex Architectures, Optimization & Debugging',
    description:
      'Rigorous mathematical derivations, specialized architectures, custom loss design, edge cases, and model analysis.',
    topics: [
      'Deep Architectures & Attention',
      'Mathematical Derivations & Gradients',
      'Model Diagnostics & Edge-Case Debugging',
    ],
  },
];

export default function DomainLanding({
  domainId,
  domainTitle,
  domainDescription,
  accentColor = '#10B981',
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

  // Check beginner completion for prerequisite hints
  const beginnerCompletedCount = useMemo(() => {
    const explored = new Set(getExploredIds());
    const beginnerConcepts = domainConcepts.filter(
      (c) => (c.level || (c.difficulty === 'Beginner' ? 'basic' : 'intermediate')) === 'basic'
    );
    let count = 0;
    for (const c of beginnerConcepts) {
      if (explored.has(c.id)) count++;
    }
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainConcepts, progressTick]);

  const showPrerequisiteHint = selectedLevel !== 'basic' && beginnerCompletedCount < 3;

  // Available interactive visualizations for this domain
  const domainVisualizations = useMemo(() => {
    return getVisualizationsForDomain(domainId);
  }, [domainId]);

  const [activeVizTopicId, setActiveVizTopicId] = useState(() => {
    const list = getVisualizationsForDomain(domainId);
    return list[0]?.id || null;
  });

  useEffect(() => {
    if (domainVisualizations.length > 0 && !domainVisualizations.some((v) => v.id === activeVizTopicId)) {
      setActiveVizTopicId(domainVisualizations[0].id);
    }
  }, [domainId, domainVisualizations, activeVizTopicId]);

  const activeLevelObj = LEVELS.find((l) => l.id === selectedLevel) || LEVELS[0];

  return (
    <div
      className="domain-landing fade-in"
      style={{
        '--dom-accent': accentColor,
      }}
    >
      {/* Domain Header Banner */}
      <section className="domain-landing__header">
        <div className="domain-landing__header-content">
          <div className="domain-landing__badge-row">
            <span className="domain-pill" style={{ borderColor: accentColor, color: accentColor }}>
              Independent Curriculum
            </span>
            <span className="domain-landing__topic-count">
              {domainConcepts.length} Total Lessons across 3 Tiers
            </span>
          </div>

          <div className="domain-landing__title-row">
            <div
              className="domain-landing__icon-box"
              style={{
                background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
              }}
            >
              {DomainIcon && <DomainIcon size={32} style={{ color: accentColor }} />}
            </div>
            <div>
              <h1 className="domain-landing__title">{domainTitle}</h1>
              <p className="domain-landing__desc">{domainDescription}</p>
            </div>
          </div>

          <div className="domain-landing__actions">
            <Button
              icon={Map}
              onClick={() => navigate(`/roadmaps/${domainId}`)}
              style={{ background: accentColor, color: '#0D0F12', fontWeight: 600 }}
            >
              View Complete Roadmap
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
          <div>
            <h2 className="section-title">Select Your Proficiency Level</h2>
            <p className="domain-landing__section-sub">
              You are free to begin at any tier. Foundations are always accessible for quick reference.
            </p>
          </div>
          <div className="domain-landing__progress-tag">
            <span>
              {activeLevelObj.name} Progress:{' '}
              <strong>
                {progress.completed}/{progress.total} ({progress.percent}%)
              </strong>
            </span>
          </div>
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
                  <span className="level-card__code">{lvl.code}</span>
                  <span className="level-card__badge">{count} Lessons</span>
                </div>
                <h3 className="level-card__name">{lvl.name}</h3>
                <span className="level-card__tagline">{lvl.tagline}</span>
                <p className="level-card__desc">{lvl.description}</p>
                <div className="level-card__footer">
                  <span className="level-card__cta" style={isSelected ? { color: accentColor } : {}}>
                    {isSelected ? 'Currently Selected' : 'Choose Level'}
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Non-blocking Prerequisite Hint when skipping Beginner */}
        {showPrerequisiteHint && (
          <div className="prereq-notice-banner">
            <Info size={18} className="text-warm prereq-notice-banner__icon" />
            <div className="prereq-notice-banner__content">
              <strong>Learning Tip: You selected {activeLevelObj.name}.</strong>
              <p>
                You are free to explore {activeLevelObj.name} directly! If you encounter mathematical notations or terminology that seem unfamiliar, you can review LEVEL 01 (Beginner) fundamentals anytime.
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelectedLevel('basic')}
            >
              Review Foundations
            </Button>
          </div>
        )}
      </section>

      {/* Interactive Domain Visualization Studio */}
      {domainVisualizations.length > 0 && (
        <section className="domain-landing__viz-studio">
          <div className="domain-landing__section-head">
            <div className="domain-landing__section-title-wrap">
              <Sparkles size={20} style={{ color: accentColor }} />
              <h2 className="section-title">Interactive {domainTitle} Proving Ground</h2>
            </div>
            <span className="domain-landing__viz-count">
              {domainVisualizations.length} Interactive Topics Ready to Test
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
                  style={isActive ? { borderColor: accentColor, color: '#F3F4F6' } : {}}
                >
                  <span>{v.title}</span>
                </button>
              );
            })}
          </div>

          {/* Modular Visualization Engine */}
          {activeVizTopicId && (
            <div className="domain-landing__viz-frame">
              <VisualizationEngine topicId={activeVizTopicId} />
            </div>
          )}
        </section>
      )}

      {/* Structured Curriculum Lesson Cards */}
      <section className="domain-landing__concepts">
        <div className="domain-landing__section-head">
          <div>
            <h2 className="section-title">
              {activeLevelObj.name} Curriculum ({levelConcepts.length} Topics)
            </h2>
            <p className="domain-landing__section-sub">
              Select any topic below to open its comprehensive W3Schools-style lesson with formulas, visual graphs, and quizzes.
            </p>
          </div>
          <div className="domain-landing__progress-track-wrap">
            <div className="domain-landing__track">
              <div
                className="domain-landing__fill"
                style={{ width: `${progress.percent}%`, background: accentColor }}
              />
            </div>
            <span className="domain-landing__pct">{progress.percent}% Completed</span>
          </div>
        </div>

        {loading ? (
          <Loading text={`Loading ${activeLevelObj.name} curriculum...`} />
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
