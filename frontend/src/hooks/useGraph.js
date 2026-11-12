import { useState, useEffect } from 'react';
import { fetchGraph } from '../api/client';

let cachedGraph = null;
let inFlightPromise = null;

async function loadGraphShared() {
  if (cachedGraph) return cachedGraph;
  if (!inFlightPromise) {
    inFlightPromise = fetchGraph()
      .then((data) => {
        if (data && Array.isArray(data.nodes) && data.nodes.length > 0) {
          cachedGraph = data;
          return data;
        }
        return { nodes: [], edges: [] };
      })
      .finally(() => {
        inFlightPromise = null;
      });
  }
  return inFlightPromise;
}

export function useGraph() {
  const [graph, setGraph] = useState(() => cachedGraph || { nodes: [], edges: [] });
  const [loading, setLoading] = useState(() => !cachedGraph);

  useEffect(() => {
    if (cachedGraph) return undefined;

    let cancelled = false;
    loadGraphShared()
      .then((data) => {
        if (!cancelled) {
          setGraph(data || { nodes: [], edges: [] });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { graph, loading };
}
