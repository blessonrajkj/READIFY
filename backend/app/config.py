import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Readify AI"
    API_V1_STR: str = "/api"
    
    # Secret Key for JWT
    JWT_SECRET: str = "readify_super_secret_key_2026_change_me_in_prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # We use the password discovered from the environment (kjbb2320)
    DATABASE_URL: str = "postgresql://postgres:kjbb2320@localhost:5432/readify"
    DATABASE_URL_MASTER: str = "postgresql://postgres:kjbb2320@localhost:5432/postgres"
    
    # Redis
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"
    
    # Storage Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "data", "uploads")
    AUDIO_DIR: str = os.path.join(BASE_DIR, "data", "audio")
    COVER_DIR: str = os.path.join(BASE_DIR, "data", "covers")
    
    # Storage Modular Settings
    STORAGE_PROVIDER: str = "local" # "local" or "s3"
    STORAGE_BUCKET: str = "readify-audiobooks"
    STORAGE_ENDPOINT: Optional[str] = None
    STORAGE_ACCESS_KEY: Optional[str] = None
    STORAGE_SECRET_KEY: Optional[str] = None
    
    # TTS Modular Settings
    TTS_PROVIDER: str = "edge" # "edge" (free), "openai", "elevenlabs"
    OPENAI_API_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None
    
    # AI / RAG Settings
    # We will prioritize Gemini because the Google AI SDK is installed on this system
    GEMINI_API_KEY: Optional[str] = None
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.AUDIO_DIR, exist_ok=True)
os.makedirs(settings.COVER_DIR, exist_ok=True)
