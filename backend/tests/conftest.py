import io
import sys
from pathlib import Path
import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.auth.security import create_access_token, hash_password
from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole

# Use TestClient
@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def db_session():
    engine = create_engine(settings.DATABASE_URL)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def admin_token(db_session):
    admin = db_session.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        admin = User(
            email="admin@example.com",
            password_hash=hash_password("Admin@123"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
    return create_access_token(data={"sub": str(admin.id), "email": admin.email, "role": "ADMIN"})


@pytest.fixture
def editor_token(db_session):
    editor = db_session.query(User).filter(User.email == "editor@example.com").first()
    if not editor:
        editor = User(
            email="editor@example.com",
            password_hash=hash_password("Editor@123"),
            role=UserRole.EDITOR,
            is_active=True,
        )
        db_session.add(editor)
        db_session.commit()
        db_session.refresh(editor)
    return create_access_token(data={"sub": str(editor.id), "email": editor.email, "role": "EDITOR"})


def create_test_image(width: int, height: int, format: str = "JPEG") -> bytes:
    img = Image.new("RGB", (width, height), color=(100, 50, 150))
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()
