import enum
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class ItemStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"


class Show(Base):
    __tablename__ = "shows"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    synopsis = Column(Text, nullable=True)
    section = Column(String(100), nullable=True, index=True)
    category = Column(String(100), nullable=True, index=True)
    status = Column(Enum(ItemStatus, name="show_status_enum", native_enum=False), default=ItemStatus.DRAFT, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    seasons = relationship("Season", back_populates="show", cascade="all, delete-orphan", order_by="Season.season_number")
    artwork = relationship("Artwork", back_populates="show", cascade="all, delete-orphan", foreign_keys="Artwork.show_id")
