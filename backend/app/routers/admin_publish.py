from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import require_admin, require_editor
from app.models.publish_run import PublishRun
from app.models.user import User
from app.schemas.publish import PublishHistoryResponse, PublishRunOut, PublishTriggerResponse
from app.services.publishing_service import publish_catalog_atomic

router = APIRouter(prefix="/admin/catalog", tags=["Admin Publishing"])


@router.post("/publish", response_model=PublishTriggerResponse)
def trigger_catalog_publish(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),  # STRICTLY ENFORCED: ADMIN ONLY
):
    publish_run = publish_catalog_atomic(db=db, triggered_by=current_user.email)
    return PublishTriggerResponse(
        message="Catalogue published successfully.",
        publish_run=publish_run,
    )


@router.get("/publish-runs", response_model=PublishHistoryResponse)
def list_publish_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    query = db.query(PublishRun).order_by(PublishRun.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PublishHistoryResponse(
        items=items,
        total=total,
    )


@router.get("/shows-timeline")
def get_shows_publication_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    from app.models.show import Show
    from app.models.artwork import ArtworkType
    shows = db.query(Show).order_by(Show.title.asc()).all()
    latest_run = (
        db.query(PublishRun)
        .filter(PublishRun.status == "SUCCESS")
        .order_by(PublishRun.completed_at.desc())
        .first()
    )

    result = []
    for show in shows:
        seasons_data = []
        for season in sorted(show.seasons, key=lambda s: s.season_number):
            episodes_data = []
            for ep in sorted(season.episodes, key=lambda e: (e.episode_number, e.id)):
                episodes_data.append({
                    "id": ep.id,
                    "episode_number": ep.episode_number,
                    "title": ep.title,
                    "language": ep.language,
                    "duration": ep.duration,
                    "content_group": ep.content_group,
                    "status": ep.status.value if hasattr(ep.status, "value") else str(ep.status),
                    "created_at": ep.created_at,
                    "updated_at": ep.updated_at,
                })
            pub_count = sum(1 for e in season.episodes if (e.status.value if hasattr(e.status, "value") else str(e.status)) == "PUBLISHED")
            seasons_data.append({
                "id": season.id,
                "season_number": season.season_number,
                "title": season.title,
                "created_at": season.created_at,
                "updated_at": season.updated_at,
                "episodes_count": len(season.episodes),
                "published_episodes_count": pub_count,
                "episodes": episodes_data,
            })

        poster = next((a.url for a in show.artwork if a.type == ArtworkType.POSTER), None)
        banner = next((a.url for a in show.artwork if a.type == ArtworkType.BANNER), None)

        result.append({
            "id": show.id,
            "title": show.title,
            "synopsis": show.synopsis,
            "section": show.section,
            "category": show.category,
            "status": show.status.value if hasattr(show.status, "value") else str(show.status),
            "created_at": show.created_at,
            "updated_at": show.updated_at,
            "poster_url": poster,
            "banner_url": banner,
            "seasons_count": len(show.seasons),
            "episodes_count": sum(len(s.episodes) for s in show.seasons),
            "published_episodes_count": sum(s["published_episodes_count"] for s in seasons_data),
            "seasons": seasons_data,
        })

    return {
        "latest_publish_run": {
            "id": latest_run.id,
            "completed_at": latest_run.completed_at,
            "triggered_by": latest_run.triggered_by,
            "shows_count": latest_run.shows_count,
            "episodes_count": latest_run.episodes_count,
        } if latest_run else None,
        "shows": result,
    }
