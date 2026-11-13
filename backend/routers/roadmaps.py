"""Roadmaps API router for Data Science, Machine Learning, and Deep Learning."""
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/roadmaps", tags=["roadmaps"])

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "roadmaps.json"
MATH_FILE = Path(__file__).resolve().parent.parent / "data" / "mathematics.json"
_CACHED_ROADMAPS: Optional[Dict[str, Any]] = None
_CACHED_MATH: Optional[Dict[str, Any]] = None


def get_roadmaps_data() -> Dict[str, Any]:
    global _CACHED_ROADMAPS
    if _CACHED_ROADMAPS is None:
        if not DATA_FILE.exists():
            raise HTTPException(status_code=500, detail="Roadmaps data file not found")
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            _CACHED_ROADMAPS = json.load(f)
    return _CACHED_ROADMAPS


def get_mathematics_data() -> Dict[str, Any]:
    global _CACHED_MATH
    if _CACHED_MATH is None:
        if not MATH_FILE.exists():
            raise HTTPException(status_code=500, detail="Mathematics data file not found")
        with open(MATH_FILE, "r", encoding="utf-8") as f:
            _CACHED_MATH = json.load(f)
    return _CACHED_MATH


@router.get("")
@router.get("/", include_in_schema=False)
async def list_roadmaps_overview():
    """Return overview summaries of all available learning roadmaps."""
    data = get_roadmaps_data()
    overview = []
    for domain_id, dom_data in data.items():
        levels = dom_data.get("levels", {})
        counts = {
            "basic": len(levels.get("basic", [])),
            "intermediate": len(levels.get("intermediate", [])),
            "advanced": len(levels.get("advanced", [])),
        }
        total = sum(counts.values())
        overview.append({
            "domain": domain_id,
            "title": dom_data.get("title", domain_id),
            "levelCounts": counts,
            "totalTopics": total,
        })
    return {"roadmaps": overview}


@router.get("/{domain}")
async def get_domain_roadmap(
    domain: str,
    level: Optional[str] = Query(None, description="Optional level filter: basic, intermediate, advanced"),
):
    """Return structured roadmap for a specific domain."""
    data = get_roadmaps_data()
    if domain not in data:
        raise HTTPException(status_code=404, detail=f"Roadmap domain '{domain}' not found. Valid: {list(data.keys())}")

    domain_data = data[domain]
    levels = domain_data.get("levels", {})

    if isinstance(level, str) and level:
        if level not in levels:
            raise HTTPException(status_code=400, detail=f"Invalid level '{level}'. Valid: basic, intermediate, advanced")
        topics = levels.get(level, [])
        return {
            "domain": domain,
            "title": domain_data.get("title", domain),
            "level": level,
            "count": len(topics),
            "topics": topics,
        }

    counts = {
        "basic": len(levels.get("basic", [])),
        "intermediate": len(levels.get("intermediate", [])),
        "advanced": len(levels.get("advanced", [])),
    }

    return {
        "domain": domain,
        "title": domain_data.get("title", domain),
        "levels": levels,
        "counts": counts,
        "totalTopics": sum(counts.values()),
    }


@router.get("/{domain}/math")
async def get_domain_mathematics(domain: str):
    """Retrieve mathematics requirements and canonical curriculum for a specific domain."""
    math_data = get_mathematics_data()
    all_math_topics = math_data.get("topics", [])
    
    # Filter for domain
    domain_math = [t for t in all_math_topics if domain in t.get("relatedDomains", [])]
    if not domain_math and domain not in ["data-science", "machine-learning", "deep-learning"]:
        raise HTTPException(status_code=404, detail=f"No mathematics requirements found for domain '{domain}'")

    # Build topic cross-references from technical roadmap
    roadmaps = get_roadmaps_data()
    dom_roadmap = roadmaps.get(domain, {})
    all_tech_topics = []
    for lvl, ts in dom_roadmap.get("levels", {}).items():
        all_tech_topics.extend(ts)

    # Attach related technical topics to each math topic
    math_with_links = []
    for mt in domain_math:
        mid = mt["id"]
        required_by = [
            {"id": tt["id"], "title": tt["title"], "level": tt.get("level", "basic")}
            for tt in all_tech_topics
            if mid in tt.get("requiredMathTopicIds", [])
        ]
        recommended_by = [
            {"id": tt["id"], "title": tt["title"], "level": tt.get("level", "basic")}
            for tt in all_tech_topics
            if mid in tt.get("recommendedMathTopicIds", [])
        ]
        math_with_links.append({
            **mt,
            "requiredByTopics": required_by,
            "recommendedByTopics": recommended_by,
            "isRequired": len(required_by) > 0,
        })

    # Category counts
    cat_counts: Dict[str, int] = {}
    for mt in domain_math:
        cat = mt.get("category", "general")
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

    return {
        "domain": domain,
        "totalCount": len(domain_math),
        "categoryCounts": cat_counts,
        "topics": math_with_links,
    }


@router.get("/{domain}/topics/{topic_id}")
async def get_roadmap_topic(domain: str, topic_id: str):
    """Retrieve details for a single specific roadmap topic."""
    data = get_roadmaps_data()
    if domain not in data:
        raise HTTPException(status_code=404, detail=f"Roadmap domain '{domain}' not found")

    domain_data = data[domain]
    for lvl, topics in domain_data.get("levels", {}).items():
        for t in topics:
            if t.get("id") == topic_id:
                return {"domain": domain, "level": lvl, "topic": t}

    raise HTTPException(status_code=404, detail=f"Topic '{topic_id}' not found in '{domain}' roadmap")
