const BASE_URL = '/api';

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API request failed: ${path}`, err);
    return null;
  }
}

/**
 * Strict request helper for backend ML compute endpoints (/labs, /missions).
 * Surfaces clean user-facing error details without exposing stack traces.
 */
async function requestStrict(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error(
      'Unable to reach the local ML backend. Make sure FastAPI is running on port 8000.'
    );
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const detail =
      typeof payload?.detail === 'string'
        ? payload.detail
        : Array.isArray(payload?.detail)
          ? payload.detail.map((d) => d.msg || String(d)).join('; ')
          : `Request failed with status ${res.status}`;
    throw new Error(detail);
  }

  return payload;
}

export async function fetchConcepts(domain = '', level = '') {
  const params = new URLSearchParams();
  if (domain) params.set('domain', domain);
  if (level) params.set('level', level);
  const qs = params.toString();
  return request(`/concepts${qs ? `?${qs}` : ''}`);
}

export async function fetchDictionary(search = '', domain = '', level = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (domain) params.set('domain', domain);
  if (level) params.set('level', level);
  params.set('sort', 'alpha');
  return request(`/dictionary?${params.toString()}`);
}

export async function fetchDictionaryTerm(termId) {
  return request(`/dictionary/${encodeURIComponent(termId)}`);
}

export async function fetchConcept(id) {
  return request(`/concepts/${id}`);
}

export async function fetchGraph() {
  return request('/concepts/graph');
}

export async function fetchCategories() {
  return request('/concepts/categories');
}

// ── Phase 3: AI Laboratory API (Real FastAPI + scikit-learn) ──

export async function fetchLabDataset(
  name,
  nSamples = 200,
  noise = 0.1,
  seed = 42,
  allFeatures = false
) {
  const qs = new URLSearchParams({
    n_samples: String(nSamples),
    noise: String(noise),
    seed: String(seed),
    all_features: String(Boolean(allFeatures)),
  });
  return requestStrict(`/labs/dataset/${encodeURIComponent(name)}?${qs.toString()}`);
}

export async function runLinearRegression(data, params = {}) {
  return requestStrict('/labs/linear-regression', {
    method: 'POST',
    body: JSON.stringify({ data, params }),
  });
}

export async function runKMeans(
  data,
  k = 3,
  { initMethod = 'k-means++', seed = 42, maxIter = 15 } = {}
) {
  return requestStrict('/labs/kmeans', {
    method: 'POST',
    body: JSON.stringify({ data, k, initMethod, seed, maxIter }),
  });
}

export async function runKNN(data, labels, query, k = 5, metric = 'euclidean') {
  return requestStrict('/labs/knn', {
    method: 'POST',
    body: JSON.stringify({ data, labels, query, k, metric }),
  });
}

export async function runDecisionTree(
  data,
  labels,
  {
    maxDepth = 3,
    minSamplesSplit = 2,
    criterion = 'gini',
    featureNames = null,
  } = {}
) {
  return requestStrict('/labs/decision-tree', {
    method: 'POST',
    body: JSON.stringify({
      data,
      labels,
      maxDepth,
      minSamplesSplit,
      criterion,
      featureNames,
    }),
  });
}

export async function runPCA(data, nComponents = 2, standardize = true) {
  return requestStrict('/labs/pca', {
    method: 'POST',
    body: JSON.stringify({ data, nComponents, standardize }),
  });
}

// ── Phase 9: AI Mission Mode API (Real pandas + scikit-learn) ──

export async function fetchChurnDataset() {
  return requestStrict('/missions/churn/dataset');
}

export async function cleanChurnPreview(config) {
  return requestStrict('/missions/churn/clean-preview', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function trainChurnModel(config) {
  return requestStrict('/missions/churn/train', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function simulateChurnDebug(scenario) {
  return requestStrict('/missions/churn/debug-demo', {
    method: 'POST',
    body: JSON.stringify(scenario),
  });
}

export async function predictChurnCustomer(customerFeatures, pipelineConfig) {
  return requestStrict('/missions/churn/predict', {
    method: 'POST',
    body: JSON.stringify({ customer: customerFeatures, config: pipelineConfig }),
  });
}
