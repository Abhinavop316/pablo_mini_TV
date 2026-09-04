from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class CatalogEpisode(BaseModel):
    id: int
    content_group: str
    episode_number: int
    title: str
    description: Optional[str] = None
    duration: Optional[int] = None
    languages: List[str] = []
    thumbnail_url: Optional[str] = None


class CatalogTrailer(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    duration: Optional[int] = None
    languages: List[str] = []
    thumbnail_url: Optional[str] = None


class CatalogSeason(BaseModel):
    id: int
    season_number: int
    title: str
    episodes: List[CatalogEpisode] = []


class CatalogShow(BaseModel):
    id: int
    title: str
    synopsis: Optional[str] = None
    section: Optional[str] = None
    category: Optional[str] = None
    poster_url: Optional[str] = None
    banner_url: Optional[str] = None
    trailers: List[CatalogTrailer] = []
    seasons: List[CatalogSeason] = []
    available_languages: List[str] = []
    total_episodes: int = 0


class CatalogSection(BaseModel):
    name: str
    shows: List[CatalogShow] = []


class CatalogResponse(BaseModel):
    published_at: str
    sections: List[CatalogSection] = []
    featured_show: Optional[CatalogShow] = None
    all_shows: List[CatalogShow] = []


class CatalogSearchResult(BaseModel):
    shows: List[CatalogShow] = []
    total: int
    categories: List[str] = []
    sections: List[str] = []
    languages: List[str] = []
