from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import require_editor
from app.models.user import User
from app.schemas.validation import ValidationReportResponse
from app.services.validation_service import generate_validation_report

router = APIRouter(prefix="/admin", tags=["Admin Validation"])


@router.get("/validation-report", response_model=ValidationReportResponse)
def get_validation_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    return generate_validation_report(db)
