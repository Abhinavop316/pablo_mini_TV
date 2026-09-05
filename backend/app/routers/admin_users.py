import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.auth.security import hash_password
from app.config import settings
from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.user import User, UserRole
from app.schemas.user import (
    SendSetupEmailResponse,
    SetupTokenResponse,
    UserCreateRequest,
    UserItemResponse,
    UserListResponse,
    UserStatusUpdateRequest,
)

from app.services.email_service import send_password_setup_email

router = APIRouter(prefix="/admin/users", tags=["Admin User Management"])


def generate_setup_token(user: User, db: Session, expires_days: int = 7) -> SetupTokenResponse:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=expires_days)
    user.setup_token = token
    user.setup_token_expires_at = expires_at
    db.commit()
    db.refresh(user)

    setup_url = f"{settings.FRONTEND_URL}/setup-password?token={token}"

    # Dispatch email to recipient with personalized name
    email_result = send_password_setup_email(user.email, setup_url, expires_days, user_name=user.name)

    return SetupTokenResponse(
        user_id=user.id,
        name=user.name,
        email=user.email,
        setup_token=token,
        setup_url=setup_url,
        expires_at=expires_at,
        email_sent=email_result.get("sent", True),
        email_message=email_result.get("message"),
    )



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
        query = query.filter(or_(User.email.ilike(term), User.name.ilike(term)))

    if role:
        query = query.filter(User.role == role)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    query = query.order_by(User.id.asc())
    users = query.all()

    items = []
    for u in users:
        items.append(
            UserItemResponse(
                id=u.id,
                name=u.name,
                email=u.email,
                role=u.role,
                is_active=u.is_active,
                is_verified=u.is_verified,
                has_pending_setup=bool(u.setup_token and (not u.setup_token_expires_at or u.setup_token_expires_at > datetime.now(timezone.utc))),
                created_at=u.created_at,
                updated_at=u.updated_at,
            )
        )

    return UserListResponse(items=items, total=len(items))


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_user(
    request: UserCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    clean_email = request.email.strip().lower()
    clean_name = request.name.strip() if request.name and request.name.strip() else None

    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMAIL_EXISTS", "message": f"User with email '{clean_email}' already exists."},
        )

    # Generates a random temporary hash until editor sets their own password via email verification
    temp_pwd = secrets.token_hex(16)
    pwd_hash = hash_password(temp_pwd)
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    new_user = User(
        name=clean_name,
        email=clean_email,
        password_hash=pwd_hash,
        role=request.role,
        is_active=True,
        is_verified=False,
        setup_token=token,
        setup_token_expires_at=expires_at,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    setup_url = f"{settings.FRONTEND_URL}/setup-password?token={token}"

    # Send setup invitation email directly to recipient with personalized name
    email_result = send_password_setup_email(clean_email, setup_url, expires_days=7, user_name=clean_name)

    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role,
        "message": f"Invitation and password setup link sent to {clean_email}.",
        "setup_token": token,
        "setup_url": setup_url,
        "expires_at": expires_at.isoformat(),
        "email_sent": email_result.get("sent", True),
        "email_message": email_result.get("message"),
    }


@router.post("/{user_id}/generate-setup-token", response_model=SetupTokenResponse)
def generate_user_setup_token(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )

    return generate_setup_token(user, db)


@router.post("/{user_id}/send-setup-email", response_model=SendSetupEmailResponse)
def send_user_setup_email(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )

    # If user doesn't have an active token or it has expired, generate a new one
    now_utc = datetime.now(timezone.utc)
    if not user.setup_token or (user.setup_token_expires_at and user.setup_token_expires_at < now_utc):
        token_info = generate_setup_token(user, db)
        return SendSetupEmailResponse(
            success=token_info.email_sent,
            email=user.email,
            message=token_info.email_message or f"Setup email sent to {user.email}",
            setup_url=token_info.setup_url,
        )

    setup_url = f"{settings.FRONTEND_URL}/setup-password?token={user.setup_token}"
    email_result = send_password_setup_email(user.email, setup_url, expires_days=7, user_name=user.name)

    return SendSetupEmailResponse(
        success=email_result.get("sent", True),
        email=user.email,
        message=email_result.get("message", f"Setup email sent to {user.email}"),
        setup_url=setup_url,
    )

    return {"success": True, "message": f"Password directly updated for {user.email}."}


@router.patch("/{user_id}/status")
def update_user_status(
    user_id: int,
    request: UserStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )

    if user.id == admin_user.id and not request.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SELF_DEACTIVATION", "message": "You cannot deactivate your own active admin account."},
        )

    user.is_active = request.is_active
    db.commit()

    return {"success": True, "id": user.id, "is_active": user.is_active}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )

    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SELF_DELETION", "message": "You cannot delete your own admin account."},
        )

    db.delete(user)
    db.commit()

    return {"success": True, "message": f"User {user.email} deleted successfully."}
