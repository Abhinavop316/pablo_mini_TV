import os
from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    SECRET_KEY: str = "peblo_super_secret_jwt_key_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    DATABASE_URL: str = "postgresql+psycopg://postgres@localhost:5432/pablo_db"

    STORAGE_TYPE: str = "local"
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    CATALOGUE_PATH: str = str(BASE_DIR / "storage" / "catalogue.json")

    # Fixed Administrator Credentials
    ADMIN_EMAIL: str = "admin@peblo.tv"
    ADMIN_USERNAME: str = "peblo_admin"
    ADMIN_PASSWORD: str = "Admin@123"
    ADMIN_NAME: str = "Peblo Super Admin"

    # Fixed Editor Credentials
    EDITOR_EMAIL: str = "editor@peblo.tv"
    EDITOR_USERNAME: str = "peblo_editor"
    EDITOR_PASSWORD: str = "Editor@123"
    EDITOR_NAME: str = "Peblo Editor"

    # Frontend URL
    FRONTEND_URL: str = "http://localhost:5173"

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            return "postgresql+psycopg://" + v[len("postgres://") :]
        if v.startswith("postgresql://") and not v.startswith("postgresql+"):
            return "postgresql+psycopg://" + v[len("postgresql://") :]
        return v

    @field_validator("UPLOAD_DIR", mode="after")
    @classmethod
    def resolve_upload_dir(cls, v: str) -> str:
        p = Path(v)
        if not p.is_absolute():
            return str((BASE_DIR / p).resolve())
        return str(p.resolve())

    @field_validator("CATALOGUE_PATH", mode="after")
    @classmethod
    def resolve_catalogue_path(cls, v: str) -> str:
        p = Path(v)
        if not p.is_absolute():
            return str((BASE_DIR / p).resolve())
        return str(p.resolve())

    class Config:
        env_file = str(BASE_DIR / ".env")
        extra = "ignore"



settings = Settings()

# Ensure required directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.CATALOGUE_PATH), exist_ok=True)
