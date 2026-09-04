import enum
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.show import ItemStatus


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(Integer, primary_key=True, index=True)
    season_id = Column(Integer, ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False, index=True)
    episode_number = Column(Integer, default=1, nullable=False)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    duration = Column(Integer, nullable=True)  # in seconds
    language = Column(String(50), nullable=False, default="English", index=True)
    content_group = Column(String(100), nullable=False, index=True)
    status = Column(Enum(ItemStatus, name="episode_status_enum", native_enum=False), default=ItemStatus.DRAFT, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    season = relationship("Season", back_populates="episodes")
    artwork = relationship("Artwork", back_populates="episode", cascade="all, delete-orphan", foreign_keys="Artwork.episode_id")

    __table_args__ = (
        UniqueConstraint("content_group", "language", name="uq_content_group_language"),
    )
