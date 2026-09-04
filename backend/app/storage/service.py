from abc import ABC, abstractmethod
import os
import uuid
from pathlib import Path
from typing import Optional
from app.config import settings


class StorageService(ABC):
    @abstractmethod
    def upload(self, file_bytes: bytes, original_filename: str, content_type: str = "image/jpeg") -> str:
        """Uploads file and returns accessible URL."""
        pass

    @abstractmethod
    def delete(self, file_url_or_path: str) -> bool:
        """Deletes file if exists."""
        pass

    @abstractmethod
    def get_url(self, filename: str) -> str:
        """Returns full URL for filename."""
        pass

    @abstractmethod
    def exists(self, filename: str) -> bool:
        """Checks if file exists."""
        pass


class LocalStorage(StorageService):
    def __init__(self, upload_dir: Optional[str] = None):
        self.upload_dir = Path(upload_dir or settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def upload(self, file_bytes: bytes, original_filename: str, content_type: str = "image/jpeg") -> str:
        ext = Path(original_filename).suffix.lower() or ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        destination = self.upload_dir / unique_name
        with open(destination, "wb") as f:
            f.write(file_bytes)
        return f"/uploads/{unique_name}"

    def delete(self, file_url_or_path: str) -> bool:
        filename = Path(file_url_or_path).name
        target = self.upload_dir / filename
        if target.exists() and target.is_file():
            target.unlink()
            return True
        return False

    def get_url(self, filename: str) -> str:
        name = Path(filename).name
        return f"/uploads/{name}"

    def exists(self, filename: str) -> bool:
        name = Path(filename).name
        return (self.upload_dir / name).exists()


def get_storage() -> StorageService:
    # Future extension: if settings.STORAGE_TYPE == "r2": return R2Storage(...)
    return LocalStorage()
