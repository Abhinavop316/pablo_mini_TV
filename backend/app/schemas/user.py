from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole


class UserCreateRequest(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    username: Optional[str] = None
    role: UserRole = UserRole.EDITOR
    temporary_password: Optional[str] = None


class CheckUsernameResponse(BaseModel):
    username: str
    available: bool
    suggestions: List[str] = []
    message: str


class UserStatusUpdateRequest(BaseModel):
    is_active: bool


class UserItemResponse(BaseModel):
    id: int
    name: Optional[str] = None
    username: Optional[str] = None
    email: str
    role: UserRole
    is_active: bool
    is_verified: bool
    is_superadmin: bool = False
    has_pending_setup: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    items: List[UserItemResponse]
    total: int



class SetupTokenResponse(BaseModel):
    user_id: int
    name: Optional[str] = None
    email: str
    setup_token: str
    setup_url: str
    expires_at: datetime
    email_sent: bool = True
    email_message: Optional[str] = None


class SendSetupEmailResponse(BaseModel):
    success: bool
    email: str
    message: str
    setup_url: str



class VerifySetupTokenRequest(BaseModel):
    token: str


class VerifySetupTokenResponse(BaseModel):
    valid: bool
    name: Optional[str] = None
    email: str
    role: UserRole


class CompleteSetupRequest(BaseModel):
    token: str
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class CompleteSetupResponse(BaseModel):
    success: bool
    message: str
    email: str
