import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import {
  ROADMAPS_DATA,
  getTopicsForDomainAndLevel,
  getTopicById,
} from '../../data/roadmapsData';
import { getMathTopicById } from '../../data/mathematicsData';
import { useRoadmapProgress } from '../../hooks/useRoadmapProgress';
import { fetchRoadmap } from '../../api/client';
import RoadmapHeader from './RoadmapHeader';
import RoadmapLevelSelector from './RoadmapLevelSelector';
import RoadmapRecommendedCard from './RoadmapRecommendedCard';
import RoadmapFilterToolbar from './RoadmapFilterToolbar';
import RoadmapTopicCard from './RoadmapTopicCard';
import RoadmapTopicDetailModal from './RoadmapTopicDetailModal';
import RoadmapMathModal from './RoadmapMathModal';
import Loading from '../common/Loading';
import './Roadmap.css';

const DOMAIN_METADATA = {
  'data-science': {
    title: 'Data Science Roadmap',
    description:
      'Master data ingestion, statistical thinking, probability distributions, data wrangling, feature engineering, and predictive pipelines.',
    accent: 'var(--ds-accent, #06b6d4)',
    glow: 'var(--ds-glow, rgba(6, 182, 212, 0.15))',
  },
  'machine-learning': {
    title: 'Machine Learning Roadmap',
    description:
      'From classic regression and classification to ensemble methods, clustering, loss optimization, and robust model evaluation.',
    accent: 'var(--ml-accent, #164BFF)',
    glow: 'var(--ml-glow, rgba(22, 75, 255, 0.15))',
  },
  'deep-learning': {
    title: 'Deep Learning Roadmap',
    description:
      'Journey from single perceptrons and forward propagation to CNNs, sequence modeling, transformers, and modern attention architectures.',
    accent: 'var(--dl-accent, #8b5cf6)',
    glow: 'var(--dl-glow, rgba(139, 92, 246, 0.15))',
  },
};

