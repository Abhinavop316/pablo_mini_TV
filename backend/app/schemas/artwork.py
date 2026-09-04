from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.artwork import ArtworkType


class ArtworkOut(BaseModel):
    id: int
    show_id: Optional[int] = None
    episode_id: Optional[int] = None
    type: ArtworkType
    url: str
    width: int
    height: int
    file_size: int
    aspect_ratio: float
    created_at: datetime

    class Config:
        from_attributes = True
