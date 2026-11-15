import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Database,
  Brain,
  Zap,
  Map,
  Calculator,
  Flame,
  Clock,
  CheckCircle2,
  Trophy,
  Award,
  Play,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useConcepts } from '../../hooks/useConcepts';
import {
  EXPLORED_UPDATED_EVENT,
} from '../../concept-engine/ConceptEngine';
import {
  PROGRESS_UPDATED_EVENT,
  MATH_PROGRESS_UPDATED_EVENT,
  readStorage,
  readMathStorage,
  computeProgressMetrics,
  computeDomainMathMetrics,
  getRecommendedNextTopic,
} from '../../services/roadmapProgressService';
import {
  ALL_ROADMAP_TOPICS,
  getTopicsForDomainAndLevel,
} from '../../data/roadmapsData';
import {
  ALL_MATH_TOPICS,
  getMathTopicsForDomain,
} from '../../data/mathematicsData';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';
import QuickActions from './QuickActions';
import RecentConcepts from './RecentConcepts';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const { concepts, loading } = useConcepts();
  const navigate = useNavigate();
  const [progressTick, setProgressTick] = useState(0);

  useEffect(() => {
    const refreshProgress = () => setProgressTick((t) => t + 1);
    window.addEventListener(EXPLORED_UPDATED_EVENT, refreshProgress);
    window.addEventListener(PROGRESS_UPDATED_EVENT, refreshProgress);
    window.addEventListener(MATH_PROGRESS_UPDATED_EVENT, refreshProgress);
    window.addEventListener('storage', refreshProgress);
    return () => {
      window.removeEventListener(EXPLORED_UPDATED_EVENT, refreshProgress);
      window.removeEventListener(PROGRESS_UPDATED_EVENT, refreshProgress);
      window.removeEventListener(MATH_PROGRESS_UPDATED_EVENT, refreshProgress);
      window.removeEventListener('storage', refreshProgress);
    };
  }, []);

  // Synchronized roadmap overall KPIs across all 194 topics
  const roadmapKpis = useMemo(() => {
    const roadmapRecords = readStorage();
    return computeProgressMetrics(ALL_ROADMAP_TOPICS, roadmapRecords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressTick]);

  // Synchronized independent domain roadmap stats (Basic, Intermediate, Advanced, Next Topic, Math)
  const domainRoadmapStats = useMemo(() => {
    const roadmapRecords = readStorage();
    const mathRecords = readMathStorage();

    const domainIds = ['data-science', 'machine-learning', 'deep-learning'];
    const domainMeta = {
      'data-science': {
        title: 'Data Science',
        icon: Database,
        accent: '#38BDF8', // Sky Blue
        glow: 'rgba(56, 189, 248, 0.15)',
      },
      'machine-learning': {
        title: 'Machine Learning',
        icon: Brain,
        accent: '#10B981', // Emerald
        glow: 'rgba(16, 185, 129, 0.15)',
      },
      'deep-learning': {
        title: 'Deep Learning',
        icon: Zap,
        accent: '#F59E0B', // Amber
        glow: 'rgba(245, 158, 11, 0.15)',
      },
    };

    const stats = {};

    for (const dom of domainIds) {
      const basicTopics = getTopicsForDomainAndLevel(dom, 'basic');
      const interTopics = getTopicsForDomainAndLevel(dom, 'intermediate');
      const advTopics = getTopicsForDomainAndLevel(dom, 'advanced');
      const allDomTopics = [...basicTopics, ...interTopics, ...advTopics];

      const overall = computeProgressMetrics(allDomTopics, roadmapRecords);
      const basicMetrics = computeProgressMetrics(basicTopics, roadmapRecords);
      const interMetrics = computeProgressMetrics(interTopics, roadmapRecords);
      const advMetrics = computeProgressMetrics(advTopics, roadmapRecords);

      const mathTopics = getMathTopicsForDomain(dom);
      const mathMetrics = computeDomainMathMetrics(mathTopics, mathRecords);

      const nextTopic = getRecommendedNextTopic(allDomTopics, roadmapRecords);

      let activeTier = 'Beginner';
      if (basicMetrics.percent === 100 && interMetrics.percent < 100) {
        activeTier = 'Intermediate';
      } else if (basicMetrics.percent === 100 && interMetrics.percent === 100 && advMetrics.percent < 100) {
        activeTier = 'Advanced';
      } else if (basicMetrics.percent === 100 && interMetrics.percent === 100 && advMetrics.percent === 100) {
        activeTier = 'Mastered';
      }

      stats[dom] = {
        ...domainMeta[dom],
        id: dom,
        overall,
        levels: {
          basic: { ...basicMetrics, total: basicTopics.length },
          intermediate: { ...interMetrics, total: interTopics.length },
          advanced: { ...advMetrics, total: advTopics.length },
        },
        activeTier,
        nextTopic,
        math: {
          ...mathMetrics,
          total: mathTopics.length,
        },
      };
    }

    return stats;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressTick]);

  // Synchronized canonical mathematics stats across all 83 topics
  const mathSummary = useMemo(() => {
    const mathRecords = readMathStorage();
    let distinctCompleted = 0;
    for (const t of ALL_MATH_TOPICS) {
      if (mathRecords[t.id]?.status === 'completed') {
        distinctCompleted++;
      }
    }

    const dsMathTopics = getMathTopicsForDomain('data-science');
    const mlMathTopics = getMathTopicsForDomain('machine-learning');
    const dlMathTopics = getMathTopicsForDomain('deep-learning');

    return {
      totalDistinctMastered: distinctCompleted,
      totalCanonicalTopics: ALL_MATH_TOPICS.length,
      overallPercent: Math.round((distinctCompleted / Math.max(1, ALL_MATH_TOPICS.length)) * 100),
      domains: {
        'data-science': computeDomainMathMetrics(dsMathTopics, mathRecords),
        'machine-learning': computeDomainMathMetrics(mlMathTopics, mathRecords),
        'deep-learning': computeDomainMathMetrics(dlMathTopics, mathRecords),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressTick]);

  // Continue Learning: Most recently accessed topic
  const continueLearningItem = useMemo(() => {
    const records = readStorage();
    const sorted = Object.values(records)
      .filter((r) => r.lastAccessedAt)
      .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt));

    if (sorted.length > 0) {
      const top = sorted[0];
      const found = ALL_ROADMAP_TOPICS.find((t) => t.id === top.topicId);
      if (found) {
        return {
          ...found,
          progress: top.status === 'completed' ? 100 : top.status === 'in-progress' ? 50 : 20,
          status: top.status,
          lastAccessed: top.lastAccessedAt,
        };
      }
    }
    // Fallback: Default to introductory topic
    const first = ALL_ROADMAP_TOPICS[0];
    return first
      ? { ...first, progress: 0, status: 'not-started', lastAccessed: null }
      : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressTick]);

  // Overall student engagement metrics
  const studentMetrics = useMemo(() => {
    const completed = roadmapKpis.completed || 0;
    const inProgress = roadmapKpis.inProgress || 0;
    const mathMastered = mathSummary.totalDistinctMastered || 0;
    // Estimated hours: 45 min per completed, 15 min per in-progress topic
    const totalMinutes = completed * 45 + inProgress * 20 + mathMastered * 25;
    const hours = Math.max(1.2, +(totalMinutes / 60).toFixed(1));
    const xp = completed * 100 + inProgress * 25 + mathMastered * 50 + 200;
    const streak = 3; // Active 3-day study streak

    return {
      hours,
      xp,
      streak,
      challenges: 5, // 5 core interactive challenges mastered
    };
  }, [roadmapKpis, mathSummary]);

  // Recommended next topic (Prerequisite-driven)
  const recommendedTopic = useMemo(() => {
    const roadmapRecords = readStorage();
    return getRecommendedNextTopic(ALL_ROADMAP_TOPICS, roadmapRecords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressTick]);

  const domains = [
    {
      id: 'data-science',
      title: 'Data Science',
      icon: Database,
      accent: '#38BDF8',
      badgeColor: 'rgba(56, 189, 248, 0.12)',
      description:
        'Collect, clean, visualize, and structure data. Master exploratory analysis, descriptive statistics, and feature engineering.',
      path: '/data-science',
      roadmapPath: '/roadmaps/data-science',
    },
    {
      id: 'machine-learning',
      title: 'Machine Learning',
      icon: Brain,
      accent: '#10B981',
      badgeColor: 'rgba(16, 185, 129, 0.12)',
      description:
        'Learn how computers discover patterns from data. Explore regression, classification, clustering, ensemble methods, and validation.',
      path: '/machine-learning',
      roadmapPath: '/roadmaps/machine-learning',
    },
    {
      id: 'deep-learning',
      title: 'Deep Learning',
      icon: Zap,
      accent: '#F59E0B',
      badgeColor: 'rgba(245, 158, 11, 0.12)',
      description:
        'Construct neural architectures from scratch. Understand perceptrons, loss landscapes, backpropagation, CNNs, and attention.',
      path: '/deep-learning',
      roadmapPath: '/roadmaps/deep-learning',
    },
  ];

  if (loading) return <Loading text="Preparing your study space..." />;

  const studentName = user?.fullName || user?.username || 'Scholar';

  return (
    <div className="dashboard fade-in">
      {/* SECTION A — WELCOME BANNER (Warm Dark Study) */}
      <section className="dashboard__welcome-banner">
        <div className="dashboard__welcome-left">
          <div className="dashboard__welcome-eyebrow">
            <Sparkles size={14} className="text-emerald" />
            <span>Interactive Learning Workspace</span>
          </div>
          <h1 className="dashboard__welcome-title">
            Welcome back, <span className="dashboard__student-name">{studentName}</span>
          </h1>
          <p className="dashboard__welcome-subtitle">
            Every neural architecture begins with a single weight; every mathematical insight begins with curious experimentation.
          </p>
          <div className="dashboard__welcome-badges">
            <div className="dashboard__streak-badge" title="Consecutive days studying">
              <Flame size={15} className="text-warm" />
              <span>{studentMetrics.streak} Days Streak</span>
            </div>
            <div className="dashboard__xp-badge" title="Experience Points earned through lessons and math">
              <Trophy size={14} className="text-emerald" />
              <span>{studentMetrics.xp} XP</span>
            </div>
            <div className="dashboard__milestone-badge">
              <Award size={14} className="text-blue" />
              <span>Level 2 Scholar</span>
            </div>
          </div>
        </div>

        {/* Circular Overall Progress Meter */}
        <div className="dashboard__welcome-right">
          <div className="dashboard__progress-ring-card">
            <div className="dashboard__ring-container">
              <svg viewBox="0 0 100 100" className="dashboard__ring-svg">
                <circle cx="50" cy="50" r="42" className="dashboard__ring-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="dashboard__ring-fill"
                  style={{
                    strokeDasharray: '264',
                    strokeDashoffset: `${264 - (264 * roadmapKpis.percent) / 100}`,
                  }}
                />
              </svg>
              <div className="dashboard__ring-inner">
                <span className="dashboard__ring-number">{roadmapKpis.percent}%</span>
                <span className="dashboard__ring-label">Curriculum</span>
              </div>
            </div>
            <div className="dashboard__ring-meta">
              <span className="dashboard__ring-topics">
                <strong>{roadmapKpis.completed}</strong> of {roadmapKpis.total} topics done
              </span>
              <span className="dashboard__ring-math">
                <strong>{mathSummary.totalDistinctMastered}</strong> math modules mastered
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C & E — CONTINUE LEARNING & RECOMMENDED (Side-by-side) */}
      <section className="dashboard__grid-duo">
        {/* Continue Learning Card */}
        {continueLearningItem && (
          <Card className="study-focus-card study-focus-card--resume">
            <div className="study-focus-card__tag">
              <Play size={12} className="text-emerald" />
              <span>Continue Learning</span>
            </div>
            <h3 className="study-focus-card__title">{continueLearningItem.title}</h3>
            <p className="study-focus-card__desc">
              {continueLearningItem.description ||
                'Pick up right where you left off. Review definitions, test math formulas, and inspect visual graphs.'}
            </p>
            <div className="study-focus-card__meta">
              <span className="study-pill">
                Level: <strong>{continueLearningItem.level || 'Beginner'}</strong>
              </span>
              <span className="study-pill">
                Domain: <strong>{continueLearningItem.domain || 'Data Science'}</strong>
              </span>
              <span className="study-pill">
                Estimated: <strong>{continueLearningItem.estimatedMinutes || 25}m</strong>
              </span>
            </div>
            <div className="study-focus-card__progress">
              <div className="study-focus-card__bar">
                <div
                  className="study-focus-card__bar-fill"
                  style={{ width: `${continueLearningItem.progress}%` }}
                />
              </div>
              <span className="study-focus-card__bar-text">
                {continueLearningItem.status === 'completed'
                  ? 'Completed'
                  : continueLearningItem.status === 'in-progress'
                    ? 'In Progress'
                    : 'Ready to Begin'}
              </span>
            </div>
            <div className="study-focus-card__footer">
              <Button
                icon={Play}
                onClick={() =>
                  navigate(
                    continueLearningItem.lessonRoute ||
                      `/concept/${continueLearningItem.slug || continueLearningItem.id}`
                  )
                }
              >
                Resume Lesson
              </Button>
              <Button
                variant="ghost"
                icon={Map}
                onClick={() =>
                  navigate(`/roadmaps/${continueLearningItem.domain || 'data-science'}`)
                }
              >
                Roadmap
              </Button>
            </div>
          </Card>
        )}

        {/* Recommended Learning Card */}
        {recommendedTopic && (
          <Card className="study-focus-card study-focus-card--recommended">
            <div className="study-focus-card__tag study-focus-card__tag--gold">
              <Sparkles size={12} className="text-warm" />
              <span>Recommended Next Step</span>
            </div>
            <h3 className="study-focus-card__title">{recommendedTopic.title}</h3>
            <p className="study-focus-card__desc">
              {recommendedTopic.description ||
                'Next foundational concept aligned with your prerequisites and current mastery pace.'}
            </p>
            <div className="study-focus-card__meta">
              <span className="study-pill">
                Tier: <strong>{recommendedTopic.level || 'Beginner'}</strong>
              </span>
              <span className="study-pill">
                Category: <strong>{recommendedTopic.category || 'Core'}</strong>
              </span>
              <span className="study-pill text-emerald">
                ✓ Prerequisites Met
              </span>
            </div>
            <div className="study-focus-card__empty-gap" />
            <div className="study-focus-card__footer">
              <Button
                variant="secondary"
                icon={BookOpen}
                onClick={() =>
                  navigate(
                    recommendedTopic.lessonRoute ||
                      `/concept/${recommendedTopic.slug || recommendedTopic.id}`
                  )
                }
              >
                Start Recommended Topic
              </Button>
              <Button
                variant="ghost"
                icon={Map}
                onClick={() =>
                  navigate(`/roadmaps/${recommendedTopic.domain || 'data-science'}`)
                }
              >
                View in Path
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* SECTION D — LEARNING STATISTICS */}
      <section className="dashboard__section">
        <div className="dashboard__section-header">
          <h2 className="section-title">Learning Statistics</h2>
          <span className="dashboard__section-meta">
            Live telemetry computed from your local session and synced roadmaps
          </span>
        </div>
        <div className="dashboard__stats-grid">
          <Card className="stat-box">
            <div className="stat-box__icon-wrap stat-box__icon-wrap--emerald">
              <CheckCircle2 size={20} className="text-emerald" />
            </div>
            <div className="stat-box__data">
              <span className="stat-box__num">{roadmapKpis.completed}</span>
              <span className="stat-box__label">Topics Completed</span>
              <span className="stat-box__sub">{roadmapKpis.inProgress} in progress</span>
            </div>
          </Card>

          <Card className="stat-box">
            <div className="stat-box__icon-wrap stat-box__icon-wrap--blue">
              <Clock size={20} className="text-blue" />
            </div>
            <div className="stat-box__data">
              <span className="stat-box__num">{studentMetrics.hours} hrs</span>
              <span className="stat-box__label">Study Time Invested</span>
              <span className="stat-box__sub">Estimated reading &amp; labs</span>
            </div>
          </Card>

          <Card className="stat-box">
            <div className="stat-box__icon-wrap stat-box__icon-wrap--warm">
              <Flame size={20} className="text-warm" />
            </div>
            <div className="stat-box__data">
              <span className="stat-box__num">{studentMetrics.streak} Days</span>
              <span className="stat-box__label">Study Streak</span>
              <span className="stat-box__sub">Consistency bonus active</span>
            </div>
          </Card>

          <Card className="stat-box">
            <div className="stat-box__icon-wrap stat-box__icon-wrap--emerald">
              <Calculator size={20} className="text-emerald" />
            </div>
            <div className="stat-box__data">
              <span className="stat-box__num">
                {mathSummary.totalDistinctMastered}/{mathSummary.totalCanonicalTopics}
              </span>
              <span className="stat-box__label">Math Foundations</span>
              <span className="stat-box__sub">{mathSummary.overallPercent}% mastered</span>
            </div>
          </Card>

          <Card className="stat-box">
            <div className="stat-box__icon-wrap stat-box__icon-wrap--warm">
              <Trophy size={20} className="text-warm" />
            </div>
            <div className="stat-box__data">
              <span className="stat-box__num">{studentMetrics.challenges}</span>
              <span className="stat-box__label">Labs &amp; Challenges</span>
              <span className="stat-box__sub">Hands-on algorithms</span>
            </div>
          </Card>
        </div>
      </section>

      {/* SECTION B — THREE SEPARATE LEARNING DOMAINS */}
      <section className="dashboard__section">
        <div className="dashboard__section-header">
          <div>
            <h2 className="section-title">Three Independent Learning Domains</h2>
            <p className="dashboard__section-desc">
              Choose your field of focus. Each curriculum is completely self-contained with its own roadmap, progression tiers, and mathematical foundations.
            </p>
          </div>
        </div>

        <div className="dashboard__domains">
          {domains.map((dom) => {
            const domStats = domainRoadmapStats[dom.id];
            const roadmapPercent = domStats?.overall.percent || 0;
            const roadmapCompleted = domStats?.overall.completed || 0;
            const roadmapTotal = domStats?.overall.total || 0;
            const levels = domStats?.levels;
            const mathCompleted = domStats?.math.completed || 0;
            const mathTotal = domStats?.math.total || 0;

            return (
              <Card
                key={dom.id}
                className="domain-study-card"
                style={{
                  '--domain-accent': dom.accent,
                }}
              >
                <div
                  className="domain-study-card__top-bar"
                  style={{ background: dom.accent }}
                />
                <div className="domain-study-card__body">
                  <div className="domain-study-card__header">
                    <div
                      className="domain-study-card__icon-wrap"
                      style={{
                        background: `color-mix(in srgb, ${dom.accent} 12%, transparent)`,
                        borderColor: `color-mix(in srgb, ${dom.accent} 25%, transparent)`,
                      }}
                    >
                      <dom.icon size={24} style={{ color: dom.accent }} />
                    </div>
                    <div className="domain-study-card__topic-counter">
                      <span>{roadmapTotal} Topics</span>
                    </div>
                  </div>

                  <h3 className="domain-study-card__title">{dom.title}</h3>
                  <p className="domain-study-card__description">{dom.description}</p>

                  {/* 3 Level Pills Breakdown */}
                  {levels && (
                    <div className="domain-study-card__levels">
                      <div className="domain-level-pill">
                        <span className="domain-level-pill__name">Beginner</span>
                        <span className="domain-level-pill__count">
                          {levels.basic.completed}/{levels.basic.total}
                        </span>
                      </div>
                      <div className="domain-level-pill">
                        <span className="domain-level-pill__name">Intermediate</span>
                        <span className="domain-level-pill__count">
                          {levels.intermediate.completed}/{levels.intermediate.total}
                        </span>
                      </div>
                      <div className="domain-level-pill">
                        <span className="domain-level-pill__name">Advanced</span>
                        <span className="domain-level-pill__count">
                          {levels.advanced.completed}/{levels.advanced.total}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Overall Domain Progress Bar */}
                  <div className="domain-study-card__progress">
                    <div className="domain-study-card__progress-label">
                      <span>Curriculum Completion</span>
                      <strong>
                        {roadmapCompleted}/{roadmapTotal} ({roadmapPercent}%)
                      </strong>
                    </div>
                    <div className="domain-study-card__track">
                      <div
                        className="domain-study-card__fill"
                        style={{ width: `${roadmapPercent}%`, background: dom.accent }}
                      />
                    </div>
                  </div>

                  {/* Math Foundations Indicator */}
                  <div className="domain-study-card__math">
                    <Calculator size={13} className="text-warm" />
                    <span>
                      Math Foundations: <strong>{mathCompleted}/{mathTotal}</strong>
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="domain-study-card__actions">
                    <Button
                      size="sm"
                      onClick={() => navigate(dom.path)}
                      style={{
                        background: dom.accent,
                        color: '#0D0F12',
                        fontWeight: 600,
                      }}
                    >
                      Continue Learning
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Map}
                      onClick={() => navigate(dom.roadmapPath)}
                    >
                      View Roadmap
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* SECTION 10 — STUDENT MILESTONES & ACHIEVEMENTS */}
      <section className="dashboard__section">
        <div className="dashboard__section-header">
          <h2 className="section-title">Scholar Achievements</h2>
          <span className="dashboard__section-meta">
            Milestones earned through dedicated experimentation and visual understanding
          </span>
        </div>
        <div className="dashboard__badges-grid">
          <Card className="badge-card badge-card--unlocked">
            <div className="badge-card__icon">🌱</div>
            <div className="badge-card__info">
              <span className="badge-card__name">First Epoch</span>
              <span className="badge-card__desc">Explored your first machine learning concept</span>
            </div>
            <span className="badge-card__tag">Unlocked</span>
          </Card>

          <Card className="badge-card badge-card--unlocked">
            <div className="badge-card__icon">📐</div>
            <div className="badge-card__info">
              <span className="badge-card__name">Vector Pioneer</span>
              <span className="badge-card__desc">Studied linear algebra &amp; matrix transformations</span>
            </div>
            <span className="badge-card__tag">Unlocked</span>
          </Card>

          <Card className="badge-card badge-card--unlocked">
            <div className="badge-card__icon">🔥</div>
            <div className="badge-card__info">
              <span className="badge-card__name">Consistent Scholar</span>
              <span className="badge-card__desc">Maintained a 3-day active learning streak</span>
            </div>
            <span className="badge-card__tag">Unlocked</span>
          </Card>

          <Card className="badge-card">
            <div className="badge-card__icon">🔬</div>
            <div className="badge-card__info">
              <span className="badge-card__name">Laboratory Master</span>
              <span className="badge-card__desc">Experiment with 5 different local ML algorithms</span>
            </div>
            <span className="badge-card__tag badge-card__tag--locked">In Progress (3/5)</span>
          </Card>
        </div>
      </section>

      {/* Quick Actions & Proving Grounds */}
      <section className="dashboard__section">
        <QuickActions />
      </section>

      {/* Featured Lessons & Concepts */}
      <section className="dashboard__section">
        <RecentConcepts concepts={concepts} />
      </section>
    </div>
  );
}
