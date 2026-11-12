// Pure UI presentation helpers for AI Laboratory (all ML compute runs on the FastAPI + scikit-learn backend)

export const colorPalette = [
  '#38bdf8', // cyan
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // teal
  '#f97316', // orange
  '#a3e635', // lime
];

/**
 * Format numerical metric cleanly for UI display.
 */
export function formatMetric(value, decimals = 4) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toFixed(decimals);
}

const LAB_CONCEPT_MAP = {
  'linear-regression': 'linear-regression',
  'k-means': 'kmeans',
  knn: 'knn',
  'decision-tree': 'decision-tree',
  pca: 'pca',
};

/**
 * Map a Concept Engine concept ID to an AI Laboratory tab query param, or null if none.
 */
export function getLabIdForConcept(conceptId) {
  return LAB_CONCEPT_MAP[conceptId] || null;
}
