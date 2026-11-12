import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Circle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useConcepts } from '../../hooks/useConcepts';
import { markConceptExplored } from '../../concept-engine/ConceptEngine';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Loading from '../common/Loading';
import './Roadmap.css';

const DOMAIN_METADATA = {
  'data-science': {
    title: 'Data Science Roadmap',
    description: 'Master data ingestion, statistical thinking, probability distributions, and feature pipelines.',
    accent: 'var(--ds-accent, #06b6d4)',
    glow: 'var(--ds-glow, rgba(6, 182, 212, 0.15))',
  },
  'machine-learning': {
    title: 'Machine Learning Roadmap',
    description: 'From classic regression to ensemble methods, loss optimization, and robust evaluation.',
    accent: 'var(--ml-accent, #164BFF)',
    glow: 'var(--ml-glow, rgba(22, 75, 255, 0.15))',
  },
  'deep-learning': {
    title: 'Deep Learning Roadmap',
    description: 'Journey from single perceptrons and forward propagation to transformers and modern attention.',
    accent: 'var(--dl-accent, #8b5cf6)',
    glow: 'var(--dl-glow, rgba(139, 92, 246, 0.15))',
  },
};

const LEVELS = [
  { id: 'basic', label: 'Basic Foundations' },
  { id: 'intermediate', label: 'Intermediate Core' },
  { id: 'advanced', label: 'Advanced Specialization' },
];

