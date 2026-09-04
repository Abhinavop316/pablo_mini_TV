import enum
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Enum, Integer, String, Text
from app.database import Base


class PublishStatus(str, enum.Enum):
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class PublishRun(Base):
    __tablename__ = "publish_runs"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    triggered_by = Column(String(255), nullable=False)
    status = Column(Enum(PublishStatus, name="publish_status_enum", native_enum=False), default=PublishStatus.RUNNING, nullable=False)
    shows_count = Column(Integer, default=0, nullable=False)
    episodes_count = Column(Integer, default=0, nullable=False)
    catalogue_size = Column(Integer, default=0, nullable=False)  # in bytes
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
