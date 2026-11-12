import Card from '../common/Card';
import { BookOpen, Layers, Compass, TrendingUp, Database, Brain, Zap } from 'lucide-react';
import './StatsOverview.css';

export default function StatsOverview({
  totalConcepts = 0,
  totalCategories = 0,
  exploredCount = 0,
  progressPercent = 0,
  domainProgress = null,
}) {
  const stats = [
    {
      label: 'Total Concepts',
      value: String(totalConcepts),
      icon: BookOpen,
      color: 'var(--accent-cyan)',
    },
    {
      label: 'Categories',
      value: String(totalCategories),
      icon: Layers,
      color: 'var(--accent-purple)',
    },
    {
      label: 'Concepts Explored',
      value: String(exploredCount),
      icon: Compass,
      color: 'var(--accent-emerald)',
    },
    {
      label: 'Overall Progress',
      value: `${progressPercent}%`,
      icon: TrendingUp,
      color: 'var(--accent-yellow, #FFD928)',
    },
  ];

  const domains = [
    {
      key: 'data-science',
      title: 'Data Science',
      icon: Database,
      accent: 'var(--ds-accent)',
      glow: 'var(--ds-glow)',
      explored: domainProgress?.['data-science']?.explored || 0,
      total: domainProgress?.['data-science']?.total || 10,
    },
    {
      key: 'machine-learning',
      title: 'Machine Learning',
      icon: Brain,
      accent: 'var(--ml-accent)',
      glow: 'var(--ml-glow)',
      explored: domainProgress?.['machine-learning']?.explored || 0,
      total: domainProgress?.['machine-learning']?.total || 21,
    },
    {
      key: 'deep-learning',
      title: 'Deep Learning',
      icon: Zap,
      accent: 'var(--dl-accent)',
      glow: 'var(--dl-glow)',
      explored: domainProgress?.['deep-learning']?.explored || 0,
      total: domainProgress?.['deep-learning']?.total || 8,
    },
  ];

  return (
    <div className="stats-container">
      {/* Primary 4 Metric Cards */}
      <div className="stats-overview">
        {stats.map((stat) => (
          <Card key={stat.label} className="stats-card">
            <div
              className="stats-card__icon-wrap"
              style={{ background: `color-mix(in srgb, ${stat.color} 15%, transparent)` }}
            >
              <stat.icon size={22} style={{ color: stat.color }} />
            </div>
            <div className="stats-card__info">
              <span className="stats-card__value">{stat.value}</span>
              <span className="stats-card__label">{stat.label}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* 3 Domain Progress Indicators */}
      <div className="domain-progress-strip">
        {domains.map((dom) => {
          const pct = Math.round((dom.explored / Math.max(1, dom.total)) * 100);
          return (
            <div
              key={dom.key}
              className="domain-progress-card"
              style={{ '--dom-accent': dom.accent, '--dom-glow': dom.glow }}
            >
              <div className="domain-progress-card__header">
                <div className="domain-progress-card__title-box">
                  <dom.icon size={16} style={{ color: dom.accent }} />
                  <span className="domain-progress-card__name">{dom.title}</span>
                </div>
                <span className="domain-progress-card__count">
                  {dom.explored}/{dom.total} <span className="domain-progress-card__pct">({pct}%)</span>
                </span>
              </div>
              <div className="domain-progress-card__track">
                <div
                  className="domain-progress-card__fill"
                  style={{ width: `${pct}%`, background: dom.accent }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
