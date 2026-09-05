import os
from pathlib import Path
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

    # Frontend URL for setup / verification links
    FRONTEND_URL: str = "http://localhost:5173"

    # SMTP Email Configuration
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "PeBlo Kids TV Studio"
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False

    class Config:
        env_file = str(BASE_DIR / ".env")
        extra = "ignore"



settings = Settings()

# Ensure required directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.CATALOGUE_PATH), exist_ok=True)
