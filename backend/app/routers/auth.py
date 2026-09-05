from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.auth.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.schemas.user import (
    CompleteSetupRequest,
    CompleteSetupResponse,
    VerifySetupTokenRequest,
    VerifySetupTokenResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.strip().lower()).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password."},
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

    user.password_hash = hash_password(request.password)
    user.is_verified = True
    user.setup_token = None
    user.setup_token_expires_at = None
    db.commit()

    return CompleteSetupResponse(
        success=True,
        message="Password set successfully! Your account is verified and ready to use.",
        email=user.email,
    )