export default function Roadmap() {
  const { domain: paramDomain } = useParams();
  const navigate = useNavigate();

  // Validate or fallback to data-science
  const domain = DOMAIN_METADATA[paramDomain] ? paramDomain : 'data-science';
  const meta = DOMAIN_METADATA[domain];

  // Selected proficiency tier: basic, intermediate, advanced
  const [selectedLevel, setSelectedLevel] = useState('basic');

  // Filter toolbar state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected topic for detail modal
  const [selectedTopicForModal, setSelectedTopicForModal] = useState(null);

  // Mathematics Requirements Modal state
  const [showMathModal, setShowMathModal] = useState(false);

  // Progress Hook (loads and syncs learner progress cleanly)
  const {
    progressRecords,
    getTopicStatus,
    setTopicStatus,
    cycleTopicStatus,
    isPrerequisitesMet,
    getMissingPrerequisites,
    getMetricsForLevel,
    getOverallMetrics,
    getNextRecommendedTopic,
    resetDomainProgress,
    mathRecords,
    getMathStatus,
    setMathStatus,
    cycleMathStatus,
    isMathPrerequisitesMet,
    getMissingMathPrerequisites,
    getDomainMathMetrics,
    resetDomainMathProgress,
  } = useRoadmapProgress(domain);

  // Optional: ping backend for latest roadmap payload (graceful fallback to local dataset)
  useEffect(() => {
    let isMounted = true;
    fetchRoadmap(domain)
      .then((data) => {
        if (isMounted && data && data.topics) {
          // backend is healthy and responding
        }
      })
      .catch(() => {
        // Fallback transparently to bundled dataset
      });
    return () => {
      isMounted = false;
    };
  }, [domain]);

  // Reset filters when domain or level changes
  const [prevDomainAndLevel, setPrevDomainAndLevel] = useState(`${domain}:${selectedLevel}`);
  if (prevDomainAndLevel !== `${domain}:${selectedLevel}`) {
    setPrevDomainAndLevel(`${domain}:${selectedLevel}`);
    setSearchQuery('');
    setSelectedCategory('all');
    setStatusFilter('all');
  }

  // Level topics
  const levelTopics = useMemo(() => {
    return getTopicsForDomainAndLevel(domain, selectedLevel);
  }, [domain, selectedLevel]);

  // Categories present in this level
  const categories = useMemo(() => {
    const set = new Set();
    levelTopics.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [levelTopics]);

  // Filtered topics according to search, category, and status
  const filteredTopics = useMemo(() => {
    return levelTopics.filter((topic) => {
      // Category filter
      if (selectedCategory && selectedCategory !== 'all' && topic.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter && statusFilter !== 'all') {
        const currentStatus = getTopicStatus(topic.id);
        if (currentStatus !== statusFilter) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = topic.title?.toLowerCase().includes(q);
        const matchDesc = topic.description?.toLowerCase().includes(q);
        const matchCat = topic.category?.toLowerCase().includes(q);
        const matchTags = topic.tags?.some((tag) => tag.toLowerCase().includes(q));
        const matchDict = topic.dictionaryTerms?.some((term) => term.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchCat && !matchTags && !matchDict) {
          return false;
        }
      }
      return true;
    });
  }, [levelTopics, selectedCategory, statusFilter, searchQuery, getTopicStatus]);

  // Metrics for level selector
  const levelMetrics = useMemo(() => {
    return {
      basic: getMetricsForLevel('basic'),
      intermediate: getMetricsForLevel('intermediate'),
      advanced: getMetricsForLevel('advanced'),
    };
  }, [getMetricsForLevel]);

  // Overall domain metrics
  const overallMetrics = useMemo(() => {
    return getOverallMetrics();
  }, [getOverallMetrics]);

  // Mathematics domain metrics
  const mathMetrics = useMemo(() => {
    return getDomainMathMetrics();
  }, [getDomainMathMetrics]);

  // Next recommended topic in this level
  const nextRecommended = useMemo(() => {
    return getNextRecommendedTopic(levelTopics);
  }, [levelTopics, getNextRecommendedTopic]);

  // Prerequisite topic entities for modal display
  const modalPrereqTopics = useMemo(() => {
    if (!selectedTopicForModal || !selectedTopicForModal.prerequisites) return [];
    return selectedTopicForModal.prerequisites
      .map((prereqId) => getTopicById(prereqId))
      .filter(Boolean);
  }, [selectedTopicForModal]);

  // Action handlers
  const handleStartLesson = useCallback(
    (topic) => {
      // Automatically advance status to in-progress if not-started
      const current = getTopicStatus(topic.id);
      if (current === 'not-started') {
        setTopicStatus(topic.id, 'in-progress');
      }
      if (topic.lessonRoute) {
        navigate(topic.lessonRoute);
      } else {
        navigate(`/concept/${topic.slug}`);
      }
    },
    [getTopicStatus, setTopicStatus, navigate]
  );

  const handleLaunchVisualization = useCallback(
    (vizId) => {
      if (vizId === 'neural-network-flow' || vizId.includes('neural')) {
        navigate('/concept/neural-networks');
      } else {
        navigate('/laboratory');
      }
    },
    [navigate]
  );

  const handleOpenDictionary = useCallback(
    (term) => {
      navigate(`/dictionary?search=${encodeURIComponent(term)}`);
    },
    [navigate]
  );

  const handleOpenProject = useCallback(
    (projectId) => {
      if (projectId.startsWith('mission')) {
        navigate('/missions');
      } else {
        navigate('/laboratory');
      }
    },
    [navigate]
  );

  const handleResetClick = useCallback(() => {
    const confirmed = window.confirm(
      `Reset all learning progress for ${meta.title}?\n\nThis will reset all topic statuses across Basic, Intermediate, and Advanced tiers to "Not Started".`
    );
    if (confirmed) {
      resetDomainProgress();
    }
  }, [meta.title, resetDomainProgress]);

  if (!ROADMAPS_DATA[domain]) {
    return <Loading text="Loading roadmap..." />;
  }

  return (
    <div
      className="roadmap fade-in"
      style={{
        '--rd-accent': meta.accent,
        '--rd-glow': meta.glow,
      }}
    >
      {/* 1. Header Banner & Domain Switcher */}
      <RoadmapHeader
        domain={domain}
        meta={meta}
        overallMetrics={overallMetrics}
        mathMetrics={mathMetrics}
        onOpenMathRequirements={() => setShowMathModal(true)}
        onResetClick={handleResetClick}
      />

      {/* 2. Proficiency Tier Cards */}
      <RoadmapLevelSelector
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        levelMetrics={levelMetrics}
        accentColor={meta.accent}
      />

      {/* 3. Next Recommended Topic Card */}
      {nextRecommended && (
        <RoadmapRecommendedCard
          topic={nextRecommended}
          status={getTopicStatus(nextRecommended.id)}
          accentColor={meta.accent}
          onOpenTopic={setSelectedTopicForModal}
          onStartLearning={handleStartLesson}
        />
      )}

      {/* 4. Filter, Search, and Status Toolbar */}
      <RoadmapFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalCount={levelTopics.length}
        filteredCount={filteredTopics.length}
      />

      {/* 5. Topic Checklist Grid */}
      <section className="roadmap__grid-section" aria-label="Curriculum Topics">
        {filteredTopics.length === 0 ? (
          <div className="roadmap__empty">
            <Layers size={32} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
            <p>No topics match your current search or status filter.</p>
            <button
              type="button"
              className="roadmap-toolbar__reset-link"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setStatusFilter('all');
              }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="roadmap-grid">
            {filteredTopics.map((topic) => {
              const status = getTopicStatus(topic.id);
              const prereqMet = isPrerequisitesMet(topic);
              const missingPrereqs = prereqMet ? [] : getMissingPrerequisites(topic);
              const mathPrereqMet = isMathPrerequisitesMet(topic);
              const missingMath = mathPrereqMet
                ? []
                : getMissingMathPrerequisites(topic).map(
                    (mid) => getMathTopicById(mid)?.title || mid
                  );

              return (
                <RoadmapTopicCard
                  key={topic.id}
                  topic={topic}
                  status={status}
                  isPrereqMet={prereqMet}
                  missingPrereqNames={missingPrereqs}
                  isMathPrereqMet={mathPrereqMet}
                  missingMathNames={missingMath}
                  accentColor={meta.accent}
                  onCycleStatus={cycleTopicStatus}
                  onOpenDetails={setSelectedTopicForModal}
                  onStartLesson={handleStartLesson}
                  onLaunchVisualization={handleLaunchVisualization}
                  onOpenDictionary={handleOpenDictionary}
                  onOpenProject={handleOpenProject}
                  onOpenMathRequirements={() => setShowMathModal(true)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 6. Topic Detail Drawer / Modal */}
      {selectedTopicForModal && (
        <RoadmapTopicDetailModal
          topic={selectedTopicForModal}
          status={getTopicStatus(selectedTopicForModal.id)}
          prereqTopics={modalPrereqTopics}
          allRecords={progressRecords}
          mathRecords={mathRecords}
          accentColor={meta.accent}
          onClose={() => setSelectedTopicForModal(null)}
          onSetStatus={setTopicStatus}
          onCycleMathStatus={cycleMathStatus}
          onStartLesson={handleStartLesson}
          onLaunchVisualization={handleLaunchVisualization}
          onOpenDictionary={handleOpenDictionary}
          onOpenProject={handleOpenProject}
          onOpenMathRequirements={() => setShowMathModal(true)}
        />
      )}

      {/* 7. Dedicated Mathematics Requirements Modal */}
      {showMathModal && (
        <RoadmapMathModal
          domain={domain}
          meta={meta}
          mathRecords={mathRecords}
          getMathStatus={getMathStatus}
          onCycleMathStatus={cycleMathStatus}
          onSetMathStatus={setMathStatus}
          onResetMathProgress={resetDomainMathProgress}
          onClose={() => setShowMathModal(false)}
        />
      )}
    </div>
  );
}