export default function Roadmap() {
  const { domain: paramDomain } = useParams();
  const navigate = useNavigate();
  const { concepts: allConcepts, loading } = useConcepts();

  const domain = DOMAIN_METADATA[paramDomain] ? paramDomain : 'data-science';
  const meta = DOMAIN_METADATA[domain];

  const [selectedLevel, setSelectedLevel] = useState('basic');
  const [roadmapProgress, setRoadmapProgress] = useState(() => {
    try {
      const raw = localStorage.getItem(`ailu_roadmap_${domain}_basic`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const storageKey = `ailu_roadmap_${domain}_${selectedLevel}`;

  const handleSelectLevel = (newLevel) => {
    setSelectedLevel(newLevel);
    try {
      const raw = localStorage.getItem(`ailu_roadmap_${domain}_${newLevel}`);
      setRoadmapProgress(raw ? JSON.parse(raw) : {});
    } catch {
      setRoadmapProgress({});
    }
  };

  // Sync external storage updates
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === storageKey && e.newValue) {
        try {
          setRoadmapProgress(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey]);

  // Save progress helper
  const updateStatus = useCallback((conceptId, newStatus) => {
    setRoadmapProgress((prev) => {
      const next = { ...prev, [conceptId]: newStatus };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (err) {
        console.warn('Roadmap storage error:', err);
      }
      return next;
    });

    if (newStatus === 2) {
      markConceptExplored(conceptId);
    }
  }, [storageKey]);

  // Cycle status: 0 (Not Started) -> 1 (In Progress) -> 2 (Completed) -> 0
  const handleCycleStatus = (conceptId) => {
    const current = roadmapProgress[conceptId] ?? 0;
    const next = (current + 1) % 3;
    updateStatus(conceptId, next);
  };

  // Reset progress for this level
  const handleReset = () => {
    if (window.confirm(`Reset progress for ${meta.title} (${selectedLevel})?`)) {
      setRoadmapProgress({});
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    }
  };

  // Concepts in domain
  const domainConcepts = useMemo(() => {
    return allConcepts.filter((c) => {
      if (c.domain) return c.domain === domain;
      if (domain === 'data-science') {
        return ['Foundations', 'Mathematics', 'Data Science'].includes(c.category);
      }
      if (domain === 'deep-learning') {
        return c.category === 'Deep Learning';
      }
      return !['Foundations', 'Mathematics', 'Data Science', 'Deep Learning'].includes(c.category);
    });
  }, [allConcepts, domain]);

  // Concepts in current selected level
  const levelConcepts = useMemo(() => {
    return domainConcepts.filter((c) => {
      const lvl = c.level || (c.difficulty === 'Beginner' ? 'basic' : c.difficulty === 'Advanced' ? 'advanced' : 'intermediate');
      return lvl === selectedLevel;
    });
  }, [domainConcepts, selectedLevel]);

  // Progress metrics
  const { completedCount, inProgressCount, totalCount, progressPercent } = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    const total = levelConcepts.length;
    for (const c of levelConcepts) {
      const st = roadmapProgress[c.id] ?? 0;
      if (st === 2) completed++;
      else if (st === 1) inProgress++;
    }
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      completedCount: completed,
      inProgressCount: inProgress,
      totalCount: total,
      progressPercent: percent,
    };
  }, [levelConcepts, roadmapProgress]);

  // Find next recommended concept
  const nextRecommended = useMemo(() => {
    for (const c of levelConcepts) {
      const st = roadmapProgress[c.id] ?? 0;
      if (st !== 2) {
        // Check if prerequisites in this domain are completed
        const prereqs = c.prerequisites || [];
        const allPrereqsDone = prereqs.every((pid) => (roadmapProgress[pid] ?? 0) === 2);
        if (allPrereqsDone || prereqs.length === 0) {
          return c;
        }
      }
    }
    return levelConcepts.find((c) => (roadmapProgress[c.id] ?? 0) !== 2) || null;
  }, [levelConcepts, roadmapProgress]);

  if (loading) return <Loading text="Loading roadmap..." />;

  return (
    <div
      className="roadmap fade-in"
      style={{
        '--rd-accent': meta.accent,
        '--rd-glow': meta.glow,
      }}
    >
      {/* Header Banner */}
      <header className="roadmap__header">
        <div className="roadmap__header-main">
          <div className="roadmap__badge-row">
            <Badge text="Structured Roadmap" color={meta.accent} size="md" />
            <span className="roadmap__meta-item">
              Domain: <strong>{meta.title}</strong>
            </span>
          </div>

          <h1 className="roadmap__title">{meta.title}</h1>
          <p className="roadmap__desc">{meta.description}</p>

          {/* Overall Progress Bar */}
          <div className="roadmap__progress-box">
            <div className="roadmap__progress-head">
              <span className="roadmap__progress-label">
                Level Progress: <strong>{completedCount}</strong> completed · <strong>{inProgressCount}</strong> in progress of {totalCount}
              </span>
              <span className="roadmap__progress-val">{progressPercent}%</span>
            </div>
            <div className="roadmap__progress-track">
              <div
                className="roadmap__progress-fill"
                style={{ width: `${progressPercent}%`, background: meta.accent }}
              />
            </div>
          </div>
        </div>

        <div className="roadmap__header-actions">
          <Button variant="ghost" icon={RotateCcw} onClick={handleReset} title="Reset Progress">
            Reset
          </Button>
          <Button
            variant="secondary"
            icon={Layers}
            onClick={() => navigate(`/${domain}`)}
          >
            Domain Overview
          </Button>
        </div>
      </header>

      {/* Level Tabs */}
      <nav className="roadmap__tabs" role="tablist">
        {LEVELS.map((lvl) => {
          const isActive = selectedLevel === lvl.id;
          return (
            <button
              key={lvl.id}
              type="button"
              className={`roadmap-tab ${isActive ? 'roadmap-tab--active' : ''}`}
              onClick={() => handleSelectLevel(lvl.id)}
            >
              {lvl.label}
            </button>
          );
        })}
      </nav>

      {/* Next Recommended Concept Section */}
      {nextRecommended && (
        <section className="roadmap__recommended">
          <Card className="recommended-card" hoverable={false}>
            <div className="recommended-card__head">
              <div className="recommended-card__badge">
                <Sparkles size={14} style={{ color: meta.accent }} />
                <span>Next Recommended Concept</span>
              </div>
              <Badge text={nextRecommended.category} color={meta.accent} size="sm" />
            </div>

            <div className="recommended-card__body">
              <span className="recommended-card__icon">{nextRecommended.icon}</span>
              <div>
                <h3 className="recommended-card__title">{nextRecommended.title}</h3>
                <p className="recommended-card__definition">{nextRecommended.definition}</p>
              </div>
            </div>

            <div className="recommended-card__footer">
              <Button
                icon={ArrowRight}
                onClick={() => navigate(`/concept/${nextRecommended.id}`)}
                style={{ background: meta.accent, color: '#050814' }}
              >
                Learn Concept Theory
              </Button>
            </div>
          </Card>
        </section>
      )}

      {/* Checklist Grid */}
      <section className="roadmap__checklist">
        <div className="roadmap__checklist-header">
          <h2 className="section-title">Concept Milestones ({levelConcepts.length})</h2>
          <div className="roadmap__legend">
            <span className="legend-item">
              <Circle size={12} color="#64748b" /> Not Started
            </span>
            <span className="legend-item">
              <Clock size={12} color="#f59e0b" /> In Progress
            </span>
            <span className="legend-item">
              <CheckCircle2 size={12} color="#10b981" /> Completed
            </span>
          </div>
        </div>

        {levelConcepts.length === 0 ? (
          <div className="roadmap__empty">
            <p>No concepts found for this roadmap tier.</p>
          </div>
        ) : (
          <div className="roadmap-items-list">
            {levelConcepts.map((item, index) => {
              const status = roadmapProgress[item.id] ?? 0;
              const isCompleted = status === 2;
              const isInProgress = status === 1;

              return (
                <div
                  key={item.id}
                  className={`roadmap-item ${isCompleted ? 'roadmap-item--completed' : ''} ${
                    isInProgress ? 'roadmap-item--in-progress' : ''
                  }`}
                  onClick={() => handleCycleStatus(item.id)}
                >
                  {/* Status Indicator Button */}
                  <button
                    type="button"
                    className="roadmap-item__status-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCycleStatus(item.id);
                    }}
                    title="Click to cycle status"
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={22} className="status-icon status-icon--completed" />
                    ) : isInProgress ? (
                      <Clock size={22} className="status-icon status-icon--in-progress" />
                    ) : (
                      <Circle size={22} className="status-icon status-icon--not-started" />
                    )}
                  </button>

                  {/* Step Index & Icon */}
                  <span className="roadmap-item__index">#{index + 1}</span>
                  <span className="roadmap-item__icon">{item.icon}</span>

                  {/* Content */}
                  <div className="roadmap-item__content">
                    <div className="roadmap-item__title-row">
                      <h4 className="roadmap-item__title">{item.title}</h4>
                      <span className="roadmap-item__status-tag">
                        {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>

                    <p className="roadmap-item__desc">
                      {item.definition?.slice(0, 110)}{item.definition?.length > 110 ? '…' : ''}
                    </p>

                    {/* Prerequisites */}
                    {item.prerequisites && item.prerequisites.length > 0 && (
                      <div className="roadmap-item__prereqs">
                        <span className="prereqs-label">Prerequisites:</span>
                        {item.prerequisites.map((prereqId) => (
                          <span key={prereqId} className="prereq-chip">
                            {prereqId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Link Out to Detail */}
                  <button
                    type="button"
                    className="roadmap-item__view-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/concept/${item.id}`);
                    }}
                    title="View Concept Theory"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
