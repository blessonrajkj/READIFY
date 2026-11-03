from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.database.database import get_db
from app.models.database_models import (
    Book, Chapter, Flashcard, Quiz, QuizQuestion, QuizAttempt, StudyNote, Bookmark
)
from app.models.schemas import (
    FlashcardResponse, FlashcardCreate, FlashcardUpdate,
    QuizResponse, QuizCreateRequest, QuizSubmission, QuizAttemptResponse,
    StudyNoteResponse, StudyNoteCreate, StudyNoteUpdate,
    BookmarkResponse, BookmarkCreate
)
from app.services.learning_service import LearningService

router = APIRouter(prefix="/books/{book_id}/learning", tags=["Active Learning"])
logger = logging.getLogger(__name__)

# =============================================================================
# FLASHCARDS ENDPOINTS
# =============================================================================

@router.post("/flashcards/generate", response_model=List[FlashcardResponse])
def generate_flashcards(
    book_id: str,
    chapter_id: Optional[str] = None,
    count: int = 8,
    db: Session = Depends(get_db)
):
    """Generates a new set of interactive flashcards for a chapter or entire book."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    try:
        service = LearningService(db=db, book_id=book_id)
        flashcards = service.generate_flashcards(chapter_id=chapter_id, count=count)
        return flashcards
    except Exception as e:
        logger.error(f"Failed to generate flashcards: {e}")
        raise HTTPException(status_code=500, detail=f"Flashcard generation error: {str(e)}")

@router.get("/flashcards", response_model=List[FlashcardResponse])
def get_flashcards(
    book_id: str,
    chapter_id: Optional[str] = None,
    mastered: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Returns flashcards for the book, optionally filtered by chapter and mastery status."""
    query = db.query(Flashcard).filter(Flashcard.book_id == book_id)
    if chapter_id:
        query = query.filter(Flashcard.chapter_id == chapter_id)
    if mastered is not None:
        query = query.filter(Flashcard.is_mastered == mastered)
    return query.order_by(Flashcard.created_at.desc()).all()

