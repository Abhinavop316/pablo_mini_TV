from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.publish_run import PublishStatus


class PublishRunOut(BaseModel):
    id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    triggered_by: str
    status: PublishStatus
    shows_count: int
    episodes_count: int
    catalogue_size: int
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PublishTriggerResponse(BaseModel):
    message: str
    publish_run: PublishRunOut


class PublishHistoryResponse(BaseModel):
    items: List[PublishRunOut]
    total: int
