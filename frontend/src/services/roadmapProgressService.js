/**
 * AI Learning Universe — Standardized Learner Progress Management Service
 * Manages separate, persistent progress records conforming to the required schema:
 * { userId, topicId, domain, status, startedAt, completedAt, timeSpentMinutes, lastAccessedAt }
 */
import { markConceptExplored } from '../concept-engine/ConceptEngine';

export const PROGRESS_UPDATED_EVENT = 'ailu:roadmap-progress-updated';
const STORAGE_KEY = 'ailu_learner_progress_v2';
const DEFAULT_USER_ID = 'learner_default';

export const STATUS_NOT_STARTED = 'not-started';
export const STATUS_IN_PROGRESS = 'in-progress';
export const STATUS_COMPLETED = 'completed';

export const VALID_STATUSES = [STATUS_NOT_STARTED, STATUS_IN_PROGRESS, STATUS_COMPLETED];

/**
 * Read all stored records from localStorage
 */
export function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse learner progress storage:', err);
    return {};
  }
}

/**
 * Write all records to localStorage and notify listeners
 */
export function writeStorage(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Failed to save learner progress storage:', err);
  }
  // Dispatch custom window event for real-time reactivity across components
  window.dispatchEvent(new CustomEvent(PROGRESS_UPDATED_EVENT, { detail: { records } }));
}

/**
 * Migrate legacy progress storage (e.g. { conceptId: 1|2 } from ailu_roadmap_*)
 */
export function migrateLegacyProgress() {
  const records = readStorage();
  let modified = false;

  const domains = ['data-science', 'machine-learning', 'deep-learning'];
  const levels = ['basic', 'intermediate', 'advanced'];

  for (const domain of domains) {
    for (const lvl of levels) {
      const oldKey = `ailu_roadmap_${domain}_${lvl}`;
      try {
        const raw = localStorage.getItem(oldKey);
        if (raw) {
          const oldMap = JSON.parse(raw);
          for (const [id, val] of Object.entries(oldMap)) {
            if (!records[id]) {
              const status = val === 2 ? STATUS_COMPLETED : val === 1 ? STATUS_IN_PROGRESS : STATUS_NOT_STARTED;
              records[id] = {
                userId: DEFAULT_USER_ID,
                topicId: id,
                domain,
                status,
                startedAt: status !== STATUS_NOT_STARTED ? new Date().toISOString() : null,
                completedAt: status === STATUS_COMPLETED ? new Date().toISOString() : null,
                timeSpentMinutes: status === STATUS_COMPLETED ? 30 : status === STATUS_IN_PROGRESS ? 15 : 0,
                lastAccessedAt: new Date().toISOString(),
              };
              modified = true;
            }
          }
        }
      } catch {}
    }
  }

  if (modified) {
    writeStorage(records);
  }
  return records;
}

// Perform initial migration on load
if (typeof window !== 'undefined') {
  migrateLegacyProgress();
}

/**
 * Retrieve progress record for a single topic
 */
export function getTopicProgress(domain, topicId) {
  const records = readStorage();
  const existing = records[topicId];
  if (existing) return existing;

  return {
    userId: DEFAULT_USER_ID,
    topicId,
    domain,
    status: STATUS_NOT_STARTED,
    startedAt: null,
    completedAt: null,
    timeSpentMinutes: 0,
    lastAccessedAt: null,
  };
}

/**
 * Retrieve all progress records for a specific domain
 */
export function getDomainProgressRecords(domain) {
  const records = readStorage();
  const domainRecords = {};
  for (const [id, rec] of Object.entries(records)) {
    if (rec.domain === domain) {
      domainRecords[id] = rec;
    }
  }
  return domainRecords;
}

/**
 * Update topic status and persist
 */
