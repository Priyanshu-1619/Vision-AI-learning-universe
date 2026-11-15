import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calculator,
  CheckCircle2,
  Clock,
  Circle,
  Sparkles,
  ExternalLink,
  BookOpen,
  Filter,
  Search,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Card from '../common/Card';
import { getMathTopicsForDomain } from '../../data/mathematicsData';
import { ALL_ROADMAP_TOPICS } from '../../data/roadmapsData';

const CATEGORY_LABELS = {
  all: 'All Mathematical Areas',
  algebra: 'Algebra & Fundamentals',
  statistics: 'Statistics & Probability',
  'linear-algebra': 'Linear Algebra & Tensors',
  calculus: 'Calculus & Gradients',
  optimization: 'Optimization & Losses',
};

const CATEGORY_COLORS = {
  algebra: '#38bdf8',
  statistics: '#06b6d4',
  'linear-algebra': '#8b5cf6',
  calculus: '#ec4899',
  optimization: '#facc15',
};

const DIFFICULTY_COLORS = {
  beginner: '#10b981',
  medium: '#3b82f6',
  hard: '#f59e0b',
  expert: '#ef4444',
};

export default function RoadmapMathModal({
  domain,
  meta,
  getMathStatus,
  onCycleMathStatus,
  onSetMathStatus,
  onResetMathProgress,
  onClose,
}) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopics, setExpandedTopics] = useState({});

  // All math topics for this domain
  const domainMathTopics = useMemo(() => {
    return getMathTopicsForDomain(domain);
  }, [domain]);

  // Compute domain technical roadmap references for each math topic
  const domainTechnicalTopics = useMemo(() => {
    return ALL_ROADMAP_TOPICS.filter((t) => t.domain === domain);
  }, [domain]);

  const mathTopicConnections = useMemo(() => {
    const map = {};
    for (const mt of domainMathTopics) {
      const requiredBy = domainTechnicalTopics.filter((tt) =>
        tt.requiredMathTopicIds?.includes(mt.id)
      );
      const recommendedBy = domainTechnicalTopics.filter((tt) =>
        tt.recommendedMathTopicIds?.includes(mt.id)
      );
      map[mt.id] = {
        requiredBy,
        recommendedBy,
        isRequired: requiredBy.length > 0,
      };
    }
    return map;
  }, [domainMathTopics, domainTechnicalTopics]);

  // Progress metrics
  const { completedCount, inProgressCount, notStartedCount, totalCount, progressPercent } = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    const total = domainMathTopics.length;

    for (const mt of domainMathTopics) {
      const st = getMathStatus(mt.id);
      if (st === 'completed') completed++;
      else if (st === 'in-progress') inProgress++;
      else notStarted++;
    }

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      completedCount: completed,
      inProgressCount: inProgress,
      notStartedCount: notStarted,
      totalCount: total,
      progressPercent: percent,
    };
  }, [domainMathTopics, getMathStatus]);

  // Filtered topics
  const filteredTopics = useMemo(() => {
    return domainMathTopics.filter((topic) => {
      // Category filter
      if (selectedCategory !== 'all' && topic.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all') {
        const st = getMathStatus(topic.id);
        if (st !== statusFilter) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = topic.title?.toLowerCase().includes(q);
        const matchDesc = topic.description?.toLowerCase().includes(q);
        const matchCat = topic.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [domainMathTopics, selectedCategory, statusFilter, searchQuery, getMathStatus]);

  const toggleExpand = (topicId) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const handleStartLesson = useCallback(
    (topic) => {
      // Advance to in-progress if not-started
      const current = getMathStatus(topic.id);
      if (current === 'not-started') {
        onSetMathStatus(topic.id, 'in-progress');
      }
      if (topic.lessonRoute) {
        navigate(topic.lessonRoute);
      }
      onClose();
    },
    [getMathStatus, onSetMathStatus, navigate, onClose]
  );

  const handleResetClick = () => {
    const ok = window.confirm(
      `Reset all mathematics learning progress for ${meta.title}?\n\nThis will reset completion records for all ${domainMathTopics.length} math requirements in this domain.`
    );
    if (ok) {
      onResetMathProgress();
    }
  };

  return (
    <div className="roadmap-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="roadmap-modal roadmap-math-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="roadmap-modal__header">
          <div>
            <div className="roadmap-modal__badge-row">
              <span className="roadmap-math-modal__badge">
                <Calculator size={13} style={{ color: meta.accent }} />
                <span>Foundational Mathematics Requirements</span>
              </span>
              <Badge text={meta.title} color={meta.accent} size="sm" />
              <span className="roadmap-modal__time">
                <Clock size={12} />
                {totalCount} Math Topics
              </span>
            </div>
            <h2 className="roadmap-modal__title">
              {meta.title} — Mathematics Requirements
            </h2>
            <p className="roadmap-math-modal__subtitle">
              Study and track the exact mathematical foundations required to understand and implement
              algorithms in {meta.title}.
            </p>
          </div>

          <button
            type="button"
            className="roadmap-modal__close-btn"
            onClick={onClose}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Math Progress Overview Strip */}
        <div className="roadmap-math-progress-banner">
          <div className="roadmap-math-progress-info">
            <div className="roadmap-math-stat">
              <span className="math-stat__val">{completedCount}</span>
              <span className="math-stat__lbl">Completed</span>
            </div>
            <div className="roadmap-math-stat">
              <span className="math-stat__val">{inProgressCount}</span>
              <span className="math-stat__lbl">In Progress</span>
            </div>
            <div className="roadmap-math-stat">
              <span className="math-stat__val">{notStartedCount}</span>
              <span className="math-stat__lbl">Remaining</span>
            </div>
            <div className="roadmap-math-stat math-stat--highlight">
              <span className="math-stat__val" style={{ color: meta.accent }}>
                {progressPercent}%
              </span>
              <span className="math-stat__lbl">Mastered</span>
            </div>
          </div>

          <div className="roadmap-math-track-container">
            <div className="roadmap-math-track">
              <div
                className="roadmap-math-fill"
                style={{ width: `${progressPercent}%`, background: meta.accent }}
              />
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="roadmap-math-toolbar">
          <div className="roadmap-math-toolbar__search">
            <Search size={15} className="math-search-icon" />
            <input
              type="text"
              placeholder="Search math topics, concepts, or formulas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="math-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="math-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="roadmap-math-toolbar__select-box">
            <Filter size={13} className="math-filter-icon" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="math-category-select"
            >
              {Object.entries(CATEGORY_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>

          {/* Status Chips */}
          <div className="roadmap-math-toolbar__status-chips">
            {['all', 'not-started', 'in-progress', 'completed'].map((st) => (
              <button
                key={st}
                type="button"
                className={`math-status-chip ${statusFilter === st ? 'math-status-chip--active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'all'
                  ? 'All Statuses'
                  : st === 'in-progress'
                  ? 'In Progress'
                  : st === 'completed'
                  ? 'Completed'
                  : 'Not Started'}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            icon={RotateCcw}
            onClick={handleResetClick}
            title="Reset Mathematics Progress"
            className="math-reset-btn"
          >
            Reset Math
          </Button>
        </div>

        {/* Math Topics List */}
        <div className="roadmap-modal__body roadmap-math-modal__body">
          {filteredTopics.length === 0 ? (
            <div className="roadmap__empty">
              <BookOpen size={28} style={{ color: 'var(--text-secondary)' }} />
              <p>No mathematics topics match your search or filter.</p>
              <button
                type="button"
                className="roadmap-toolbar__reset-link"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setStatusFilter('all');
                }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="roadmap-math-grid">
              {filteredTopics.map((topic) => {
                const status = getMathStatus(topic.id);
                const isCompleted = status === 'completed';
                const isInProgress = status === 'in-progress';
                const connections = mathTopicConnections[topic.id] || {
                  requiredBy: [],
                  recommendedBy: [],
                  isRequired: false,
                };
                const isExpanded = expandedTopics[topic.id];
                const catColor = CATEGORY_COLORS[topic.category] || meta.accent;
                const diffColor = DIFFICULTY_COLORS[topic.difficulty] || '#3b82f6';

                return (
                  <Card
                    key={topic.id}
                    className={`math-topic-card ${
                      isCompleted ? 'math-topic-card--completed' : ''
                    } ${isInProgress ? 'math-topic-card--in-progress' : ''}`}
                    hoverable={false}
                  >
                    {/* Header */}
                    <div className="math-topic-card__header">
                      <div className="math-topic-card__left">
                        {/* Status Toggle Button */}
                        <button
                          type="button"
                          className="math-topic-card__status-btn"
                          onClick={() =>
                            onCycleMathStatus(topic.id, {
                              estimatedMinutes: topic.estimatedMinutes,
                            })
                          }
                          title={`Click to cycle status (Current: ${status})`}
                          aria-label={`Current status: ${status}`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={22} className="status-icon status-icon--completed" />
                          ) : isInProgress ? (
                            <Clock size={22} className="status-icon status-icon--in-progress" />
                          ) : (
                            <Circle size={22} className="status-icon status-icon--not-started" />
                          )}
                        </button>

                        <div>
                          <div className="math-topic-card__tags">
                            <span
                              className="math-cat-tag"
                              style={{ color: catColor, borderColor: `${catColor}40` }}
                            >
                              {CATEGORY_LABELS[topic.category] || topic.category}
                            </span>
                            <span
                              className="math-diff-tag"
                              style={{ color: diffColor, borderColor: `${diffColor}40` }}
                            >
                              {topic.difficulty}
                            </span>
                            <span className="math-time-tag">
                              <Clock size={11} />
                              {topic.estimatedMinutes}m
                            </span>
                            {connections.isRequired ? (
                              <span className="math-priority-tag math-priority-tag--req">
                                Essential Prerequisite
                              </span>
                            ) : (
                              <span className="math-priority-tag math-priority-tag--rec">
                                Recommended
                              </span>
                            )}
                          </div>
                          <h4 className="math-topic-card__title">{topic.title}</h4>
                        </div>
                      </div>

                      <div className="math-topic-card__right">
                        <span
                          className={`roadmap-card__status-tag roadmap-card__status-tag--${status}`}
                        >
                          {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="math-topic-card__desc">{topic.description}</p>

                    {/* Related Roadmap Topics Preview / Expander */}
                    {(connections.requiredBy.length > 0 || connections.recommendedBy.length > 0) && (
                      <div className="math-topic-card__connections">
                        <button
                          type="button"
                          className="math-connections-toggle"
                          onClick={() => toggleExpand(topic.id)}
                        >
                          <span>
                            Powers {connections.requiredBy.length + connections.recommendedBy.length} {meta.title} topic(s)
                          </span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {isExpanded && (
                          <div className="math-connections-drawer fade-in">
                            {connections.requiredBy.length > 0 && (
                              <div className="math-conn-group">
                                <span className="math-conn-label math-conn-label--req">
                                  Required by:
                                </span>
                                <div className="math-conn-chips">
                                  {connections.requiredBy.map((tt) => (
                                    <span key={tt.id} className="math-conn-chip math-conn-chip--req">
                                      {tt.title}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {connections.recommendedBy.length > 0 && (
                              <div className="math-conn-group">
                                <span className="math-conn-label math-conn-label--rec">
                                  Recommended for:
                                </span>
                                <div className="math-conn-chips">
                                  {connections.recommendedBy.map((tt) => (
                                    <span key={tt.id} className="math-conn-chip math-conn-chip--rec">
                                      {tt.title}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="math-topic-card__footer">
                      <div className="math-lesson-badge">
                        {topic.hasInteractiveLesson ? (
                          <span className="interactive-available-badge">
                            <Sparkles size={12} />
                            <span>Interactive Studio Available</span>
                          </span>
                        ) : (
                          <span className="theory-ref-badge">
                            <BookOpen size={12} />
                            <span>Mathematics Reference</span>
                          </span>
                        )}
                      </div>

                      <div className="math-topic-card__action-buttons">
                        {topic.hasInteractiveLesson ? (
                          <button
                            type="button"
                            className="math-start-lesson-btn"
                            style={{ background: meta.accent }}
                            onClick={() => handleStartLesson(topic)}
                          >
                            <span>
                              {isCompleted
                                ? 'Review in Studio'
                                : isInProgress
                                ? 'Continue in Studio'
                                : 'Launch Math Studio'}
                            </span>
                            <ExternalLink size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="math-mark-done-btn"
                            onClick={() =>
                              onSetMathStatus(
                                topic.id,
                                isCompleted ? 'not-started' : 'completed',
                                { estimatedMinutes: topic.estimatedMinutes }
                              )
                            }
                          >
                            <span>{isCompleted ? 'Mark Incomplete' : 'Mark Completed'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="roadmap-modal__footer">
          <Button variant="secondary" onClick={onClose}>
            Back to Technical Roadmap
          </Button>
          <Button
            icon={Sparkles}
            onClick={() => {
              navigate('/mathematics');
              onClose();
            }}
            style={{ background: meta.accent, color: '#050814' }}
          >
            Open Mathematics Laboratory
          </Button>
        </div>
      </div>
    </div>
  );
}
