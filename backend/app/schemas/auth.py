from typing import Optional
from pydantic import BaseModel
from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    identifier: Optional[str] = None
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    email: str
    username: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: Optional[str] = None
    username: Optional[str] = None
    email: str
    role: UserRole
    is_active: bool
    is_superadmin: bool = False

    class Config:
        from_attributes = True

