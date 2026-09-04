from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.dependencies.auth import require_editor
from app.models.artwork import Artwork, ArtworkType
from app.models.episode import Episode
from app.models.season import Season
from app.models.show import ItemStatus
from app.models.user import User
from app.schemas.episode import EpisodeCreate, EpisodeOut, EpisodeUpdate

router = APIRouter(tags=["Admin Episodes"])


@router.get("/admin/seasons/{season_id}/episodes", response_model=List[EpisodeOut])
def list_episodes_for_season(
    season_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SEASON_NOT_FOUND", "message": f"Season with id {season_id} not found."},
        )

    episodes = (
        db.query(Episode)
        .options(joinedload(Episode.artwork))
        .filter(Episode.season_id == season_id)
        .order_by(Episode.episode_number.asc())
        .all()
    )
    return episodes


@router.post("/admin/seasons/{season_id}/episodes", response_model=EpisodeOut, status_code=status.HTTP_201_CREATED)
def create_episode(
    season_id: int,
    payload: EpisodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SEASON_NOT_FOUND", "message": f"Season with id {season_id} not found."},
        )

    # Check unique constraint on (content_group, language)
    existing_cgroup = (
        db.query(Episode)
        .filter(
            Episode.content_group == payload.content_group.strip(),
            Episode.language == payload.language.strip(),
        )
        .first()
    )
    if existing_cgroup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_CONTENT_GROUP_LANGUAGE",
                "message": f"An episode already exists for content group '{payload.content_group}' and language '{payload.language}'.",
            },
        )

    # Published episode validation
    if payload.status == ItemStatus.PUBLISHED and (payload.duration is None or payload.duration <= 0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "A published episode must have a valid duration."},
        )

    episode = Episode(
        season_id=season_id,
        episode_number=payload.episode_number,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        duration=payload.duration,
        language=payload.language.strip(),
        content_group=payload.content_group.strip(),
        status=payload.status,
    )

    try:
        db.add(episode)
        db.commit()
        db.refresh(episode)
        return episode
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_CONTENT_GROUP_LANGUAGE",
                "message": f"An episode already exists for content group '{payload.content_group}' and language '{payload.language}'.",
            },
        )


@router.get("/admin/episodes/{id}", response_model=EpisodeOut)
def get_episode(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    episode = (
        db.query(Episode)
        .options(joinedload(Episode.artwork))
        .filter(Episode.id == id)
        .first()
    )
    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "EPISODE_NOT_FOUND", "message": f"Episode with id {id} not found."},
        )
    return episode


@router.patch("/admin/episodes/{id}", response_model=EpisodeOut)
def update_episode(
    id: int,
    payload: EpisodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    episode = db.query(Episode).filter(Episode.id == id).first()
    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "EPISODE_NOT_FOUND", "message": f"Episode with id {id} not found."},
        )

    target_status = payload.status if payload.status is not None else episode.status
    target_duration = payload.duration if payload.duration is not None else episode.duration
    target_cgroup = payload.content_group.strip() if payload.content_group is not None else episode.content_group
    target_lang = payload.language.strip() if payload.language is not None else episode.language

    # Check unique constraint if changing group/language
    if (payload.content_group is not None and payload.content_group.strip() != episode.content_group) or (
        payload.language is not None and payload.language.strip() != episode.language
    ):
        duplicate = (
            db.query(Episode)
            .filter(
                Episode.content_group == target_cgroup,
                Episode.language == target_lang,
                Episode.id != id,
            )
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DUPLICATE_CONTENT_GROUP_LANGUAGE",
                    "message": f"An episode already exists for content group '{target_cgroup}' and language '{target_lang}'.",
                },
            )

    # Published episode validation
    if target_status == ItemStatus.PUBLISHED:
        if target_duration is None or target_duration <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "VALIDATION_ERROR", "message": "Episode cannot be published because duration is missing."},
            )
        has_thumbnail = (
            db.query(Artwork)
            .filter(Artwork.episode_id == id, Artwork.type == ArtworkType.THUMBNAIL)
            .first()
        )
        if not has_thumbnail:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "VALIDATION_ERROR", "message": "Episode cannot be published because thumbnail artwork is missing."},
            )

    if payload.episode_number is not None:
        episode.episode_number = payload.episode_number
    if payload.title is not None:
        episode.title = payload.title.strip()
    if payload.description is not None:
        episode.description = payload.description.strip() if payload.description else None
    if payload.duration is not None:
        episode.duration = payload.duration
    if payload.language is not None:
        episode.language = payload.language.strip()
    if payload.content_group is not None:
        episode.content_group = payload.content_group.strip()
    if payload.status is not None:
        episode.status = payload.status

    try:
        db.commit()
        db.refresh(episode)
        return episode
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_CONTENT_GROUP_LANGUAGE",
                "message": f"An episode already exists for content group '{target_cgroup}' and language '{target_lang}'.",
            },
        )


@router.delete("/admin/episodes/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_episode(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    episode = db.query(Episode).filter(Episode.id == id).first()
    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "EPISODE_NOT_FOUND", "message": f"Episode with id {id} not found."},
        )
    db.delete(episode)
    db.commit()
    return None
