import random
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.auth.security import hash_password
from app.config import settings
from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.user import User, UserRole
from app.schemas.user import (
    CheckUsernameResponse,
    SendSetupEmailResponse,
    SetupTokenResponse,
    UserCreateRequest,
    UserItemResponse,
    UserListResponse,
    UserStatusUpdateRequest,
)
from app.services.email_service import send_password_setup_email

router = APIRouter(prefix="/admin/users", tags=["Admin User Management"])


def generate_setup_token(user: User, db: Session, expires_days: int = 7, temporary_password: Optional[str] = None) -> SetupTokenResponse:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=expires_days)
    user.setup_token = token
    user.setup_token_expires_at = expires_at
    db.commit()
    db.refresh(user)

    setup_url = f"{settings.FRONTEND_URL}/setup-password?token={token}"

    # Dispatch email to recipient with personalized name, username, and temporary credentials
    email_result = send_password_setup_email(
        recipient_email=user.email,
        setup_url=setup_url,
        expires_days=expires_days,
        user_name=user.name,
        username=user.username,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        temporary_password=temporary_password,
    )

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


@router.get("/check-username", response_model=CheckUsernameResponse)
def check_username_availability(
    username: str = Query(..., min_length=1, max_length=50),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    cleaned = re.sub(r"[^a-zA-Z0-9_\-\.]", "", username.strip().lower())
    if len(cleaned) < 3:
        return CheckUsernameResponse(
            username=cleaned,
            available=False,
            suggestions=[],
            message="Username must be at least 3 alphanumeric characters.",
        )

    existing = db.query(User).filter(User.username.ilike(cleaned)).first()
    if not existing:
        return CheckUsernameResponse(
            username=cleaned,
            available=True,
            suggestions=[],
            message=f"@{cleaned} is available!",
        )

    # Generate smart, guaranteed-available suggestions
    raw_candidates = [
        f"{cleaned}_peblo",
        f"{cleaned}_tv",
        f"{cleaned}_studio",
        f"{cleaned}2026",
        f"{cleaned}{random.randint(10, 99)}",
        f"{cleaned}{random.randint(100, 999)}",
        f"team_{cleaned}",
        f"{cleaned}_editor",
    ]

    # Query DB to filter out taken handles
    existing_handles = {
        u.username.lower() for u in db.query(User.username).filter(User.username.in_(raw_candidates)).all() if u.username
    }

    available_suggestions: List[str] = [c for c in raw_candidates if c.lower() not in existing_handles][:4]

    return CheckUsernameResponse(
        username=cleaned,
        available=False,
        suggestions=available_suggestions,
        message=f"@{cleaned} is already taken.",
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
        query = query.filter(or_(User.email.ilike(term), User.name.ilike(term), User.username.ilike(term)))

    if role:
        query = query.filter(User.role == role)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    query = query.order_by(User.id.asc())
    users = query.all()

    items = []
    for u in users:
        is_super = bool(u.is_superadmin or (u.email.lower() == settings.ADMIN_EMAIL.lower()) or (u.username and u.username.lower() == settings.ADMIN_USERNAME.lower()))
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

    clean_username = None
    if request.username and request.username.strip():
        clean_username = re.sub(r"[^a-zA-Z0-9_\-\.]", "", request.username.strip().lower())
        if len(clean_username) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_USERNAME", "message": "Username must be at least 3 characters long."},
            )
        existing_username = db.query(User).filter(User.username == clean_username).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "USERNAME_EXISTS", "message": f"Username '@{clean_username}' is already taken. Please choose another username."},
            )

    existing_email = db.query(User).filter(User.email == clean_email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMAIL_EXISTS", "message": f"User with email '{clean_email}' already exists."},
        )

    # Temporary placeholder password hash until invited member configures their own
    temp_pwd = secrets.token_hex(16)
    pwd_hash = hash_password(temp_pwd)
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    new_user = User(
        name=clean_name,
        username=clean_username,
        email=clean_email,
        password_hash=pwd_hash,
        role=request.role,
        is_active=True,
        is_verified=False,
        is_superadmin=False,
        setup_token=token,
        setup_token_expires_at=expires_at,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    setup_url = f"{settings.FRONTEND_URL}/setup-password?token={token}"

    # Send setup invitation email directly to recipient
    email_result = send_password_setup_email(
        recipient_email=clean_email,
        setup_url=setup_url,
        expires_days=7,
        user_name=clean_name,
        username=clean_username,
        role=request.role.value if hasattr(request.role, "value") else str(request.role),
    )

    return {
        "id": new_user.id,
        "name": new_user.name,
        "username": new_user.username,
        "email": new_user.email,
        "role": new_user.role,
        "message": f"Invitation and setup email sent to {clean_email}.",
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
    email_result = send_password_setup_email(
        recipient_email=user.email,
        setup_url=setup_url,
        expires_days=7,
        user_name=user.name,
        username=user.username,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
    )

    return SendSetupEmailResponse(
        success=email_result.get("sent", True),
        email=user.email,
        message=email_result.get("message", f"Setup email sent to {user.email}"),
        setup_url=setup_url,
    )


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

    # Protect Root SuperAdmin from deactivation
    if user.is_superadmin or user.email.lower() == settings.ADMIN_EMAIL.lower() or (user.username and user.username.lower() == settings.ADMIN_USERNAME.lower()):
        if not request.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "SUPERADMIN_PROTECTED", "message": "Root SuperAdmin cannot be deactivated."},
            )

    if user.id == admin_user.id and not request.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SELF_DEACTIVATION", "message": "You cannot deactivate your own active admin account."},
        )

    # Check caller privileges: SuperAdmin can modify both Admins and Editors; regular Admin can only modify Editors
    is_caller_superadmin = bool(
        admin_user.is_superadmin
        or (admin_user.email.lower() == settings.ADMIN_EMAIL.lower())
        or (admin_user.username and admin_user.username.lower() == settings.ADMIN_USERNAME.lower())
    )

    if user.role == UserRole.ADMIN and not is_caller_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "SUPERADMIN_REQUIRED", "message": "Only the Super Admin can suspend administrator accounts."},
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

    # Protect Root SuperAdmin from deletion
    if user.is_superadmin or user.email.lower() == settings.ADMIN_EMAIL.lower() or (user.username and user.username.lower() == settings.ADMIN_USERNAME.lower()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "SUPERADMIN_PROTECTED", "message": "Root SuperAdmin account cannot be removed."},
        )

    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SELF_DELETION", "message": "You cannot delete your own admin account."},
        )

    # SuperAdmin can remove both created Admins and Editors; regular Admin can only remove Editors
    is_caller_superadmin = bool(
        admin_user.is_superadmin
        or (admin_user.email.lower() == settings.ADMIN_EMAIL.lower())
        or (admin_user.username and admin_user.username.lower() == settings.ADMIN_USERNAME.lower())
    )

    if user.role == UserRole.ADMIN and not is_caller_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "SUPERADMIN_REQUIRED", "message": "Only the Super Admin can remove administrator accounts."},
        )

    db.delete(user)
    db.commit()

    return {"success": True, "message": f"{'Administrator' if user.role == UserRole.ADMIN else 'Editor'} {user.email} (@{user.username or 'N/A'}) deleted successfully."}


