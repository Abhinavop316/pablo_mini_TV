from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.show import ItemStatus
from app.schemas.artwork import ArtworkOut
from app.schemas.season import SeasonOut


class ShowBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    synopsis: Optional[str] = None
    section: Optional[str] = Field(default=None, max_length=100)
    category: Optional[str] = Field(default=None, max_length=100)
    status: ItemStatus = ItemStatus.DRAFT


class ShowCreate(ShowBase):
    pass


class ShowUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    synopsis: Optional[str] = None
    section: Optional[str] = Field(default=None, max_length=100)
    category: Optional[str] = Field(default=None, max_length=100)
    status: Optional[ItemStatus] = None


class ShowOut(ShowBase):
    id: int
    created_at: datetime
    updated_at: datetime
    seasons: List[SeasonOut] = []
    artwork: List[ArtworkOut] = []

    class Config:
        from_attributes = True


class ShowListItem(ShowBase):
    id: int
    created_at: datetime
    updated_at: datetime
    seasons_count: int = 0
    episodes_count: int = 0
    artwork: List[ArtworkOut] = []

    class Config:
        from_attributes = True


class ShowListResponse(BaseModel):
    items: List[ShowListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class BulkDeleteShowsRequest(BaseModel):
    ids: List[int] = Field(..., min_length=1)


class BulkDeleteShowsResponse(BaseModel):
    success: bool
    deleted_count: int
    deleted_ids: List[int]
    message: str
