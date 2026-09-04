from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import require_admin, require_editor
from app.models.publish_run import PublishRun
from app.models.user import User
from app.schemas.publish import PublishHistoryResponse, PublishRunOut, PublishTriggerResponse
from app.services.publishing_service import publish_catalog_atomic

router = APIRouter(prefix="/admin/catalog", tags=["Admin Publishing"])


@router.post("/publish", response_model=PublishTriggerResponse)
def trigger_catalog_publish(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),  # STRICTLY ENFORCED: ADMIN ONLY
):
    publish_run = publish_catalog_atomic(db=db, triggered_by=current_user.email)
    return PublishTriggerResponse(
        message="Catalogue published successfully.",
        publish_run=publish_run,
    )


@router.get("/publish-runs", response_model=PublishHistoryResponse)
def list_publish_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    query = db.query(PublishRun).order_by(PublishRun.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PublishHistoryResponse(
        items=items,
        total=total,
    )
