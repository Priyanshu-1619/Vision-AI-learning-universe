import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Network,
  Sparkles,
  Database,
  Brain,
  Zap,
  ArrowRight,
  BookA,
  Map,
  Calculator,
} from 'lucide-react';
import { useConcepts } from '../../hooks/useConcepts';
import { fetchCategories, fetchDictionary } from '../../api/client';
import {
  EXPLORED_UPDATED_EVENT,
  MOCK_CATEGORIES,
  getProgressStats,
  getExploredIds,
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
import StatsOverview from './StatsOverview';
import RecentConcepts from './RecentConcepts';
import QuickActions from './QuickActions';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';
import './Dashboard.css';

export default function Dashboard() {
  const { concepts, loading } = useConcepts();
  const navigate = useNavigate();
  const [apiCategories, setApiCategories] = useState(null);
  const [domainCounts, setDomainCounts] = useState(null);
  const [progressTick, setProgressTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchCategories().then((data) => {
      if (!cancelled && Array.isArray(data) && data.length > 0) {
        setApiCategories(data);
      }
    });

    fetchDictionary().then((res) => {
      if (!cancelled && res?.domainCounts) {
        setDomainCounts(res.domainCounts);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const totalCategoriesCount = useMemo(() => {
    if (apiCategories && apiCategories.length > 0) return apiCategories.length;
    return MOCK_CATEGORIES.length;
  }, [apiCategories]);

  // Concept engine stats (legacy 39 concepts tracker)
  const progress = useMemo(() => {
    const validIds = new Set(concepts.map((c) => c.id));
    return getProgressStats(concepts.length, validIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concepts, progressTick]);

  const domainProgress = useMemo(() => {
    const explored = new Set(getExploredIds());
    const result = {
      'data-science': { explored: 0, total: domainCounts?.['data-science'] || 10 },
      'machine-learning': { explored: 0, total: domainCounts?.['machine-learning'] || 21 },
      'deep-learning': { explored: 0, total: domainCounts?.['deep-learning'] || 8 },
    };

    let dsCount = 0;
    let mlCount = 0;
    let dlCount = 0;

    for (const c of concepts) {
      const dom = c.domain || (c.category === 'Deep Learning' ? 'deep-learning' : ['Foundations', 'Mathematics', 'Data Science'].includes(c.category) ? 'data-science' : 'machine-learning');
      if (dom === 'data-science') dsCount++;
      else if (dom === 'deep-learning') dlCount++;
      else mlCount++;

      if (explored.has(c.id) && result[dom]) {
        result[dom].explored++;
      }
    }

    if (dsCount > 0) result['data-science'].total = dsCount;
    if (mlCount > 0) result['machine-learning'].total = mlCount;
    if (dlCount > 0) result['deep-learning'].total = dlCount;

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concepts, domainCounts, progressTick]);

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
        accent: 'var(--ds-accent)',
        glow: 'var(--ds-glow)',
      },
      'machine-learning': {
        title: 'Machine Learning',
        icon: Brain,
        accent: 'var(--ml-accent)',
        glow: 'var(--ml-glow)',
      },
      'deep-learning': {
        title: 'Deep Learning',
        icon: Zap,
        accent: 'var(--dl-accent)',
        glow: 'var(--dl-glow)',
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

      let activeTier = 'Basic';
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

  const domains = [
    {
      id: 'data-science',
      title: 'Data Science',
      icon: Database,
      accent: 'var(--ds-accent)',
      glow: 'var(--ds-glow)',
      count: domainProgress['data-science'].total,
      description:
        'Learn to collect, analyze, visualize, and prepare data. Master statistics, probability, and feature engineering.',
      path: '/data-science',
      roadmapPath: '/roadmaps/data-science',
    },
    {
      id: 'machine-learning',
      title: 'Machine Learning',
      icon: Brain,
      accent: 'var(--ml-accent)',
      glow: 'var(--ml-glow)',
      count: domainProgress['machine-learning'].total,
      description:
        'Understand how machines learn patterns from data. Explore regression, classification, clustering, and optimization.',
      path: '/machine-learning',
      roadmapPath: '/roadmaps/machine-learning',
    },
    {
      id: 'deep-learning',
      title: 'Deep Learning',
      icon: Zap,
      accent: 'var(--dl-accent)',
      glow: 'var(--dl-glow)',
      count: domainProgress['deep-learning'].total,
      description:
        'Explore neural networks and advanced architectures. From perceptrons to transformers, with interactive visualizations.',
      path: '/deep-learning',
      roadmapPath: '/roadmaps/deep-learning',
    },
  ];

  if (loading) return <Loading text="Initializing AI Universe..." />;

  return (
    <div className="dashboard fade-in">
      {/* Hero */}
      <section className="dashboard__hero">
        <div className="dashboard__hero-content">
          <div className="dashboard__hero-eyebrow">
            <Sparkles size={14} />
            <span>Interactive AI &amp; Machine Learning Laboratory</span>
          </div>
          <h1 className="dashboard__hero-title">
            Welcome to <span className="gradient-text">AI Learning Universe</span>
          </h1>
          <p className="dashboard__hero-subtitle">
            Explore machine learning concepts through interactive visualizations,
            mathematical intuition, and structured independent roadmaps.
          </p>
          <div className="dashboard__hero-actions">
            <Button icon={Map} onClick={() => navigate('/roadmaps/data-science')}>
              Learning Roadmaps
            </Button>
            <Button variant="secondary" icon={Network} onClick={() => navigate('/knowledge-graph')}>
              Knowledge Graph
            </Button>
            <Button variant="secondary" icon={BookA} onClick={() => navigate('/dictionary')}>
              AI Dictionary
            </Button>
            <Button variant="secondary" icon={Calculator} onClick={() => navigate('/mathematics')}>
              Mathematics Studio
            </Button>
          </div>
        </div>
        <div className="dashboard__hero-earth" aria-hidden="true">
          <div className="dashboard__hero-atmosphere" />
        </div>
        <div className="dashboard__hero-glow" />
      </section>

      {/* Synchronized Stats with Domain Roadmaps & Mathematics */}
      <section className="dashboard__section">
        <StatsOverview
          totalConcepts={concepts.length}
          totalCategories={totalCategoriesCount}
          exploredCount={progress.exploredCount}
          progressPercent={progress.percentage}
          domainProgress={domainProgress}
          domainRoadmapStats={domainRoadmapStats}
          mathSummary={mathSummary}
          roadmapKpis={roadmapKpis}
        />
      </section>

      {/* 3 Large Domain Exploration Cards */}
      <section className="dashboard__section">
        <div className="dashboard__section-header">
          <h2 className="section-title">Core Learning Domains</h2>
          <span className="dashboard__section-meta">
            Choose a domain to start a structured learning path or explore interactive labs
          </span>
        </div>
        <div className="dashboard__domains">
          {domains.map((dom) => {
            const domStats = domainRoadmapStats[dom.id];
            const roadmapPercent = domStats?.overall.percent || 0;
            const roadmapCompleted = domStats?.overall.completed || 0;
            const roadmapTotal = domStats?.overall.total || 0;
            const mathCompleted = domStats?.math.completed || 0;
            const mathTotal = domStats?.math.total || 0;

            return (
              <Card
                key={dom.id}
                className="domain-card"
                style={{
                  '--dom-card-accent': dom.accent,
                  '--dom-card-glow': dom.glow,
                }}
                onClick={() => navigate(dom.roadmapPath)}
              >
                <div
                  className="domain-card__accent-bar"
                  style={{ background: dom.accent }}
                />
                <div className="domain-card__inner">
                  <div className="domain-card__head">
                    <div
                      className="domain-card__icon-box"
                      style={{
                        background: `color-mix(in srgb, ${dom.accent} 15%, transparent)`,
                        borderColor: `color-mix(in srgb, ${dom.accent} 30%, transparent)`,
                      }}
                    >
                      <dom.icon size={26} style={{ color: dom.accent }} />
                    </div>
                    <div className="domain-card__badges">
                      <span className="domain-card__topic-badge">
                        {roadmapTotal} Roadmap Topics
                      </span>
                    </div>
                  </div>

                  <div className="domain-card__body">
                    <h3 className="domain-card__title">{dom.title}</h3>
                    <p className="domain-card__desc">{dom.description}</p>

                    {/* Progress indicators */}
                    <div className="domain-card__progress-block">
                      <div className="domain-card__progress-meta">
                        <span className="domain-card__progress-label">Roadmap Completion</span>
                        <span className="domain-card__progress-stat">
                          {roadmapCompleted}/{roadmapTotal} ({roadmapPercent}%)
                        </span>
                      </div>
                      <div className="domain-card__track">
                        <div
                          className="domain-card__fill"
                          style={{ width: `${roadmapPercent}%`, background: dom.accent }}
                        />
                      </div>
                    </div>

                    <div className="domain-card__math-badge">
                      <Calculator size={13} className="text-yellow" />
                      <span>
                        Math Foundations: <strong>{mathCompleted}/{mathTotal}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="domain-card__footer">
                    <Button
                      size="sm"
                      icon={Map}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(dom.roadmapPath);
                      }}
                      style={{ background: dom.accent, color: '#050814', fontWeight: 600 }}
                    >
                      Roadmap Journey
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={ArrowRight}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(dom.path);
                      }}
                    >
                      Explore Domain
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Quick Start */}
      <section className="dashboard__section">
        <QuickActions />
      </section>

      {/* Featured Concepts */}
      <section className="dashboard__section">
        <RecentConcepts concepts={concepts} />
      </section>
    </div>
  );
}
