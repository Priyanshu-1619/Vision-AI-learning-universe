import { useState, useEffect } from 'react';
import { fetchConcepts } from '../api/client';
import { MOCK_CONCEPTS } from '../concept-engine/ConceptEngine';

let cachedConcepts = null;
let inFlightPromise = null;

function normalizeConcept(c) {
  let domain = c.domain;
  if (!domain) {
    if (['Foundations', 'Mathematics', 'Data Science'].includes(c.category)) {
      domain = 'data-science';
    } else if (c.category === 'Deep Learning') {
      domain = 'deep-learning';
    } else {
      domain = 'machine-learning';
    }
  }
  let level = c.level;
  if (!level) {
    if (c.difficulty === 'Beginner') level = 'basic';
    else if (c.difficulty === 'Advanced') level = 'advanced';
    else level = 'intermediate';
  }
  return { ...c, domain, level };
}

async function loadConceptsShared() {
  if (cachedConcepts) return cachedConcepts;
  if (!inFlightPromise) {
    inFlightPromise = fetchConcepts()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          cachedConcepts = data.map(normalizeConcept);
          return cachedConcepts;
        }
        cachedConcepts = MOCK_CONCEPTS.map(normalizeConcept);
        return cachedConcepts;
      })
      .finally(() => {
        inFlightPromise = null;
      });
  }
  return inFlightPromise;
}

export function useConcepts() {
  const [concepts, setConcepts] = useState(() => cachedConcepts || []);
  const [loading, setLoading] = useState(() => !cachedConcepts);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedConcepts) return undefined;

    let cancelled = false;
    loadConceptsShared()
      .then((result) => {
        if (!cancelled) {
          setConcepts(result);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e);
          setConcepts(MOCK_CONCEPTS);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { concepts, loading, error };
}
