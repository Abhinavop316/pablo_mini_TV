from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ValidationErrorItem(BaseModel):
    entity_type: str  # "show" | "season" | "episode"
    entity_id: int
    title: str
    reason: str
    show_id: Optional[int] = None
    show_title: Optional[str] = None


class ValidationWarningItem(BaseModel):
    entity_type: str
    entity_id: int
    title: str
    reason: str


class ValidationReportResponse(BaseModel):
    can_publish: bool
    errors_count: int
    warnings_count: int
    errors: List[ValidationErrorItem] = []
    warnings: List[ValidationWarningItem] = []
