from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import require_editor
from app.models.artwork import Artwork, ArtworkType
from app.models.episode import Episode
from app.models.show import Show
from app.models.user import User
from app.schemas.artwork import ArtworkOut
from app.services.artwork_validator import validate_artwork_image
from app.storage.service import get_storage

router = APIRouter(prefix="/admin/artwork", tags=["Admin Artwork"])


@router.post("", response_model=ArtworkOut, status_code=status.HTTP_201_CREATED)
async def upload_artwork(
    file: UploadFile = File(...),
    type: ArtworkType = Form(...),
    show_id: Optional[int] = Form(None),
    episode_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    # Validation of association
    if not show_id and not episode_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_ASSOCIATION", "message": "Artwork must be linked to either a show or an episode."},
        )

    if show_id:
        show = db.query(Show).filter(Show.id == show_id).first()
        if not show:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "SHOW_NOT_FOUND", "message": f"Show with id {show_id} not found."},
            )

    if episode_id:
        episode = db.query(Episode).filter(Episode.id == episode_id).first()
        if not episode:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "EPISODE_NOT_FOUND", "message": f"Episode with id {episode_id} not found."},
            )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_FILE", "message": "The uploaded file is empty."},
        )

    # Perform backend validation on dimensions, ratio, file size, format
    width, height, aspect_ratio = validate_artwork_image(file_bytes, type)

    # Upload using storage abstraction
    storage = get_storage()
    url = storage.upload(
        file_bytes=file_bytes,
        original_filename=file.filename or "artwork.jpg",
        content_type=file.content_type or "image/jpeg",
    )

    # If replacement for existing type on same show/episode, remove previous artwork
    if show_id:
        existing = db.query(Artwork).filter(Artwork.show_id == show_id, Artwork.type == type).first()
        if existing:
            storage.delete(existing.url)
            db.delete(existing)
    elif episode_id:
        existing = db.query(Artwork).filter(Artwork.episode_id == episode_id, Artwork.type == type).first()
        if existing:
            storage.delete(existing.url)
            db.delete(existing)

    artwork = Artwork(
        show_id=show_id,
        episode_id=episode_id,
        type=type,
        url=url,
        width=width,
        height=height,
        file_size=len(file_bytes),
        aspect_ratio=round(aspect_ratio, 3),
    )
    db.add(artwork)
    db.commit()
    db.refresh(artwork)
    return artwork


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_artwork(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    artwork = db.query(Artwork).filter(Artwork.id == id).first()
    if not artwork:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ARTWORK_NOT_FOUND", "message": f"Artwork with id {id} not found."},
        )

    storage = get_storage()
    storage.delete(artwork.url)

    db.delete(artwork)
    db.commit()
    return None
