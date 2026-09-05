import random
import re
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.auth.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.schemas.user import (
    CheckUsernameResponse,
    CompleteSetupRequest,
    CompleteSetupResponse,
    VerifySetupTokenRequest,
    VerifySetupTokenResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/check-username", response_model=CheckUsernameResponse)
def check_username_availability_public(
    username: str = Query(..., min_length=1, max_length=50),
    db: Session = Depends(get_db),
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


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    ident = (request.identifier or request.email or request.username or "").strip().lower()
    if not ident:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_CREDENTIALS", "message": "Please enter your email or username."},
        )

    user = db.query(User).filter(
        (User.email.ilike(ident)) | (User.username.ilike(ident))
    ).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email/username or password."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "INACTIVE_ACCOUNT", "message": "Your account has been deactivated."},
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        email=user.email,
        username=user.username,
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/verify-setup-token", response_model=VerifySetupTokenResponse)
def verify_setup_token(request: VerifySetupTokenRequest, db: Session = Depends(get_db)):
    clean_token = request.token.strip()
    if not clean_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_TOKEN", "message": "Setup token is missing or empty."},
        )

    user = db.query(User).filter(User.setup_token == clean_token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TOKEN_NOT_FOUND", "message": "The setup link is invalid or has already been used."},
        )

    if user.setup_token_expires_at and user.setup_token_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_EXPIRED", "message": "This invitation setup link has expired. Please contact your administrator for a new link."},
        )

    return VerifySetupTokenResponse(
        valid=True,
        name=user.name,
        email=user.email,
        role=user.role,
    )


@router.post("/complete-setup", response_model=CompleteSetupResponse)
def complete_setup(request: CompleteSetupRequest, db: Session = Depends(get_db)):
    clean_token = request.token.strip()
    if not clean_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_TOKEN", "message": "Setup token is missing or empty."},
        )

    clean_username = re.sub(r"[^a-zA-Z0-9_\-\.]", "", request.username.strip().lower())
    if len(clean_username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_USERNAME", "message": "Username must be at least 3 characters long."},
        )

    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "WEAK_PASSWORD", "message": "Password must be at least 6 characters long."},
        )

    user = db.query(User).filter(User.setup_token == clean_token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TOKEN_NOT_FOUND", "message": "The setup link is invalid or has already been used."},
        )

    if user.setup_token_expires_at and user.setup_token_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_EXPIRED", "message": "This invitation setup link has expired. Please contact your administrator for a new link."},
        )

    # Check if requested username is taken by anyone else
    existing_user = db.query(User).filter(User.username.ilike(clean_username), User.id != user.id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "USERNAME_TAKEN", "message": f"Username '@{clean_username}' is already taken. Please choose another username."},
        )

    user.username = clean_username
    user.password_hash = hash_password(request.password)
    user.is_verified = True
    user.setup_token = None
    user.setup_token_expires_at = None
    db.commit()

    return CompleteSetupResponse(
        success=True,
        message=f"Welcome @{clean_username}! Your password and username have been set successfully.",
        email=user.email,
    )