@router.patch("/flashcards/{card_id}", response_model=FlashcardResponse)
def update_flashcard(
    book_id: str,
    card_id: str,
    update_data: FlashcardUpdate,
    db: Session = Depends(get_db)
):
    """Updates flashcard review count or mastery state."""
    card = db.query(Flashcard).filter(Flashcard.id == card_id, Flashcard.book_id == book_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
        
    if update_data.is_mastered is not None:
        card.is_mastered = update_data.is_mastered
    if update_data.front is not None:
        card.front = update_data.front
    if update_data.back is not None:
        card.back = update_data.back
    if update_data.category is not None:
        card.category = update_data.category
    if update_data.difficulty is not None:
        card.difficulty = update_data.difficulty

    from datetime import datetime
    card.review_count += 1
    card.last_reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(card)
    return card

@router.delete("/flashcards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flashcard(book_id: str, card_id: str, db: Session = Depends(get_db)):
    card = db.query(Flashcard).filter(Flashcard.id == card_id, Flashcard.book_id == book_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    db.delete(card)
    db.commit()

# =============================================================================
# QUIZZES & PRACTICE TESTS ENDPOINTS
# =============================================================================

@router.post("/quizzes/generate", response_model=QuizResponse)
def generate_quiz(
    book_id: str,
    req: QuizCreateRequest,
    db: Session = Depends(get_db)
):
    """Generates an intelligent MCQ assessment with pedagogical explanations."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    try:
        service = LearningService(db=db, book_id=book_id)
        quiz = service.generate_quiz(
            chapter_id=req.chapter_id,
            difficulty=req.difficulty or "medium",
            question_count=req.question_count or 5
        )
        return quiz
    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

@router.get("/quizzes", response_model=List[QuizResponse])
def list_quizzes(book_id: str, chapter_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Lists all quizzes created for this book."""
    query = db.query(Quiz).filter(Quiz.book_id == book_id)
    if chapter_id:
        query = query.filter(Quiz.chapter_id == chapter_id)
    return query.order_by(Quiz.created_at.desc()).all()

@router.get("/quizzes/{quiz_id}", response_model=QuizResponse)
def get_quiz(book_id: str, quiz_id: str, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.book_id == book_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@router.post("/quizzes/{quiz_id}/submit", response_model=QuizAttemptResponse)
def submit_quiz_attempt(
    book_id: str,
    quiz_id: str,
    submission: QuizSubmission,
    db: Session = Depends(get_db)
):
    """Submits answers for evaluation, scores the test, and logs weak topics."""
    try:
        service = LearningService(db=db, book_id=book_id)
        attempt = service.submit_quiz_attempt(
            quiz_id=quiz_id,
            answers=submission.answers,
            duration_seconds=submission.duration_seconds
        )
        return attempt
    except Exception as e:
        logger.error(f"Quiz submission failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/quizzes/{quiz_id}/attempts", response_model=List[QuizAttemptResponse])
def get_quiz_attempts(book_id: str, quiz_id: str, db: Session = Depends(get_db)):
    """Returns past test results and evaluation records for a specific quiz."""
    return db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.book_id == book_id
    ).order_by(QuizAttempt.created_at.desc()).all()

# =============================================================================
# STUDY NOTES ENDPOINTS
# =============================================================================

@router.post("/notes/generate", response_model=StudyNoteResponse)
def generate_study_notes(
    book_id: str,
    chapter_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Generates structured revision notes with summaries, key arguments, and checklists."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    try:
        service = LearningService(db=db, book_id=book_id)
        note = service.generate_study_notes(chapter_id=chapter_id)
        return note
    except Exception as e:
        logger.error(f"Study notes generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notes", response_model=List[StudyNoteResponse])
def get_study_notes(book_id: str, chapter_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(StudyNote).filter(StudyNote.book_id == book_id)
    if chapter_id:
        query = query.filter(StudyNote.chapter_id == chapter_id)
    return query.order_by(StudyNote.is_pinned.desc(), StudyNote.created_at.desc()).all()

@router.post("/notes", response_model=StudyNoteResponse)
def create_study_note(book_id: str, note_data: StudyNoteCreate, db: Session = Depends(get_db)):
    note = StudyNote(
        book_id=book_id,
        chapter_id=note_data.chapter_id,
        title=note_data.title,
        content=note_data.content,
        tags=note_data.tags or [],
        color=note_data.color or "default"
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.patch("/notes/{note_id}", response_model=StudyNoteResponse)
def update_study_note(book_id: str, note_id: str, update_data: StudyNoteUpdate, db: Session = Depends(get_db)):
    note = db.query(StudyNote).filter(StudyNote.id == note_id, StudyNote.book_id == book_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Study note not found")
    if update_data.title is not None:
        note.title = update_data.title
    if update_data.content is not None:
        note.content = update_data.content
    if update_data.tags is not None:
        note.tags = update_data.tags
    if update_data.color is not None:
        note.color = update_data.color
    if update_data.is_pinned is not None:
        note.is_pinned = update_data.is_pinned

    from datetime import datetime
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return note

@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_note(book_id: str, note_id: str, db: Session = Depends(get_db)):
    note = db.query(StudyNote).filter(StudyNote.id == note_id, StudyNote.book_id == book_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Study note not found")
    db.delete(note)
    db.commit()

# =============================================================================
# SERVER-PERSISTED BOOKMARKS ENDPOINTS
# =============================================================================

@router.post("/bookmarks", response_model=BookmarkResponse)
def add_bookmark(book_id: str, req: BookmarkCreate, db: Session = Depends(get_db)):
    bm = Bookmark(
        book_id=book_id,
        chapter_id=req.chapter_id,
        chunk_id=req.chunk_id,
        chunk_index=req.chunk_index,
        page_number=req.page_number,
        text_snippet=req.text_snippet,
        note=req.note
    )
    db.add(bm)
    db.commit()
    db.refresh(bm)
    return bm

@router.get("/bookmarks", response_model=List[BookmarkResponse])
def get_bookmarks(book_id: str, db: Session = Depends(get_db)):
    return db.query(Bookmark).filter(Bookmark.book_id == book_id).order_by(Bookmark.created_at.desc()).all()

@router.delete("/bookmarks/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(book_id: str, bookmark_id: str, db: Session = Depends(get_db)):
    bm = db.query(Bookmark).filter(Bookmark.id == bookmark_id, Bookmark.book_id == book_id).first()
    if not bm:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(bm)
    db.commit()