export function updateTopicStatus(domain, topicId, newStatus, additionalData = {}) {
  if (!VALID_STATUSES.includes(newStatus)) {
    console.warn(`Invalid status '${newStatus}' provided for topic ${topicId}`);
    return;
  }

  const records = readStorage();
  const now = new Date().toISOString();
  const current = records[topicId] || {
    userId: DEFAULT_USER_ID,
    topicId,
    domain,
    status: STATUS_NOT_STARTED,
    startedAt: null,
    completedAt: null,
    timeSpentMinutes: 0,
    lastAccessedAt: null,
  };

  const startedAt = current.startedAt || (newStatus !== STATUS_NOT_STARTED ? now : null);
  const completedAt = newStatus === STATUS_COMPLETED ? (current.completedAt || now) : null;
  const timeSpent = newStatus === STATUS_COMPLETED
    ? Math.max(current.timeSpentMinutes || 0, additionalData.estimatedMinutes || 30)
    : current.timeSpentMinutes;

  records[topicId] = {
    ...current,
    ...additionalData,
    status: newStatus,
    startedAt,
    completedAt,
    timeSpentMinutes: timeSpent,
    lastAccessedAt: now,
  };

  writeStorage(records);

  // Sync with ConceptEngine explored tracker if completed
  if (newStatus === STATUS_COMPLETED) {
    try {
      markConceptExplored(topicId);
      // If topic ID has prefix (e.g. ds-linear-regression), also mark base concept
      const baseSlug = topicId.replace(/^(ds|ml|dl)-/, '');
      markConceptExplored(baseSlug);
    } catch {}
  }

  return records[topicId];
}

/**
 * Cycle topic status: not-started -> in-progress -> completed -> not-started
 */
export function cycleTopicStatus(domain, topicId, additionalData = {}) {
  const current = getTopicProgress(domain, topicId);
  let nextStatus = STATUS_IN_PROGRESS;
  if (current.status === STATUS_NOT_STARTED) nextStatus = STATUS_IN_PROGRESS;
  else if (current.status === STATUS_IN_PROGRESS) nextStatus = STATUS_COMPLETED;
  else if (current.status === STATUS_COMPLETED) nextStatus = STATUS_NOT_STARTED;

  return updateTopicStatus(domain, topicId, nextStatus, additionalData);
}

/**
 * Reset progress for a list of topics (e.g. for a specific level or domain)
 */
export function resetTopicsProgress(topics) {
  const records = readStorage();
  for (const t of topics) {
    if (records[t.id]) {
      records[t.id] = {
        ...records[t.id],
        status: STATUS_NOT_STARTED,
        startedAt: null,
        completedAt: null,
        timeSpentMinutes: 0,
        lastAccessedAt: new Date().toISOString(),
      };
    }
  }
  writeStorage(records);
}

/**
 * Check if all prerequisites for a topic are completed
 */
export function checkPrerequisitesSatisfied(topic, allRecords) {
  if (!topic.prerequisites || topic.prerequisites.length === 0) return true;
  return topic.prerequisites.every((prereqId) => {
    const rec = allRecords[prereqId];
    return rec && rec.status === STATUS_COMPLETED;
  });
}

/**
 * Compute progress statistics for a set of topics
 */
export function computeProgressMetrics(topics, allRecords) {
  const total = topics.length;
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  let totalTimeMinutes = 0;

  for (const t of topics) {
    const rec = allRecords[t.id];
    const status = rec?.status || STATUS_NOT_STARTED;
    if (status === STATUS_COMPLETED) {
      completed++;
      totalTimeMinutes += rec.timeSpentMinutes || t.estimatedMinutes || 30;
    } else if (status === STATUS_IN_PROGRESS) {
      inProgress++;
      totalTimeMinutes += rec.timeSpentMinutes || 15;
    } else {
      notStarted++;
    }
  }

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    notStarted,
    percent,
    totalTimeMinutes,
  };
}

/**
 * Determine the next recommended topic for the learner
 */
