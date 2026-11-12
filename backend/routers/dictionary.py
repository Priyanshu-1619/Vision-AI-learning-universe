"""Dictionary API — searchable term lookup with domain/level filtering."""
from __future__ import annotations

import json
import pathlib
from typing import Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/dictionary", tags=["dictionary"])

_DATA_PATH = pathlib.Path(__file__).resolve().parent.parent / "data" / "concepts.json"


def _load_concepts() -> list[dict]:
    """Load concepts from the JSON file."""
    raw = _DATA_PATH.read_text(encoding="utf-8")
    return json.loads(raw)


def _concept_to_term(c: dict) -> dict:
    """Transform a concept record into a dictionary term."""
    math = c.get("mathematics", {})
    return {
        "id": c["id"],
        "title": c["title"],
        "domain": c.get("domain", "machine-learning"),
        "level": c.get("level", "intermediate"),
        "category": c.get("category", ""),
        "difficulty": c.get("difficulty", ""),
        "definition": c.get("definition", ""),
        "beginnerExplanation": c.get("beginnerExplanation", ""),
        "example": c.get("example", ""),
        "formulas": math.get("formulas", []),
        "mathExplanation": math.get("explanation", ""),
        "icon": c.get("icon", ""),
        "color": c.get("color", ""),
        "relatedConcepts": c.get("relatedConcepts", []),
        "prerequisites": c.get("prerequisites", []),
    }


@router.get("")
async def get_dictionary(
    search: Optional[str] = Query(None, description="Search term (case-insensitive substring match on title, definition, category)"),
    domain: Optional[str] = Query(None, description="Filter by domain: data-science, machine-learning, deep-learning"),
    level: Optional[str] = Query(None, description="Filter by level: basic, intermediate, advanced"),
    sort: str = Query("alpha", description="Sort order: alpha, domain, level"),
) -> dict:
    """Return dictionary terms with optional search and filters."""
    concepts = _load_concepts()
    terms = [_concept_to_term(c) for c in concepts]

    # Apply filters
    if domain:
        terms = [t for t in terms if t["domain"] == domain]

    if level:
        terms = [t for t in terms if t["level"] == level]

    if search:
        q = search.lower()
        terms = [
            t for t in terms
            if q in t["title"].lower()
            or q in t["definition"].lower()
            or q in t["category"].lower()
            or q in t["domain"].lower()
        ]

    # Sort
    if sort == "domain":
        terms.sort(key=lambda t: (t["domain"], t["title"].lower()))
    elif sort == "level":
        level_order = {"basic": 0, "intermediate": 1, "advanced": 2}
        terms.sort(key=lambda t: (level_order.get(t["level"], 1), t["title"].lower()))
    else:
        terms.sort(key=lambda t: t["title"].lower())

    # Compute domain stats
    all_concepts = _load_concepts()
    domain_counts = {}
    for c in all_concepts:
        d = c.get("domain", "machine-learning")
        domain_counts[d] = domain_counts.get(d, 0) + 1

    return {
        "terms": terms,
        "total": len(terms),
        "domainCounts": domain_counts,
    }


@router.get("/{term_id}")
async def get_term(term_id: str) -> dict:
    """Return a single dictionary term by ID."""
    concepts = _load_concepts()
    for c in concepts:
        if c["id"] == term_id:
            return {"term": _concept_to_term(c)}
    return {"term": None, "error": f"Term '{term_id}' not found"}

