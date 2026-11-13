import { useNavigate } from 'react-router-dom';
import {
  Map,
  CheckCircle2,
  Calculator,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Database,
  Brain,
  Zap,
  Play,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import './StatsOverview.css';

export default function StatsOverview({
  totalConcepts = 0,
  totalCategories = 0,
  exploredCount = 0,
  progressPercent = 0,
  domainProgress = null,
  domainRoadmapStats = null,
  mathSummary = null,
  roadmapKpis = null,
}) {
  const navigate = useNavigate();

  // Primary 4 KPIs: Use synchronized roadmap & math metrics if provided, fallback to concepts
  const kpis = [
    {
      label: 'Curriculum Topics',
      value: roadmapKpis ? String(roadmapKpis.total) : String(totalConcepts),
      sublabel: 'Across 3 Independent Domains',
      icon: Map,
      color: 'var(--accent-cyan, #06B6D4)',
    },
    {
      label: 'Topics Completed',
      value: roadmapKpis ? String(roadmapKpis.completed) : String(exploredCount),
      sublabel: roadmapKpis ? `${roadmapKpis.inProgress} currently in progress` : `${totalCategories} categories`,
      icon: CheckCircle2,
      color: 'var(--accent-emerald, #10B981)',
    },
    {
      label: 'Mathematics Foundations',
      value: mathSummary
        ? `${mathSummary.totalDistinctMastered}/${mathSummary.totalCanonicalTopics}`
        : '0/83',
      sublabel: mathSummary ? `${mathSummary.overallPercent}% Mastered` : 'Prerequisites',
      icon: Calculator,
      color: 'var(--accent-yellow, #FACC15)',
    },
    {
      label: 'Roadmap Mastery',
      value: roadmapKpis ? `${roadmapKpis.percent}%` : `${progressPercent}%`,
      sublabel: 'Basic • Inter • Adv Tiers',
      icon: TrendingUp,
      color: 'var(--accent-blue, #164BFF)',
    },
  ];

  const domainsList = [
    {
      key: 'data-science',
      title: 'Data Science',
      icon: Database,
      accent: 'var(--ds-accent, #06b6d4)',
      glow: 'var(--ds-glow, rgba(6, 182, 212, 0.15))',
      stats: domainRoadmapStats?.['data-science'],
      fallbackExplored: domainProgress?.['data-science']?.explored || 0,
      fallbackTotal: domainProgress?.['data-science']?.total || 10,
    },
    {
      key: 'machine-learning',
      title: 'Machine Learning',
      icon: Brain,
      accent: 'var(--ml-accent, #8b5cf6)',
      glow: 'var(--ml-glow, rgba(139, 92, 246, 0.15))',
      stats: domainRoadmapStats?.['machine-learning'],
      fallbackExplored: domainProgress?.['machine-learning']?.explored || 0,
      fallbackTotal: domainProgress?.['machine-learning']?.total || 21,
    },
    {
      key: 'deep-learning',
      title: 'Deep Learning',
      icon: Zap,
      accent: 'var(--dl-accent, #f59e0b)',
      glow: 'var(--dl-glow, rgba(245, 158, 11, 0.15))',
      stats: domainRoadmapStats?.['deep-learning'],
      fallbackExplored: domainProgress?.['deep-learning']?.explored || 0,
      fallbackTotal: domainProgress?.['deep-learning']?.total || 8,
    },
  ];

  return (
    <div className="stats-container">
      {/* 4 Synchronized KPI Metric Cards */}
      <div className="stats-overview">
        {kpis.map((stat) => (
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
              {stat.sublabel && (
                <span className="stats-card__sublabel">{stat.sublabel}</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* 3 Domain Independent Roadmap Cards */}
      <div className="domain-roadmaps-section">
        <div className="domain-roadmaps-header">
          <div className="domain-roadmaps-header__left">
            <Sparkles size={16} className="domain-roadmaps-header__icon" />
            <h3 className="domain-roadmaps-title">Domain Roadmap Progress</h3>
          </div>
          <span className="domain-roadmaps-subtitle">
            Track Basic, Intermediate, Advanced tiers and independent Mathematics prerequisites
          </span>
        </div>

        <div className="domain-roadmaps-grid">
          {domainsList.map((dom) => {
            const hasStats = Boolean(dom.stats);
            const completed = hasStats
              ? dom.stats.overall.completed
              : dom.fallbackExplored;
            const total = hasStats
              ? dom.stats.overall.total
              : dom.fallbackTotal;
            const percent = hasStats
              ? dom.stats.overall.percent
              : Math.round((completed / Math.max(1, total)) * 100);

            const activeTier = dom.stats?.activeTier || 'Basic';
            const levels = dom.stats?.levels;
            const math = dom.stats?.math;
            const nextTopic = dom.stats?.nextTopic;

            return (
              <div
                key={dom.key}
                className="domain-roadmap-card"
                style={{
                  '--dom-accent': dom.accent,
                  '--dom-glow': dom.glow,
                }}
              >
                {/* Header */}
                <div className="domain-roadmap-card__head">
                  <div className="domain-roadmap-card__title-row">
                    <div
                      className="domain-roadmap-card__icon-wrap"
                      style={{
                        background: `color-mix(in srgb, ${dom.accent} 15%, transparent)`,
                        borderColor: `color-mix(in srgb, ${dom.accent} 30%, transparent)`,
                      }}
                    >
                      <dom.icon size={18} style={{ color: dom.accent }} />
                    </div>
                    <div>
                      <h4 className="domain-roadmap-card__title">{dom.title}</h4>
                      <span className="domain-roadmap-card__tier-tag">
                        {activeTier === 'Mastered' ? 'Domain Mastered' : `${activeTier} Tier Active`}
                      </span>
                    </div>
                  </div>

                  <Badge
                    text={`${percent}%`}
                    color={dom.accent}
                    variant={percent === 100 ? 'default' : 'subtle'}
                    size="sm"
                  />
                </div>

                {/* Overall Progress Meter */}
                <div className="domain-roadmap-card__meter-block">
                  <div className="domain-roadmap-card__meter-meta">
                    <span className="domain-roadmap-card__meter-label">Overall Curriculum</span>
                    <span className="domain-roadmap-card__meter-val">
                      {completed}/{total} Topics
                    </span>
                  </div>
                  <div className="domain-roadmap-card__track">
                    <div
                      className="domain-roadmap-card__fill"
                      style={{ width: `${percent}%`, background: dom.accent }}
                    />
                  </div>
                </div>

                {/* Tier Breakdown (Basic, Intermediate, Advanced) */}
                {levels && (
                  <div className="domain-roadmap-card__tiers">
                    <div className="tier-col">
                      <span className="tier-col__name">Basic</span>
                      <div className="tier-col__bar">
                        <div
                          className="tier-col__fill"
                          style={{
                            width: `${levels.basic.percent}%`,
                            background: dom.accent,
                          }}
                        />
                      </div>
                      <span className="tier-col__stat">
                        {levels.basic.completed}/{levels.basic.total}
                      </span>
                    </div>

                    <div className="tier-col">
                      <span className="tier-col__name">Inter</span>
                      <div className="tier-col__bar">
                        <div
                          className="tier-col__fill"
                          style={{
                            width: `${levels.intermediate.percent}%`,
                            background: dom.accent,
                          }}
                        />
                      </div>
                      <span className="tier-col__stat">
                        {levels.intermediate.completed}/{levels.intermediate.total}
                      </span>
                    </div>

                    <div className="tier-col">
                      <span className="tier-col__name">Adv</span>
                      <div className="tier-col__bar">
                        <div
                          className="tier-col__fill"
                          style={{
                            width: `${levels.advanced.percent}%`,
                            background: dom.accent,
                          }}
                        />
                      </div>
                      <span className="tier-col__stat">
                        {levels.advanced.completed}/{levels.advanced.total}
                      </span>
                    </div>
                  </div>
                )}

                {/* Mathematics Foundations Status Pill */}
                {math && (
                  <div className="domain-roadmap-card__math-strip">
                    <div className="domain-roadmap-card__math-info">
                      <Calculator size={14} className="domain-roadmap-card__math-icon" />
                      <span className="domain-roadmap-card__math-text">
                        Math Requirements: <strong>{math.completed}/{math.total}</strong>
                      </span>
                    </div>
                    <span className="domain-roadmap-card__math-pct">
                      {math.percent}%
                    </span>
                  </div>
                )}

                {/* Recommended Next Step Callout */}
                {nextTopic ? (
                  <div
                    className="domain-roadmap-card__next-box"
                    onClick={() => navigate(`/roadmaps/${dom.key}`)}
                    title={`Continue to ${nextTopic.title}`}
                  >
                    <div className="domain-roadmap-card__next-head">
                      <Play size={11} className="domain-roadmap-card__next-icon" />
                      <span className="domain-roadmap-card__next-title-tag">Recommended Next</span>
                      <span className="domain-roadmap-card__next-time">
                        {nextTopic.estimatedMinutes || 25}m
                      </span>
                    </div>
                    <span className="domain-roadmap-card__next-topic-name">
                      {nextTopic.title}
                    </span>
                  </div>
                ) : (
                  <div className="domain-roadmap-card__completed-box">
                    <CheckCircle2 size={13} className="text-emerald" />
                    <span>All domain roadmap topics completed!</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="domain-roadmap-card__actions">
                  <Button
                    size="sm"
                    icon={Map}
                    onClick={() => navigate(`/roadmaps/${dom.key}`)}
                    style={{ background: dom.accent, color: '#050814', fontWeight: 600 }}
                  >
                    Open Roadmap
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={ArrowRight}
                    onClick={() => navigate(`/${dom.key}`)}
                  >
                    Explore Domain
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mathematics Foundations Overview Panel */}
      {mathSummary && (
        <Card className="math-overview-panel">
          <div className="math-overview-panel__head">
            <div className="math-overview-panel__left">
              <div className="math-overview-panel__icon-box">
                <Calculator size={22} className="text-yellow" />
              </div>
              <div>
                <h3 className="math-overview-panel__title">
                  Curriculum Mathematical Foundations
                </h3>
                <p className="math-overview-panel__desc">
                  Canonical mathematics prerequisites across Algebra, Statistics, Linear Algebra, Calculus, and Optimization
                </p>
              </div>
            </div>

            <div className="math-overview-panel__right">
              <Button
                size="sm"
                icon={Calculator}
                onClick={() => navigate('/mathematics')}
              >
                Launch Mathematics Studio
              </Button>
            </div>
          </div>

          <div className="math-overview-panel__grid">
            <div className="math-meter-item">
              <div className="math-meter-item__header">
                <span className="math-meter-item__domain text-ds">Data Science Math</span>
                <span className="math-meter-item__stat">
                  {mathSummary.domains['data-science']?.completed || 0} /{' '}
                  {mathSummary.domains['data-science']?.total || 39} ({mathSummary.domains['data-science']?.percent || 0}%)
                </span>
              </div>
              <div className="math-meter-item__track">
                <div
                  className="math-meter-item__fill"
                  style={{
                    width: `${mathSummary.domains['data-science']?.percent || 0}%`,
                    background: 'var(--ds-accent, #06b6d4)',
                  }}
                />
              </div>
              <span className="math-meter-item__sub">
                Arithmetic, Descriptive Statistics &amp; Probability
              </span>
            </div>

            <div className="math-meter-item">
              <div className="math-meter-item__header">
                <span className="math-meter-item__domain text-ml">Machine Learning Math</span>
                <span className="math-meter-item__stat">
                  {mathSummary.domains['machine-learning']?.completed || 0} /{' '}
                  {mathSummary.domains['machine-learning']?.total || 47} ({mathSummary.domains['machine-learning']?.percent || 0}%)
                </span>
              </div>
              <div className="math-meter-item__track">
                <div
                  className="math-meter-item__fill"
                  style={{
                    width: `${mathSummary.domains['machine-learning']?.percent || 0}%`,
                    background: 'var(--ml-accent, #8b5cf6)',
                  }}
                />
              </div>
              <span className="math-meter-item__sub">
                Vectors, Matrices, Gradients &amp; Optimization
              </span>
            </div>

            <div className="math-meter-item">
              <div className="math-meter-item__header">
                <span className="math-meter-item__domain text-dl">Deep Learning Math</span>
                <span className="math-meter-item__stat">
                  {mathSummary.domains['deep-learning']?.completed || 0} /{' '}
                  {mathSummary.domains['deep-learning']?.total || 47} ({mathSummary.domains['deep-learning']?.percent || 0}%)
                </span>
              </div>
              <div className="math-meter-item__track">
                <div
                  className="math-meter-item__fill"
                  style={{
                    width: `${mathSummary.domains['deep-learning']?.percent || 0}%`,
                    background: 'var(--dl-accent, #f59e0b)',
                  }}
                />
              </div>
              <span className="math-meter-item__sub">
                Tensors, Backpropagation, Chain Rule &amp; Losses
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
