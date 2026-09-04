from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.dependencies.auth import require_editor
from app.models.season import Season
from app.models.show import Show
from app.models.user import User
from app.schemas.season import SeasonCreate, SeasonOut, SeasonUpdate

router = APIRouter(tags=["Admin Seasons"])


@router.get("/admin/shows/{show_id}/seasons", response_model=List[SeasonOut])
def list_seasons_for_show(
    show_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SHOW_NOT_FOUND", "message": f"Show with id {show_id} not found."},
        )

    seasons = (
        db.query(Season)
        .options(joinedload(Season.episodes))
        .filter(Season.show_id == show_id)
        .order_by(Season.season_number.asc())
        .all()
    )
    return seasons


@router.post("/admin/shows/{show_id}/seasons", response_model=SeasonOut, status_code=status.HTTP_201_CREATED)
def create_season(
    show_id: int,
    payload: SeasonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SHOW_NOT_FOUND", "message": f"Show with id {show_id} not found."},
        )

    season = Season(
        show_id=show_id,
        season_number=payload.season_number,
        title=payload.title.strip(),
    )
    db.add(season)
    db.commit()
    db.refresh(season)
    return season


@router.patch("/admin/seasons/{id}", response_model=SeasonOut)
def update_season(
    id: int,
    payload: SeasonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    season = db.query(Season).filter(Season.id == id).first()
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SEASON_NOT_FOUND", "message": f"Season with id {id} not found."},
        )

    if payload.season_number is not None:
        season.season_number = payload.season_number
    if payload.title is not None:
        season.title = payload.title.strip()

    db.commit()
    db.refresh(season)
    return season


@router.delete("/admin/seasons/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_season(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    season = db.query(Season).filter(Season.id == id).first()
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SEASON_NOT_FOUND", "message": f"Season with id {id} not found."},
        )
    db.delete(season)
    db.commit()
    return None
