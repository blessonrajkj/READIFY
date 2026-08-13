from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.database.database import get_db
from app.models.database_models import ListeningProgress, Book, Chapter, User
from app.models.schemas import ListeningProgressResponse, ListeningProgressUpdate
from app.api.routes.auth import get_current_user_optional

router = APIRouter(prefix="/books/{book_id}/progress", tags=["Listening Progress"])

@router.get("/", response_model=ListeningProgressResponse)
def get_listening_progress(
    book_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Loads the user's active listening progress/position for a book."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    # Find progress
    # If authenticated, check user_id. Otherwise check guest progress (user_id is null)
    user_id = current_user.id if current_user else None
    progress = db.query(ListeningProgress).filter(
        ListeningProgress.book_id == book_id,
        ListeningProgress.user_id == user_id
    ).first()
    
    if not progress:
        # Return a default empty progress starting at the first chapter
        first_chapter = db.query(Chapter).filter(Chapter.book_id == book_id).order_by(Chapter.order_index.asc()).first()
        
        # Create default progress
        progress = ListeningProgress(
            book_id=book_id,
            user_id=user_id,
            current_chapter_id=first_chapter.id if first_chapter else None,
            position_seconds=0.0,
            speed=1.0
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
        
    return progress

@router.post("/", response_model=ListeningProgressResponse)
def save_listening_progress(
    book_id: str,
    progress_in: ListeningProgressUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Saves or updates the user's listening progress/position."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    user_id = current_user.id if current_user else None
    progress = db.query(ListeningProgress).filter(
        ListeningProgress.book_id == book_id,
        ListeningProgress.user_id == user_id
    ).first()
    
    if not progress:
        progress = ListeningProgress(
            book_id=book_id,
            user_id=user_id
        )
        
    progress.current_chapter_id = progress_in.current_chapter_id
    progress.position_seconds = progress_in.position_seconds
    progress.speed = progress_in.speed
    progress.updated_at = datetime.utcnow()
    
    db.add(progress)
    db.commit()
    db.refresh(progress)
    
    return progress
