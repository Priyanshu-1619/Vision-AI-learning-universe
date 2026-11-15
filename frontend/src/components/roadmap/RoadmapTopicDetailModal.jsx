import {
  X,
  CheckCircle2,
  Clock,
  Circle,
  ExternalLink,
  Sparkles,
  BookA,
  FlaskConical,
  Check,
  AlertCircle,
  Tag,
  BookOpen,
  Calculator,
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { getMathTopicById } from '../../data/mathematicsData';

export default function RoadmapTopicDetailModal({
  topic,
  status = 'not-started',
  prereqTopics = [],
  allRecords = {},
  mathRecords = {},
  accentColor = 'var(--ds-accent, #06b6d4)',
  onClose,
  onSetStatus,
  onCycleMathStatus,
  onStartLesson,
  onLaunchVisualization,
  onOpenDictionary,
  onOpenProject,
  onOpenMathRequirements,
}) {
  if (!topic) return null;

  return (
    <div className="roadmap-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="roadmap-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="roadmap-modal__header">
          <div>
            <div className="roadmap-modal__badge-row">
              <span className="roadmap-modal__order">#{topic.order}</span>
              <Badge text={topic.category} color={accentColor} size="sm" />
              <Badge text={topic.difficulty} color="#3b82f6" size="sm" />
              <span className="roadmap-modal__time">
                <Clock size={12} />
                {topic.estimatedMinutes} mins
              </span>
            </div>
            <h2 className="roadmap-modal__title">{topic.title}</h2>
          </div>

          <button
            type="button"
            className="roadmap-modal__close-btn"
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="roadmap-modal__body">
          {/* Status Selection Row */}
          <div className="roadmap-modal__status-section">
            <span className="roadmap-modal__section-label">Topic Status:</span>
            <div className="roadmap-modal__status-group" role="radiogroup">
              {[
                { id: 'not-started', label: 'Not Started', icon: Circle },
                { id: 'in-progress', label: 'In Progress', icon: Clock },
                { id: 'completed', label: 'Completed', icon: CheckCircle2 },
              ].map((st) => {
                const isCurrent = status === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    className={`roadmap-modal__status-btn ${
                      isCurrent ? `roadmap-modal__status-btn--active-${st.id}` : ''
                    }`}
                    onClick={() =>
                      onSetStatus(topic.id, st.id, {
                        estimatedMinutes: topic.estimatedMinutes,
                      })
                    }
                  >
                    <st.icon size={14} />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="roadmap-modal__section">
            <h3 className="roadmap-modal__heading">Overview</h3>
            <p className="roadmap-modal__desc-text">{topic.description}</p>
          </div>

          {/* Learning Objectives */}
          {topic.learningObjectives && topic.learningObjectives.length > 0 && (
            <div className="roadmap-modal__section">
              <h3 className="roadmap-modal__heading">Learning Objectives</h3>
              <ul className="roadmap-modal__objectives">
                {topic.learningObjectives.map((obj, i) => (
                  <li key={i} className="objective-item">
                    <Check size={14} className="objective-icon" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites Section */}
          {prereqTopics.length > 0 && (
            <div className="roadmap-modal__section">
              <h3 className="roadmap-modal__heading">Prerequisites</h3>
              <p className="roadmap-modal__hint">
                You can explore this topic anytime, but completing these prior topics first is recommended:
              </p>
              <div className="roadmap-modal__prereq-list">
                {prereqTopics.map((pt) => {
                  const ptStatus = allRecords[pt.id]?.status || 'not-started';
                  const isDone = ptStatus === 'completed';
                  return (
                    <div
                      key={pt.id}
                      className={`prereq-item ${isDone ? 'prereq-item--done' : 'prereq-item--pending'}`}
                    >
                      {isDone ? (
                        <CheckCircle2 size={16} className="prereq-icon prereq-icon--done" />
                      ) : (
                        <AlertCircle size={16} className="prereq-icon prereq-icon--pending" />
                      )}
                      <div className="prereq-item__info">
                        <span className="prereq-item__title">{pt.title}</span>
                        <span className="prereq-item__status">
                          {isDone ? 'Completed' : ptStatus === 'in-progress' ? 'In Progress' : 'Not Started'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mathematical Foundations Section */}
          {((topic.requiredMathTopicIds && topic.requiredMathTopicIds.length > 0) ||
            (topic.recommendedMathTopicIds && topic.recommendedMathTopicIds.length > 0)) && (
            <div className="roadmap-modal__section">
              <div className="roadmap-modal__section-header-row">
                <h3 className="roadmap-modal__heading">
                  <Calculator size={15} style={{ display: 'inline', marginRight: '6px', color: accentColor }} />
                  Mathematical Foundations
                </h3>
                {onOpenMathRequirements && (
                  <button
                    type="button"
                    className="roadmap-modal__section-link"
                    onClick={() => {
                      onClose();
                      onOpenMathRequirements();
                    }}
                  >
                    All Math Requirements &rarr;
                  </button>
                )}
              </div>
              <p className="roadmap-modal__hint">
                These mathematical concepts power the internal logic and formulas of this topic:
              </p>

              <div className="roadmap-modal__math-list">
                {/* Required Math Topics */}
                {(topic.requiredMathTopicIds || []).map((mid) => {
                  const mTopic = getMathTopicById(mid);
                  if (!mTopic) return null;
                  const mStatus = mathRecords[mid]?.status || 'not-started';
                  const isDone = mStatus === 'completed';
                  const isInProg = mStatus === 'in-progress';

                  return (
                    <div
                      key={mid}
                      className={`math-prereq-item ${isDone ? 'math-prereq-item--done' : isInProg ? 'math-prereq-item--in-progress' : 'math-prereq-item--pending'}`}
                    >
                      <button
                        type="button"
                        className="math-prereq-item__toggle"
                        onClick={() => onCycleMathStatus && onCycleMathStatus(mid)}
                        title={`Cycle math status (Current: ${mStatus})`}
                      >
                        {isDone ? (
                          <CheckCircle2 size={16} className="prereq-icon prereq-icon--done" />
                        ) : isInProg ? (
                          <Clock size={16} className="prereq-icon prereq-icon--in-progress" />
                        ) : (
                          <Circle size={16} className="prereq-icon prereq-icon--pending" />
                        )}
                      </button>

                      <div className="math-prereq-item__info">
                        <div className="math-prereq-item__title-row">
                          <span className="math-prereq-item__title">{mTopic.title}</span>
                          <span className="math-prereq-item__req-tag">Essential Prerequisite</span>
                        </div>
                        <p className="math-prereq-item__desc">{mTopic.description}</p>
                      </div>

                      {mTopic.hasInteractiveLesson && (
                        <a
                          href={mTopic.lessonRoute}
                          className="math-prereq-item__link"
                          target="_blank"
                          rel="noreferrer"
                          title="Open Interactive Math Studio"
                        >
                          <Sparkles size={12} />
                          <span>Studio</span>
                        </a>
                      )}
                    </div>
                  );
                })}

                {/* Recommended Math Topics */}
                {(topic.recommendedMathTopicIds || []).map((mid) => {
                  const mTopic = getMathTopicById(mid);
                  if (!mTopic) return null;
                  const mStatus = mathRecords[mid]?.status || 'not-started';
                  const isDone = mStatus === 'completed';

                  return (
                    <div
                      key={mid}
                      className={`math-prereq-item math-prereq-item--recommended ${isDone ? 'math-prereq-item--done' : 'math-prereq-item--pending'}`}
                    >
                      <button
                        type="button"
                        className="math-prereq-item__toggle"
                        onClick={() => onCycleMathStatus && onCycleMathStatus(mid)}
                        title={`Cycle math status (Current: ${mStatus})`}
                      >
                        {isDone ? (
                          <CheckCircle2 size={16} className="prereq-icon prereq-icon--done" />
                        ) : (
                          <Circle size={16} className="prereq-icon prereq-icon--pending" />
                        )}
                      </button>

                      <div className="math-prereq-item__info">
                        <div className="math-prereq-item__title-row">
                          <span className="math-prereq-item__title">{mTopic.title}</span>
                          <span className="math-prereq-item__rec-tag">Recommended Math</span>
                        </div>
                        <p className="math-prereq-item__desc">{mTopic.description}</p>
                      </div>

                      {mTopic.hasInteractiveLesson && (
                        <a
                          href={mTopic.lessonRoute}
                          className="math-prereq-item__link"
                          target="_blank"
                          rel="noreferrer"
                          title="Open Interactive Math Studio"
                        >
                          <Sparkles size={12} />
                          <span>Studio</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Connected Platform Features */}
          <div className="roadmap-modal__section">
            <h3 className="roadmap-modal__heading">Interactive Platform Connections</h3>
            <div className="roadmap-modal__connections-grid">
              {topic.visualizationIds && topic.visualizationIds.length > 0 && (
                <button
                  type="button"
                  className="connection-card connection-card--viz"
                  onClick={() => {
                    onClose();
                    onLaunchVisualization(topic.visualizationIds[0]);
                  }}
                >
                  <Sparkles size={16} style={{ color: 'var(--accent-yellow, #FFD928)' }} />
                  <div>
                    <strong>Interactive Visual Studio</strong>
                    <span>Live mathematical parameter playground</span>
                  </div>
                </button>
              )}

              {topic.dictionaryTerms && topic.dictionaryTerms.length > 0 && (
                <button
                  type="button"
                  className="connection-card connection-card--dict"
                  onClick={() => {
                    onClose();
                    onOpenDictionary(topic.dictionaryTerms[0]);
                  }}
                >
                  <BookA size={16} style={{ color: 'var(--accent-cyan, #06b6d4)' }} />
                  <div>
                    <strong>AI Knowledge Dictionary</strong>
                    <span>Term: {topic.dictionaryTerms[0]}</span>
                  </div>
                </button>
              )}

              {topic.projectIds && topic.projectIds.length > 0 && (
                <button
                  type="button"
                  className="connection-card connection-card--lab"
                  onClick={() => {
                    onClose();
                    onOpenProject(topic.projectIds[0]);
                  }}
                >
                  <FlaskConical size={16} style={{ color: 'var(--accent-emerald, #10b981)' }} />
                  <div>
                    <strong>Laboratory / Mission Mode</strong>
                    <span>Real scikit-learn algorithmic training</span>
                  </div>
                </button>
              )}

              <button
                type="button"
                className="connection-card connection-card--lesson"
                onClick={() => {
                  onClose();
                  onStartLesson(topic);
                }}
              >
                <BookOpen size={16} style={{ color: accentColor }} />
                <div>
                  <strong>Concept Theory Lesson</strong>
                  <span>Detailed equations and definitions</span>
                </div>
              </button>
            </div>
          </div>

          {/* Tags */}
          {topic.tags && topic.tags.length > 0 && (
            <div className="roadmap-modal__tags">
              <Tag size={12} className="tag-icon" />
              {topic.tags.map((tg) => (
                <span key={tg} className="topic-tag">
                  #{tg}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="roadmap-modal__footer">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            icon={ExternalLink}
            style={{ background: accentColor, color: '#050814' }}
            onClick={() => {
              onClose();
              onStartLesson(topic);
            }}
          >
            {status === 'completed' ? 'Review Lesson' : 'Start Lesson'}
          </Button>
        </div>
      </div>
    </div>
  );
}