export function getRecommendedNextTopic(topics, allRecords) {
  // First priority: A topic that is currently in-progress
  const inProg = topics.find((t) => allRecords[t.id]?.status === STATUS_IN_PROGRESS);
  if (inProg) return inProg;

  // Second priority: The first uncompleted topic whose prerequisites are satisfied
  for (const t of topics) {
    const rec = allRecords[t.id];
    if (rec?.status !== STATUS_COMPLETED) {
      const prereqsMet = checkPrerequisitesSatisfied(t, allRecords);
      if (prereqsMet) {
        return t;
      }
    }
  }

  // Fallback: The first uncompleted topic
  return topics.find((t) => allRecords[t.id]?.status !== STATUS_COMPLETED) || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS PROGRESS TRACKING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export const MATH_PROGRESS_UPDATED_EVENT = 'ailu:math-progress-updated';
const MATH_STORAGE_KEY = 'ailu_math_progress_v2';

export function readMathStorage() {
  try {
    const raw = localStorage.getItem(MATH_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse math progress storage:', err);
    return {};
  }
}

export function writeMathStorage(records) {
  try {
    localStorage.setItem(MATH_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Failed to save math progress storage:', err);
  }
  window.dispatchEvent(new CustomEvent(MATH_PROGRESS_UPDATED_EVENT, { detail: { records } }));
}

export function getMathTopicProgress(mathTopicId) {
  const records = readMathStorage();
  return (
    records[mathTopicId] || {
      userId: DEFAULT_USER_ID,
      mathTopicId,
      status: STATUS_NOT_STARTED,
      startedAt: null,
      completedAt: null,
      timeSpentMinutes: 0,
      lastAccessedAt: null,
    }
  );
}

export function getMathTopicStatus(mathTopicId) {
  const records = readMathStorage();
  return records[mathTopicId]?.status || STATUS_NOT_STARTED;
}

export function updateMathTopicStatus(mathTopicId, newStatus, additionalData = {}) {
  const records = readMathStorage();
  const now = new Date().toISOString();
  const existing = records[mathTopicId] || {
    userId: DEFAULT_USER_ID,
    mathTopicId,
    status: STATUS_NOT_STARTED,
    startedAt: null,
    completedAt: null,
    timeSpentMinutes: 0,
    lastAccessedAt: now,
  };

  let startedAt = existing.startedAt;
  let completedAt = existing.completedAt;
  let timeSpent = existing.timeSpentMinutes || 0;

  if (newStatus === STATUS_IN_PROGRESS && !startedAt) {
    startedAt = now;
    timeSpent = Math.max(timeSpent, 15);
  } else if (newStatus === STATUS_COMPLETED) {
    if (!startedAt) startedAt = now;
    completedAt = now;
    timeSpent = Math.max(timeSpent, additionalData.estimatedMinutes || 30);
  } else if (newStatus === STATUS_NOT_STARTED) {
    startedAt = null;
    completedAt = null;
    timeSpent = 0;
  }

  records[mathTopicId] = {
    ...existing,
    ...additionalData,
    status: newStatus,
    startedAt,
    completedAt,
    timeSpentMinutes: timeSpent,
    lastAccessedAt: now,
  };

  writeMathStorage(records);
  return records[mathTopicId];
}

export function cycleMathTopicStatus(mathTopicId, additionalData = {}) {
  const current = getMathTopicStatus(mathTopicId);
  let nextStatus = STATUS_IN_PROGRESS;
  if (current === STATUS_IN_PROGRESS) nextStatus = STATUS_COMPLETED;
  else if (current === STATUS_COMPLETED) nextStatus = STATUS_NOT_STARTED;
  return updateMathTopicStatus(mathTopicId, nextStatus, additionalData);
}

export function computeDomainMathMetrics(domainMathTopics, mathRecords) {
  const total = domainMathTopics.length;
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  let totalTimeMinutes = 0;

  for (const t of domainMathTopics) {
    const rec = mathRecords[t.id];
    const status = rec?.status || STATUS_NOT_STARTED;
    if (status === STATUS_COMPLETED) {
      completed++;
      totalTimeMinutes += rec.timeSpentMinutes || t.estimatedMinutes || 30;
    } else if (status === STATUS_IN_PROGRESS) {
      inProgress++;
      totalTimeMinutes += rec.timeSpentMinutes || 15;
    } else {
      notStarted++;
    }
  }

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return {
    total,
    completed,
    inProgress,
    notStarted,
    percent,
    totalTimeMinutes,
  };
}

export function checkMathPrerequisitesSatisfied(topic, mathRecords) {
  const reqMathIds = topic.requiredMathTopicIds || [];
  if (reqMathIds.length === 0) return true;
  return reqMathIds.every((mid) => mathRecords[mid]?.status === STATUS_COMPLETED);
}

export function getMissingMathPrerequisites(topic, mathRecords) {
  const reqMathIds = topic.requiredMathTopicIds || [];
  return reqMathIds.filter((mid) => mathRecords[mid]?.status !== STATUS_COMPLETED);
}

export function resetDomainMathProgress(domainMathTopics) {
  const records = readMathStorage();
  for (const t of domainMathTopics) {
    if (records[t.id]) {
      records[t.id] = {
        ...records[t.id],
        status: STATUS_NOT_STARTED,
        startedAt: null,
        completedAt: null,
        timeSpentMinutes: 0,
        lastAccessedAt: new Date().toISOString(),
      };
    }
  }
  writeMathStorage(records);
}


