// Concept Engine: fallback data, graph builder, link resolution, and local progress tracking

const EXPLORED_STORAGE_KEY = 'ai_universe_explored_concepts';
export const EXPLORED_UPDATED_EVENT = 'ai-universe:explored-updated';

import ALL_CONCEPTS_DATA from '../data/conceptsData.json';

// Comprehensive catalog of 316 concepts across Data Science, ML, DL, and Mathematics
export const MOCK_CONCEPTS = ALL_CONCEPTS_DATA;

const CATEGORY_COLORS = {
  Foundations: '#06b6d4',
  Mathematics: '#8b5cf6',
  'Data Science': '#10b981',
  'Core ML': '#3b82f6',
  Algorithms: '#f59e0b',
  Optimization: '#ef4444',
  'Deep Learning': '#ec4899',
  Evaluation: '#f97316',
};

export const MOCK_CATEGORIES = Object.entries(
  MOCK_CONCEPTS.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {})
).map(([name, count]) => ({
  name,
  count,
  color: CATEGORY_COLORS[name] || '#06b6d4',
}));

/**
 * Build a graph { nodes, edges } from a concept list, matching the backend
 * `/api/concepts/graph` response contract.
 */
export function buildGraphFromConcepts(concepts = []) {
  const conceptIds = new Set(concepts.map((c) => c.id));

  const nodes = concepts.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    difficulty: c.difficulty,
    icon: c.icon,
    color: c.color,
  }));

  const edges = [];
  const seen = new Set();

  for (const c of concepts) {
    for (const prereq of c.prerequisites || []) {
      if (conceptIds.has(prereq)) {
        const key = `${prereq}->${c.id}:prerequisite`;
        if (!seen.has(key)) {
          edges.push({ source: prereq, target: c.id, type: 'prerequisite' });
          seen.add(key);
        }
      }
    }

    for (const rel of c.relatedConcepts || []) {
      if (conceptIds.has(rel)) {
        const fwd = `${c.id}<->${rel}:related`;
        const rev = `${rel}<->${c.id}:related`;
        if (!seen.has(fwd) && !seen.has(rev)) {
          edges.push({ source: c.id, target: rel, type: 'related' });
          seen.add(fwd);
          seen.add(rev);
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * Resolve prerequisite, related, and next concept IDs on a concept into full
 * concept objects from `allConcepts`.
 */
export function resolveConceptLinks(concept, allConcepts = []) {
  if (!concept) {
    return { prerequisites: [], relatedConcepts: [], nextConcepts: [] };
  }

  const byId = new Map(allConcepts.map((c) => [c.id, c]));
  const resolveList = (ids = []) =>
    Array.from(new Set(ids))
      .map((id) => byId.get(id))
      .filter(Boolean);

  const prerequisites = resolveList(concept.prerequisites);
  const relatedConcepts = resolveList(concept.relatedConcepts);

  let nextConcepts = resolveList(concept.nextConcepts);
  if (nextConcepts.length === 0) {
    nextConcepts = allConcepts.filter(
      (c) => c.id !== concept.id && (c.prerequisites || []).includes(concept.id)
    );
  }

  return { prerequisites, relatedConcepts, nextConcepts };
}

/**
 * Return the list of concept IDs the user has explored (stored in localStorage).
 */
export function getExploredIds() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(EXPLORED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.filter((id) => typeof id === 'string' && id.trim())));
  } catch {
    return [];
  }
}

/**
 * Persist a concept ID as explored in localStorage and notify listeners.
 */
export function markConceptExplored(id) {
  if (!id || typeof window === 'undefined' || !window.localStorage) return [];
  const current = getExploredIds();
  if (!current.includes(id)) {
    const next = [...current, id];
    try {
      window.localStorage.setItem(EXPLORED_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(EXPLORED_UPDATED_EVENT, { detail: next }));
    } catch {
      // Ignore storage quota errors
    }
    return next;
  }
  return current;
}

/**
 * Remove a concept ID from explored concepts in localStorage and notify listeners.
 */
export function unmarkConceptExplored(id) {
  if (!id || typeof window === 'undefined' || !window.localStorage) return [];
  const current = getExploredIds();
  if (current.includes(id)) {
    const next = current.filter((item) => item !== id);
    try {
      window.localStorage.setItem(EXPLORED_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(EXPLORED_UPDATED_EVENT, { detail: next }));
    } catch {
      // Ignore storage quota errors
    }
    return next;
  }
  return current;
}

/**
 * Toggle explored status for a concept ID in localStorage.
 */
export function toggleConceptExplored(id) {
  const current = getExploredIds();
  if (current.includes(id)) {
    return { exploredIds: unmarkConceptExplored(id), isExplored: false };
  }
  return { exploredIds: markConceptExplored(id), isExplored: true };
}

/**
 * Compute full upstream prerequisite lineage, downstream unlock descendants,
 * and direct related concept IDs for a given concept from graph edges.
 *
 * @returns {{ ancestorIds: Set<string>, descendantIds: Set<string>, relatedIds: Set<string> }}
 */
export function getConceptLineage(conceptId, edges = []) {
  const ancestorIds = new Set();
  const descendantIds = new Set();
  const relatedIds = new Set();

  if (!conceptId || !Array.isArray(edges)) {
    return { ancestorIds, descendantIds, relatedIds };
  }

  const parentsMap = new Map();
  const childrenMap = new Map();

  for (const edge of edges) {
    const rawSource = edge.source ?? edge.sourceId;
    const rawTarget = edge.target ?? edge.targetId;
    const source = typeof rawSource === 'object' ? rawSource?.id : rawSource;
    const target = typeof rawTarget === 'object' ? rawTarget?.id : rawTarget;
    if (!source || !target) continue;

    if (edge.type === 'prerequisite') {
      if (!childrenMap.has(source)) childrenMap.set(source, []);
      childrenMap.get(source).push(target);

      if (!parentsMap.has(target)) parentsMap.set(target, []);
      parentsMap.get(target).push(source);
    } else if (edge.type === 'related') {
      if (source === conceptId && target !== conceptId) relatedIds.add(target);
      if (target === conceptId && source !== conceptId) relatedIds.add(source);
    }
  }

  const walk = (startMap, visited) => {
    const queue = [...(startMap.get(conceptId) || [])];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur === conceptId || visited.has(cur)) continue;
      visited.add(cur);
      for (const next of startMap.get(cur) || []) {
        if (!visited.has(next) && next !== conceptId) {
          queue.push(next);
        }
      }
    }
  };

  walk(parentsMap, ancestorIds);
  walk(childrenMap, descendantIds);

  return { ancestorIds, descendantIds, relatedIds };
}

/**
 * Compute real exploration progress stats based on localStorage and total concepts.
 */
export function getProgressStats(totalCount, validConceptIds = null) {
  const exploredIds = getExploredIds();
  const filteredIds = validConceptIds
    ? exploredIds.filter((id) => validConceptIds.has(id))
    : exploredIds;

  const safeTotal = Math.max(0, Number(totalCount) || 0);
  const exploredCount = safeTotal > 0 ? Math.min(filteredIds.length, safeTotal) : filteredIds.length;
  const percentage = safeTotal > 0 ? Math.min(100, Math.round((exploredCount / safeTotal) * 100)) : 0;

  return {
    exploredCount,
    totalCount: safeTotal,
    percentage,
  };
}
