import os
import shutil
from abc import ABC, abstractmethod
from typing import Optional
from app.config import settings

class StorageProvider(ABC):
    @abstractmethod
    def save_file(self, content: bytes, category: str, filename: str) -> str:
        """Saves a file and returns its storage path or URL.
        
        category: 'uploads' (PDFs), 'audio' (generated TTS MP3s), or 'covers' (book covers)
        """
        pass

    @abstractmethod
    def get_file_path_or_url(self, storage_key: str) -> str:
        """Returns the local file path or public URL for the storage key."""
        pass

    @abstractmethod
    def delete_file(self, storage_key: str) -> bool:
        """Deletes the file from storage."""
        pass

class LocalStorageProvider(StorageProvider):
    def __init__(self):
        self.dirs = {
            "uploads": settings.UPLOAD_DIR,
            "audio": settings.AUDIO_DIR,
            "covers": settings.COVER_DIR
        }

    def _get_target_dir(self, category: str) -> str:
        target_dir = self.dirs.get(category)
        if not target_dir:
            raise ValueError(f"Unknown storage category: {category}")
        os.makedirs(target_dir, exist_ok=True)
        return target_dir

    def save_file(self, content: bytes, category: str, filename: str) -> str:
        target_dir = self._get_target_dir(category)
        # Avoid file collision by using directories or clean naming
        dest_path = os.path.join(target_dir, filename)
        with open(dest_path, "wb") as f:
            f.write(content)
        # Return path relative to base data folder or absolute path
        return dest_path

    def get_file_path_or_url(self, storage_key: str) -> str:
        # For local, the storage key is the absolute file path
        return storage_key

    def delete_file(self, storage_key: str) -> bool:
        if os.path.exists(storage_key):
            try:
                os.remove(storage_key)
                return True
            except Exception:
                return False
        return False

class S3StorageProvider(StorageProvider):
    def __init__(self):
        # We check dynamically for boto3 so we don't crash if it is not installed
        try:
            import boto3
            self.s3_client = boto3.client(
                's3',
                endpoint_url=settings.STORAGE_ENDPOINT,
                aws_access_key_id=settings.STORAGE_ACCESS_KEY,
                aws_secret_access_key=settings.STORAGE_SECRET_KEY
            )
        except ImportError:
            raise RuntimeError("boto3 package is required to use S3 storage provider. Install it using pip.")
        self.bucket_name = settings.STORAGE_BUCKET

    def save_file(self, content: bytes, category: str, filename: str) -> str:
        import io
        s3_key = f"{category}/{filename}"
        self.s3_client.upload_fileobj(
            io.BytesIO(content),
            self.bucket_name,
            s3_key,
            ExtraArgs={"ACL": "public-read"} if settings.STORAGE_ENDPOINT else None
        )
        # Return S3 key or URL
        if settings.STORAGE_ENDPOINT:
            return f"{settings.STORAGE_ENDPOINT.rstrip('/')}/{self.bucket_name}/{s3_key}"
        return s3_key

    def get_file_path_or_url(self, storage_key: str) -> str:
        # If it's a URL already
        if storage_key.startswith("http://") or storage_key.startswith("https://"):
            return storage_key
        # Otherwise generate a presigned URL or standard S3 url
        try:
            return self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': storage_key},
                ExpiresIn=3600
            )
        except Exception:
            return f"https://{self.bucket_name}.s3.amazonaws.com/{storage_key}"

    def delete_file(self, storage_key: str) -> bool:
        # If it's a URL, extract the key
        key = storage_key
        if storage_key.startswith("http"):
            # Simple parse
            parts = storage_key.split(f"{self.bucket_name}/")
            if len(parts) > 1:
                key = parts[1]
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except Exception:
            return False

# Factory helper to instantiate the active storage provider
def get_storage_provider() -> StorageProvider:
    if settings.STORAGE_PROVIDER == "s3":
        return S3StorageProvider()
    return LocalStorageProvider()
