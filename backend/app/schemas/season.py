from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.episode import EpisodeOut


class SeasonBase(BaseModel):
    season_number: int = Field(default=1, ge=0)
    title: str = Field(..., min_length=1, max_length=255)


class SeasonCreate(SeasonBase):
    pass


class SeasonUpdate(BaseModel):
    season_number: Optional[int] = Field(default=None, ge=0)
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)


class SeasonOut(SeasonBase):
    id: int
    show_id: int
    created_at: datetime
    updated_at: datetime
    episodes: List[EpisodeOut] = []

    class Config:
        from_attributes = True
