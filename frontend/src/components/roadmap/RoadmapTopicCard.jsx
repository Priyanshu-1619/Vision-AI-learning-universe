import {
  CheckCircle2,
  Clock,
  Circle,
  ExternalLink,
  Sparkles,
  BookA,
  FlaskConical,
  AlertCircle,
  Check,
  ChevronRight,
  Calculator,
} from 'lucide-react';

const DIFFICULTY_COLORS = {
  beginner: '#10b981',
  easy: '#06b6d4',
  medium: '#3b82f6',
  hard: '#f59e0b',
  expert: '#ef4444',
};

export default function RoadmapTopicCard({
  topic,
  status = 'not-started',
  isPrereqMet = true,
  missingPrereqNames = [],
  isMathPrereqMet = true,
  missingMathNames = [],
  accentColor = 'var(--ds-accent, #06b6d4)',
  onCycleStatus,
  onOpenDetails,
  onStartLesson,
  onLaunchVisualization,
  onOpenDictionary,
  onOpenProject,
  onOpenMathRequirements,
}) {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in-progress';

  const diffColor = DIFFICULTY_COLORS[topic.difficulty] || '#3b82f6';

  return (
    <div
      className={`roadmap-card ${isCompleted ? 'roadmap-card--completed' : ''} ${
        isInProgress ? 'roadmap-card--in-progress' : ''
      } ${!isPrereqMet ? 'roadmap-card--prereq-missing' : ''}`}
      onClick={() => onOpenDetails(topic)}
      role="article"
      aria-label={`Topic: ${topic.title}`}
    >
      <div className="roadmap-card__top">
        {/* Status Toggle Button */}
        <button
          type="button"
          className="roadmap-card__status-btn"
          onClick={(e) => {
            e.stopPropagation();
            onCycleStatus(topic.id, { estimatedMinutes: topic.estimatedMinutes });
          }}
          title={`Click to cycle status (Current: ${status})`}
          aria-label={`Current status: ${status}. Click to change.`}
        >
          {isCompleted ? (
            <CheckCircle2 size={24} className="status-icon status-icon--completed" />
          ) : isInProgress ? (
            <Clock size={24} className="status-icon status-icon--in-progress" />
          ) : (
            <Circle size={24} className="status-icon status-icon--not-started" />
          )}
        </button>

        {/* Index Order & Badges */}
        <div className="roadmap-card__badge-cluster">
          <span className="roadmap-card__order">#{topic.order}</span>
          <span className="roadmap-card__category">{topic.category}</span>
          <span
            className="roadmap-card__diff"
            style={{ color: diffColor, borderColor: `${diffColor}40` }}
          >
            {topic.difficulty}
          </span>
          <span className="roadmap-card__time">
            <Clock size={11} />
            {topic.estimatedMinutes}m
          </span>
        </div>

        {/* Status Tag */}
        <span
          className={`roadmap-card__status-tag roadmap-card__status-tag--${status}`}
        >
          {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
        </span>
      </div>

      {/* Main Content */}
      <div className="roadmap-card__content">
        <h4 className="roadmap-card__title">{topic.title}</h4>
        <p className="roadmap-card__desc">{topic.description}</p>
      </div>

      {/* Prerequisite Indicator */}
      {topic.prerequisites && topic.prerequisites.length > 0 && (
        <div className="roadmap-card__prereq-row">
          {isPrereqMet ? (
            <span className="prereq-pill prereq-pill--met">
              <Check size={11} />
              <span>Prerequisites Ready ({topic.prerequisites.length})</span>
            </span>
          ) : (
            <span
              className="prereq-pill prereq-pill--incomplete"
              title={`Recommended previous: ${missingPrereqNames.join(', ')}`}
            >
              <AlertCircle size={11} />
              <span>Prerequisite Incomplete: {missingPrereqNames[0] || 'Prior topic'}</span>
            </span>
          )}
        </div>
      )}

      {/* Mathematical Foundations Indicator */}
      {topic.requiredMathTopicIds && topic.requiredMathTopicIds.length > 0 && (
        <div className="roadmap-card__prereq-row">
          {isMathPrereqMet ? (
            <button
              type="button"
              className="math-pill math-pill--met"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenMathRequirements) onOpenMathRequirements();
              }}
              title="All required mathematical foundations completed"
            >
              <Check size={11} />
              <span>Math Foundations Ready ({topic.requiredMathTopicIds.length})</span>
            </button>
          ) : (
            <button
              type="button"
              className="math-pill math-pill--incomplete"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenMathRequirements) onOpenMathRequirements();
              }}
              title={`Mathematical foundations needed: ${missingMathNames.join(', ')}`}
            >
              <Calculator size={11} />
              <span>Math Needed: {missingMathNames[0] || 'Foundation'}</span>
            </button>
          )}
        </div>
      )}

      {/* Connected Platform Artifact Badges */}
      <div className="roadmap-card__tools">
        {topic.visualizationIds && topic.visualizationIds.length > 0 && (
          <button
            type="button"
            className="tool-badge tool-badge--viz"
            onClick={(e) => {
              e.stopPropagation();
              onLaunchVisualization(topic.visualizationIds[0]);
            }}
            title="Launch Interactive Visual Studio"
          >
            <Sparkles size={12} />
            <span>Visual Studio</span>
          </button>
        )}

        {topic.dictionaryTerms && topic.dictionaryTerms.length > 0 && (
          <button
            type="button"
            className="tool-badge tool-badge--dict"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDictionary(topic.dictionaryTerms[0]);
            }}
            title="View Dictionary Term"
          >
            <BookA size={12} />
            <span>Dictionary</span>
          </button>
        )}

        {topic.projectIds && topic.projectIds.length > 0 && (
          <button
            type="button"
            className="tool-badge tool-badge--project"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProject(topic.projectIds[0]);
            }}
            title="Open Interactive Lab / Mission"
          >
            <FlaskConical size={12} />
            <span>Lab</span>
          </button>
        )}
      </div>

      {/* Footer Actions */}
      <div className="roadmap-card__footer">
        <button
          type="button"
          className="roadmap-card__start-btn"
          style={{ background: isCompleted ? 'rgba(255,255,255,0.08)' : accentColor }}
          onClick={(e) => {
            e.stopPropagation();
            onStartLesson(topic);
          }}
        >
          <span>{isCompleted ? 'Review Topic' : isInProgress ? 'Continue Learning' : 'Start Learning'}</span>
          <ExternalLink size={13} />
        </button>

        <button
          type="button"
          className="roadmap-card__details-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(topic);
          }}
          title="View Objectives &amp; Connections"
        >
          <span>Details</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
