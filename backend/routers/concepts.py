"""Concept CRUD endpoints."""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from models.concept import CategoryCount, Concept, GraphResponse
from services.concept_service import (
    get_all_concepts,
    get_categories,
    get_concept_by_id,
    get_graph,
)

router = APIRouter(prefix="/api/concepts", tags=["concepts"])


@router.get("/graph", response_model=GraphResponse)
async def concepts_graph():
    """Return nodes and edges for the knowledge graph."""
    return get_graph()


@router.get("/categories", response_model=list[CategoryCount])
async def concepts_categories():
    """Return distinct categories with counts."""
    return get_categories()


@router.get("", response_model=list[Concept])
@router.get("/", response_model=list[Concept], include_in_schema=False)
async def list_concepts(
    domain: Optional[str] = Query(None, description="Filter by domain: data-science, machine-learning, deep-learning"),
    level: Optional[str] = Query(None, description="Filter by level: basic, intermediate, advanced"),
):
    """Return all concepts, optionally filtered by domain and/or level."""
    concepts = get_all_concepts()
    if domain:
        concepts = [c for c in concepts if getattr(c, "domain", None) == domain]
    if level:
        concepts = [c for c in concepts if getattr(c, "level", None) == level]
    return concepts


@router.get("/{concept_id}", response_model=Concept)
async def get_concept(concept_id: str):
    """Return a single concept by ID."""
    concept = get_concept_by_id(concept_id)
    if concept is None:
        raise HTTPException(status_code=404, detail=f"Concept '{concept_id}' not found")
    return concept
