from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.user import User, UserRole
from app.schemas.user import UserItemResponse, UserListResponse

router = APIRouter(prefix="/admin/users", tags=["Admin User Management"])


@router.get("", response_model=UserListResponse)
def list_users(
    search: Optional[str] = Query(None),
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    query = db.query(User)

    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter(or_(User.email.ilike(term), User.name.ilike(term), User.username.ilike(term)))

    if role:
        query = query.filter(User.role == role)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    query = query.order_by(User.id.asc())
    users = query.all()

    items = []
    for u in users:
        is_super = bool(
            u.is_superadmin
            or (u.email.lower() == settings.ADMIN_EMAIL.lower())
            or (u.username and u.username.lower() == settings.ADMIN_USERNAME.lower())
        )
        items.append(
            UserItemResponse(
                id=u.id,
                name=u.name,
                username=u.username,
                email=u.email,
                role=u.role,
                is_active=u.is_active,
                is_verified=u.is_verified,
                is_superadmin=is_super,
                has_pending_setup=False,
                created_at=u.created_at,
                updated_at=u.updated_at,
            )
        )

    return UserListResponse(items=items, total=len(items))


@router.post("", status_code=status.HTTP_403_FORBIDDEN)
def create_user(admin_user: User = Depends(get_current_admin)):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"code": "ROLE_CREATION_DISABLED", "message": "User and role creation is disabled. The system uses fixed Admin and Editor accounts."},
    )


@router.delete("/{user_id}", status_code=status.HTTP_403_FORBIDDEN)
def delete_user(user_id: int, admin_user: User = Depends(get_current_admin)):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"code": "ROLE_DELETION_DISABLED", "message": "User and role deletion is disabled. The system uses fixed Admin and Editor accounts."},
    )




