from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import distinct, func, or_
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.dependencies.auth import require_editor
from app.models.artwork import Artwork
from app.models.episode import Episode
from app.models.season import Season
from app.models.show import ItemStatus, Show
from app.models.user import User
from app.schemas.show import (
    BulkDeleteShowsRequest,
    BulkDeleteShowsResponse,
    ShowCreate,
    ShowListItem,
    ShowListResponse,
    ShowOut,
    ShowUpdate,
)
from app.services.publishing_service import publish_catalog_atomic
from app.services.validation_service import validate_single_show

router = APIRouter(prefix="/admin/shows", tags=["Admin Shows"])


@router.get("", response_model=ShowListResponse)
def list_shows(
    search: Optional[str] = Query(None, description="Search term for title/synopsis/category"),
    section: Optional[str] = Query(None, description="Filter by section"),
    status: Optional[ItemStatus] = Query(None, description="Filter by status"),
    language: Optional[str] = Query(None, description="Filter by episode language"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    query = db.query(Show)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Show.title.ilike(search_filter),
                Show.synopsis.ilike(search_filter),
                Show.category.ilike(search_filter),
                Show.section.ilike(search_filter),
            )
        )

    if section:
        query = query.filter(Show.section == section.strip())

    if status:
        query = query.filter(Show.status == status)

    if language:
        # Filter shows that have episodes in the given language
        query = query.join(Season, Show.id == Season.show_id).join(
            Episode, Season.id == Episode.season_id
        ).filter(Episode.language.ilike(language.strip())).distinct()

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    shows = (
        query.order_by(Show.updated_at.desc(), Show.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for s in shows:
        seasons_cnt = db.query(Season).filter(Season.show_id == s.id).count()
        episodes_cnt = (
            db.query(Episode)
            .join(Season, Episode.season_id == Season.id)
            .filter(Season.show_id == s.id)
            .count()
        )
        artwork_items = db.query(Artwork).filter(Artwork.show_id == s.id).all()
        items.append(
            ShowListItem(
                id=s.id,
                title=s.title,
                synopsis=s.synopsis,
                section=s.section,
                category=s.category,
                status=s.status,
                created_at=s.created_at,
                updated_at=s.updated_at,
                seasons_count=seasons_cnt,
                episodes_count=episodes_cnt,
                artwork=artwork_items,
            )
        )

    return ShowListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=ShowOut, status_code=status.HTTP_201_CREATED)
def create_show(
    payload: ShowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    # Validation: A published show must have a section
    if payload.status == ItemStatus.PUBLISHED and (not payload.section or not payload.section.strip()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "A published show must have a valid section specified."},
        )

    show = Show(
        title=payload.title.strip(),
        synopsis=payload.synopsis.strip() if payload.synopsis else None,
        section=payload.section.strip() if payload.section else None,
        category=payload.category.strip() if payload.category else None,
        status=payload.status,
    )
    db.add(show)
    db.commit()
    db.refresh(show)
    return show


@router.get("/{id}", response_model=ShowOut)
def get_show(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    show = (
        db.query(Show)
        .options(
            joinedload(Show.seasons).joinedload(Season.episodes).joinedload(Episode.artwork),
            joinedload(Show.artwork),
        )
        .filter(Show.id == id)
        .first()
    )
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SHOW_NOT_FOUND", "message": f"Show with id {id} not found."},
        )
    return show


@router.patch("/{id}", response_model=ShowOut)
def update_show(
    id: int,
    payload: ShowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    show = db.query(Show).filter(Show.id == id).first()
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SHOW_NOT_FOUND", "message": f"Show with id {id} not found."},
        )

    target_status = payload.status if payload.status is not None else show.status
    target_section = payload.section if payload.section is not None else show.section

    if target_status == ItemStatus.PUBLISHED and (not target_section or not target_section.strip()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "A published show must have a valid section specified."},
        )

    if payload.title is not None:
        show.title = payload.title.strip()
    if payload.synopsis is not None:
        show.synopsis = payload.synopsis.strip() if payload.synopsis else None
    if payload.section is not None:
        show.section = payload.section.strip() if payload.section else None
    if payload.category is not None:
        show.category = payload.category.strip() if payload.category else None
    if payload.status is not None:
        show.status = payload.status

    db.commit()
    db.refresh(show)
    return show


@router.post("/batch-delete", response_model=BulkDeleteShowsResponse)
def batch_delete_shows(
    payload: BulkDeleteShowsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    if not payload.ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_IDS", "message": "No show IDs provided for deletion."},
        )

    shows = db.query(Show).filter(Show.id.in_(payload.ids)).all()
    if not shows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SHOWS_NOT_FOUND", "message": "None of the specified shows were found."},
        )

    deleted_ids = []
    any_published = False
    for show in shows:
        if show.status == ItemStatus.PUBLISHED:
            any_published = True
        deleted_ids.append(show.id)
        db.delete(show)

    db.commit()

    if any_published:
        publish_catalog_atomic(
            db,
            triggered_by=f"{current_user.email} (Batch deleted {len(deleted_ids)} shows)",
            notes=f"Deleted show IDs: {deleted_ids}",
        )

    return BulkDeleteShowsResponse(
        success=True,
        deleted_count=len(deleted_ids),
        deleted_ids=deleted_ids,
        message=f"Successfully deleted {len(deleted_ids)} show(s).",
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_show(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    show = db.query(Show).filter(Show.id == id).first()
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SHOW_NOT_FOUND", "message": f"Show with id {id} not found."},
        )
    was_published = show.status == ItemStatus.PUBLISHED
    show_title = show.title
    db.delete(show)
    db.commit()

    if was_published:
        publish_catalog_atomic(
            db,
            triggered_by=f"{current_user.email} (Deleted Show: {show_title})",
        )

    return None


@router.post("/{id}/publish", response_model=ShowOut)
def publish_single_show(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    show = (
        db.query(Show)
        .options(
            joinedload(Show.seasons).joinedload(Season.episodes).joinedload(Episode.artwork),
            joinedload(Show.artwork),
        )
        .filter(Show.id == id)
        .first()
    )
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SHOW_NOT_FOUND", "message": f"Show with id {id} not found."},
        )

    # Validate the show
    errors = validate_single_show(db, show)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "SHOW_VALIDATION_FAILED",
                "message": f"Cannot publish '{show.title}': {len(errors)} validation issue(s) detected.",
                "errors": [e.model_dump() for e in errors],
            },
        )

    show.status = ItemStatus.PUBLISHED
    db.commit()
    db.refresh(show)

    # Atomically build and deploy live catalogue.json
    publish_catalog_atomic(db, triggered_by=f"{current_user.email} (Published Show: {show.title})")

    return show


@router.post("/{id}/unpublish", response_model=ShowOut)
def unpublish_single_show(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    show = (
        db.query(Show)
        .options(
            joinedload(Show.seasons).joinedload(Season.episodes).joinedload(Episode.artwork),
            joinedload(Show.artwork),
        )
        .filter(Show.id == id)
        .first()
    )
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SHOW_NOT_FOUND", "message": f"Show with id {id} not found."},
        )

    show.status = ItemStatus.DRAFT
    db.commit()
    db.refresh(show)

    # Atomically rebuild and update live catalogue.json
    publish_catalog_atomic(db, triggered_by=f"{current_user.email} (Unpublished Show: {show.title})")

    return show

