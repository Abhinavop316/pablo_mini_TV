from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    email: str


class UserResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True
