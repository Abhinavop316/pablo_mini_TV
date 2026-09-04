from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.show import ItemStatus
from app.schemas.artwork import ArtworkOut


class EpisodeBase(BaseModel):
    episode_number: int = Field(default=1, ge=1)
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    duration: Optional[int] = Field(default=None, ge=0)
    language: str = Field(default="English", min_length=1, max_length=50)
    content_group: str = Field(..., min_length=1, max_length=100)
    status: ItemStatus = ItemStatus.DRAFT


class EpisodeCreate(EpisodeBase):
    pass


class EpisodeUpdate(BaseModel):
    episode_number: Optional[int] = Field(default=None, ge=1)
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    duration: Optional[int] = Field(default=None, ge=0)
    language: Optional[str] = Field(default=None, min_length=1, max_length=50)
    content_group: Optional[str] = Field(default=None, min_length=1, max_length=100)
    status: Optional[ItemStatus] = None


class EpisodeOut(EpisodeBase):
    id: int
    season_id: int
    created_at: datetime
    updated_at: datetime
    artwork: List[ArtworkOut] = []

    class Config:
        from_attributes = True


class EpisodeListResponse(BaseModel):
    items: List[EpisodeOut]
    total: int
    page: int
    page_size: int
