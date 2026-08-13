from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database.database import engine, Base
# Import models so SQLAlchemy registers them before create_all
from app.models import database_models

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent PDF to Audiobook Reader API",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount covers statically so the frontend can display book cover images easily
if os.path.exists(settings.COVER_DIR):
    app.mount("/covers", StaticFiles(directory=settings.COVER_DIR), name="covers")

# Import routers
from app.api.routes import auth, books, chapters, audio, search, assistant, progress

# Register routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(books.router, prefix=settings.API_V1_STR)
app.include_router(chapters.router, prefix=settings.API_V1_STR)
app.include_router(audio.router, prefix=settings.API_V1_STR)
app.include_router(search.router, prefix=settings.API_V1_STR)
app.include_router(assistant.router, prefix=settings.API_V1_STR)
app.include_router(progress.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Readify AI API",
        "status": "online",
        "docs_url": "/docs"
    }
