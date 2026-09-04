import enum
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class ArtworkType(str, enum.Enum):
    POSTER = "POSTER"
    BANNER = "BANNER"
    THUMBNAIL = "THUMBNAIL"


class Artwork(Base):
    __tablename__ = "artwork"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="CASCADE"), nullable=True, index=True)
    episode_id = Column(Integer, ForeignKey("episodes.id", ondelete="CASCADE"), nullable=True, index=True)
    type = Column(Enum(ArtworkType, name="artwork_type_enum", native_enum=False), nullable=False)
    url = Column(String(500), nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    aspect_ratio = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    show = relationship("Show", back_populates="artwork", foreign_keys=[show_id])
    episode = relationship("Episode", back_populates="artwork", foreign_keys=[episode_id])
