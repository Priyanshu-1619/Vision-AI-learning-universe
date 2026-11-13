import { ArrowRight } from 'lucide-react';
import Card from '../common/Card';

const LEVEL_DESCRIPTIONS = {
  basic: {
    name: 'Basic Foundations',
    subtitle: 'Core terminology, fundamental intuitions, and essential tooling.',
  },
  intermediate: {
    name: 'Intermediate Core',
    subtitle: 'Mathematical formulations, algorithmic pipelines, and evaluation metrics.',
  },
  advanced: {
    name: 'Advanced Specialization',
    subtitle: 'Production architectures, optimization, MLOps, and real-world projects.',
  },
};

export default function RoadmapLevelSelector({
  selectedLevel,
  onSelectLevel,
  levelMetrics,
  accentColor = 'var(--ds-accent, #06b6d4)',
}) {
  const levels = ['basic', 'intermediate', 'advanced'];

  return (
    <section className="roadmap-level-selector">
      <div className="roadmap-level-selector__header">
        <h2 className="section-title">Proficiency Tiers</h2>
        <span className="roadmap-level-selector__hint">
          Learners may begin at any level or navigate freely between tiers.
        </span>
      </div>

      <div className="roadmap-level-grid">
        {levels.map((lvl) => {
          const isSelected = selectedLevel === lvl;
          const info = LEVEL_DESCRIPTIONS[lvl];
          const metrics = levelMetrics[lvl] || { total: 0, completed: 0, inProgress: 0, percent: 0 };

          return (
            <Card
              key={lvl}
              className={`roadmap-level-card ${isSelected ? 'roadmap-level-card--active' : ''}`}
              onClick={() => onSelectLevel(lvl)}
              hoverable={true}
            >
              <div className="roadmap-level-card__header">
                <div className="roadmap-level-card__title-box">
                  <h3 className="roadmap-level-card__name">{info.name}</h3>
                  <span className="roadmap-level-card__count">{metrics.total} Topics</span>
                </div>
                {isSelected && (
                  <span className="roadmap-level-card__active-badge" style={{ background: accentColor }}>
                    Active Tier
                  </span>
                )}
              </div>

              <p className="roadmap-level-card__desc">{info.subtitle}</p>

              <div className="roadmap-level-card__progress">
                <div className="roadmap-level-card__progress-labels">
                  <span>Completed: <strong>{metrics.completed}/{metrics.total}</strong></span>
                  <span className="roadmap-level-card__percent">{metrics.percent}%</span>
                </div>
                <div className="roadmap-level-card__track">
                  <div
                    className="roadmap-level-card__fill"
                    style={{ width: `${metrics.percent}%`, background: accentColor }}
                  />
                </div>
              </div>

              <div className="roadmap-level-card__footer">
                <span className="roadmap-level-card__cta">
                  {isSelected ? 'Currently Exploring' : 'Explore Tier'}
                  <ArrowRight size={14} />
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
