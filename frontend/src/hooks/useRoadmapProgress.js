import { useState, useEffect, useCallback } from 'react';
import {
  PROGRESS_UPDATED_EVENT,
  MATH_PROGRESS_UPDATED_EVENT,
  getDomainProgressRecords,
  getTopicProgress,
  updateTopicStatus,
  cycleTopicStatus,
  resetTopicsProgress,
  checkPrerequisitesSatisfied,
  computeProgressMetrics,
  getRecommendedNextTopic,
  readMathStorage,
  updateMathTopicStatus as updateMathTopicStatusService,
  cycleMathTopicStatus as cycleMathTopicStatusService,
  computeDomainMathMetrics,
  checkMathPrerequisitesSatisfied,
  getMissingMathPrerequisites as getMissingMathPrerequisitesService,
  resetDomainMathProgress as resetDomainMathProgressService,
  STATUS_NOT_STARTED,
  STATUS_COMPLETED,
} from '../services/roadmapProgressService';
import {
  ROADMAPS_DATA,
  getTopicsForDomainAndLevel,
} from '../data/roadmapsData';
import {
  getMathTopicsForDomain,
} from '../data/mathematicsData';

export function useRoadmapProgress(domain) {
  const [currentDomain, setCurrentDomain] = useState(domain);
  const [records, setRecords] = useState(() => getDomainProgressRecords(domain));
  const [mathRecords, setMathRecords] = useState(() => readMathStorage());

  if (currentDomain !== domain) {
    setCurrentDomain(domain);
    setRecords(getDomainProgressRecords(domain));
  }

  useEffect(() => {
    const handleUpdate = () => {
      setRecords(getDomainProgressRecords(domain));
    };

    const handleMathUpdate = () => {
      setMathRecords(readMathStorage());
    };

    window.addEventListener(PROGRESS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(MATH_PROGRESS_UPDATED_EVENT, handleMathUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('storage', handleMathUpdate);

    return () => {
      window.removeEventListener(PROGRESS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(MATH_PROGRESS_UPDATED_EVENT, handleMathUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('storage', handleMathUpdate);
    };
  }, [domain]);

  const getStatus = useCallback(
    (topicId) => {
      return records[topicId]?.status || STATUS_NOT_STARTED;
    },
    [records]
  );

  const getRecord = useCallback(
    (topicId) => {
      return records[topicId] || getTopicProgress(domain, topicId);
    },
    [domain, records]
  );

  const cycleStatus = useCallback(
    (topicId, additionalData) => {
      return cycleTopicStatus(domain, topicId, additionalData);
    },
    [domain]
  );

  const setStatus = useCallback(
    (topicId, newStatus, additionalData) => {
      return updateTopicStatus(domain, topicId, newStatus, additionalData);
    },
    [domain]
  );

  const isPrerequisiteMet = useCallback(
    (topic) => {
      return checkPrerequisitesSatisfied(topic, records);
    },
    [records]
  );

  const getMissingPrerequisites = useCallback(
    (topic) => {
      if (!topic.prerequisites || topic.prerequisites.length === 0) return [];
      return topic.prerequisites.filter((pid) => records[pid]?.status !== STATUS_COMPLETED);
    },
    [records]
  );

  const calculateMetrics = useCallback(
    (topics) => {
      return computeProgressMetrics(topics, records);
    },
    [records]
  );

  const getMetricsForLevel = useCallback(
    (level) => {
      const topics = getTopicsForDomainAndLevel(domain, level);
      return computeProgressMetrics(topics, records);
    },
    [domain, records]
  );

  const getOverallMetrics = useCallback(() => {
    const topics = ROADMAPS_DATA[domain]?.topics || [];
    return computeProgressMetrics(topics, records);
  }, [domain, records]);

  const getRecommended = useCallback(
    (topics) => {
      return getRecommendedNextTopic(topics, records);
    },
    [records]
  );

  const resetLevel = useCallback((topics) => {
    resetTopicsProgress(topics);
  }, []);

  const resetLevelProgress = useCallback(
    (level) => {
      const topics = getTopicsForDomainAndLevel(domain, level);
      resetTopicsProgress(topics);
    },
    [domain]
  );

  const resetDomainProgress = useCallback(() => {
    const topics = ROADMAPS_DATA[domain]?.topics || [];
    resetTopicsProgress(topics);
  }, [domain]);

  // Mathematics progress helpers
  const getMathStatus = useCallback(
    (mathTopicId) => {
      return mathRecords[mathTopicId]?.status || STATUS_NOT_STARTED;
    },
    [mathRecords]
  );

  const setMathStatus = useCallback(
    (mathTopicId, newStatus, additionalData) => {
      return updateMathTopicStatusService(mathTopicId, newStatus, additionalData);
    },
    []
  );

  const cycleMathStatus = useCallback(
    (mathTopicId, additionalData) => {
      return cycleMathTopicStatusService(mathTopicId, additionalData);
    },
    []
  );

  const isMathPrerequisiteMet = useCallback(
    (topic) => {
      return checkMathPrerequisitesSatisfied(topic, mathRecords);
    },
    [mathRecords]
  );

  const getMissingMathPrereqs = useCallback(
    (topic) => {
      return getMissingMathPrerequisitesService(topic, mathRecords);
    },
    [mathRecords]
  );

  const getDomainMathMetrics = useCallback(() => {
    const domainMathTopics = getMathTopicsForDomain(domain);
    return computeDomainMathMetrics(domainMathTopics, mathRecords);
  }, [domain, mathRecords]);

  const resetDomainMath = useCallback(() => {
    const domainMathTopics = getMathTopicsForDomain(domain);
    resetDomainMathProgressService(domainMathTopics);
  }, [domain]);

  return {
    records,
    progressRecords: records,
    getStatus,
    getTopicStatus: getStatus,
    getRecord,
    cycleStatus,
    cycleTopicStatus: cycleStatus,
    setStatus,
    setTopicStatus: setStatus,
    resetLevel,
    resetLevelProgress,
    resetDomainProgress,
    isPrerequisiteMet,
    isPrerequisitesMet: isPrerequisiteMet,
    getMissingPrerequisites,
    calculateMetrics,
    getMetricsForLevel,
    getOverallMetrics,
    getRecommended,
    getNextRecommendedTopic: getRecommended,

    // Mathematics exports
    mathRecords,
    getMathStatus,
    getMathTopicStatus: getMathStatus,
    setMathStatus,
    setMathTopicStatus: setMathStatus,
    cycleMathStatus,
    cycleMathTopicStatus: cycleMathStatus,
    isMathPrerequisiteMet,
    isMathPrerequisitesMet: isMathPrerequisiteMet,
    getMissingMathPrerequisites: getMissingMathPrereqs,
    getDomainMathMetrics,
    resetDomainMath,
    resetDomainMathProgress: resetDomainMath,
  };
}
