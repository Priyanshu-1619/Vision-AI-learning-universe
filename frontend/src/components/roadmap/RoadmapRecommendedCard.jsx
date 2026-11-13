import { Sparkles, ArrowRight, Clock, BookOpen, Layers } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function RoadmapRecommendedCard({
  topic,
  status = 'not-started',
  accentColor = 'var(--ds-accent, #06b6d4)',
  onOpenTopic,
  onStartLearning,
}) {
  if (!topic) return null;

  const isStarted = status === 'in-progress';

  return (
    <section className="roadmap-recommended fade-in">
      <Card className="recommended-card" hoverable={false}>
        <div className="recommended-card__head">
          <div className="recommended-card__badge-row">
            <div className="recommended-card__badge">
              <Sparkles size={14} style={{ color: accentColor }} />
              <span>Recommended Next Step</span>
            </div>
            <span className="recommended-card__reason">
              {isStarted ? '⚡ In Progress — Continue where you left off' : '✓ Prerequisites Satisfied — Ready to learn'}
            </span>
          </div>

          <div className="recommended-card__meta-tags">
            <Badge text={topic.category} color={accentColor} size="sm" />
            <Badge text={topic.difficulty} color="#3b82f6" size="sm" />
          </div>
        </div>

        <div className="recommended-card__body">
          <div className="recommended-card__content">
            <h3 className="recommended-card__title">{topic.title}</h3>
            <p className="recommended-card__description">{topic.description}</p>

            <div className="recommended-card__details-row">
              <span className="detail-item">
                <Clock size={13} />
                <span>{topic.estimatedMinutes} mins estimated</span>
              </span>
              {topic.prerequisites && topic.prerequisites.length > 0 && (
                <span className="detail-item">
                  <Layers size={13} />
                  <span>{topic.prerequisites.length} prerequisite(s) completed</span>
                </span>
              )}
            </div>
          </div>

          <div className="recommended-card__actions">
            <Button
              icon={ArrowRight}
              onClick={() => onStartLearning(topic)}
              style={{ background: accentColor, color: '#050814' }}
            >
              {isStarted ? 'Continue Learning' : 'Start Topic'}
            </Button>
            <Button
              variant="secondary"
              icon={BookOpen}
              onClick={() => onOpenTopic(topic)}
            >
              Topic Objectives
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}

