from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.catalog import CatalogResponse, CatalogSearchResult, CatalogShow
from app.services.publishing_service import build_catalogue_data, read_published_catalogue

router = APIRouter(prefix="/catalog", tags=["Viewer Public Catalogue"])


@router.get("", response_model=CatalogResponse)
def get_catalogue(db: Session = Depends(get_db)):
    """
    PUBLIC endpoint for viewers.
    Reads from the atomically generated catalogue.json file.
    If no publish run has occurred yet, generates a fresh view of published data.
    """
    catalog_data = read_published_catalogue()
    if not catalog_data.get("published_at"):
        # Fallback to building directly from published data if never published yet
        catalog_data = build_catalogue_data(db)
    return catalog_data


@router.get("/search", response_model=CatalogSearchResult)
def search_catalogue(
    q: Optional[str] = Query(None, description="Search query string matching title, episode, category, synopsis"),
    category: Optional[str] = Query(None, description="Filter by category (e.g. Drama, Animation)"),
    language: Optional[str] = Query(None, description="Filter by language (e.g. English, Hindi)"),
    section: Optional[str] = Query(None, description="Filter by section (e.g. Trending, Originals)"),
    db: Session = Depends(get_db),
):
    """
    PUBLIC search endpoint for viewers. Filters only published content.
    """
    catalog_data = read_published_catalogue()
    if not catalog_data.get("published_at"):
        catalog_data = build_catalogue_data(db)

    all_shows: List[dict] = catalog_data.get("all_shows", [])

    # Collect available filter options across all published shows
    all_categories = sorted(list({s.get("category") for s in all_shows if s.get("category")}))
    all_sections = sorted(list({s.get("section") for s in all_shows if s.get("section")}))
    all_languages = sorted(
        list({lang for s in all_shows for lang in s.get("available_languages", []) if lang})
    )

    results = []
    q_lower = q.strip().lower() if q else ""
    category_lower = category.strip().lower() if category else ""
    language_lower = language.strip().lower() if language else ""
    section_lower = section.strip().lower() if section else ""

    for show in all_shows:
        # Check query term (show title, synopsis, category, section, or episode titles)
        if q_lower:
            match_show_title = q_lower in (show.get("title") or "").lower()
            match_synopsis = q_lower in (show.get("synopsis") or "").lower()
            match_category = q_lower in (show.get("category") or "").lower()
            match_section = q_lower in (show.get("section") or "").lower()
            match_episodes = any(
                q_lower in (ep.get("title") or "").lower()
                for season in show.get("seasons", [])
                for ep in season.get("episodes", [])
            )
            if not (match_show_title or match_synopsis or match_category or match_section or match_episodes):
                continue

        # Check category filter
        if category_lower and (show.get("category") or "").lower() != category_lower:
            continue

        # Check section filter
        if section_lower and (show.get("section") or "").lower() != section_lower:
            continue

        # Check language filter
        if language_lower:
            show_langs = [l.lower() for l in show.get("available_languages", [])]
            if language_lower not in show_langs:
                continue

        results.append(show)

    return CatalogSearchResult(
        shows=results,
        total=len(results),
        categories=all_categories,
        sections=all_sections,
        languages=all_languages,
    )


@router.get("/shows/{id}", response_model=CatalogShow)
def get_catalog_show(id: int, db: Session = Depends(get_db)):
    """
    PUBLIC endpoint to fetch detail for a single published show.
    """
    catalog_data = read_published_catalogue()
    if not catalog_data.get("published_at"):
        catalog_data = build_catalogue_data(db)

    for show in catalog_data.get("all_shows", []):
        if show.get("id") == id:
            return show

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "SHOW_NOT_FOUND", "message": f"Show with id {id} not found in published catalogue."},
    )
