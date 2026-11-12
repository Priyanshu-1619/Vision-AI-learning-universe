"""Concept loading and querying service."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from models.concept import (
    CategoryCount,
    Concept,
    GraphEdge,
    GraphNode,
    GraphResponse,
)

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "concepts.json"

# Category → color mapping
CATEGORY_COLORS: dict[str, str] = {
    "Foundations": "#06b6d4",
    "Mathematics": "#8b5cf6",
    "Data Science": "#10b981",
    "Core ML": "#3b82f6",
    "Algorithms": "#f59e0b",
    "Optimization": "#ef4444",
    "Deep Learning": "#ec4899",
    "Evaluation": "#f97316",
}

_concepts_cache: list[Concept] | None = None


def _load_concepts() -> list[Concept]:
    global _concepts_cache
    if _concepts_cache is None:
        with open(DATA_PATH, encoding="utf-8") as f:
            raw = json.load(f)
        _concepts_cache = [Concept(**c) for c in raw]
    return _concepts_cache


def get_all_concepts() -> list[Concept]:
    return _load_concepts()


def get_concept_by_id(concept_id: str) -> Optional[Concept]:
    for c in _load_concepts():
        if c.id == concept_id:
            return c
    return None


def get_graph() -> GraphResponse:
    concepts = _load_concepts()
    concept_ids = {c.id for c in concepts}

    nodes = [
        GraphNode(
            id=c.id,
            title=c.title,
            category=c.category,
            difficulty=c.difficulty,
            icon=c.icon,
            color=c.color,
        )
        for c in concepts
    ]

    edges: list[GraphEdge] = []
    seen: set[tuple[str, str, str]] = set()

    for c in concepts:
        for prereq in c.prerequisites:
            if prereq in concept_ids:
                key = (prereq, c.id, "prerequisite")
                if key not in seen:
                    edges.append(GraphEdge(source=prereq, target=c.id, type="prerequisite"))
                    seen.add(key)
        for rel in c.relatedConcepts:
            if rel in concept_ids:
                # Undirected — store both orders in seen to avoid duplicates
                fwd = (c.id, rel, "related")
                rev = (rel, c.id, "related")
                if fwd not in seen and rev not in seen:
                    edges.append(GraphEdge(source=c.id, target=rel, type="related"))
                    seen.add(fwd)
                    seen.add(rev)

    return GraphResponse(nodes=nodes, edges=edges)


def get_categories() -> list[CategoryCount]:
    concepts = _load_concepts()
    counts: dict[str, int] = {}
    for c in concepts:
        counts[c.category] = counts.get(c.category, 0) + 1
    return [
        CategoryCount(
            category=cat,
            count=cnt,
            color=CATEGORY_COLORS.get(cat, "#6b7280"),
        )
        for cat, cnt in sorted(counts.items())
    ]
