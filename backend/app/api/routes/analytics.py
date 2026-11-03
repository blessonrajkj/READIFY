from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from app.database.database import get_db
from app.models.database_models import (
    Book, Chapter, ReadingProgress, ListeningProgress, 
    QuizAttempt, Flashcard, LearningAnalytics
)
from app.models.schemas import (
    ReadingProgressResponse, ReadingProgressUpdate,
    LearningAnalyticsResponse, RecordLearningHeartbeat
)

router = APIRouter(prefix="/analytics", tags=["Learning Analytics"])
logger = logging.getLogger(__name__)

@router.get("", response_model=LearningAnalyticsResponse)
def get_global_analytics(db: Session = Depends(get_db)):
    """Computes global learning analytics across all books in the library."""
    all_analytics = db.query(LearningAnalytics).all()
    
    total_listening = sum([a.total_listening_seconds for a in all_analytics])
    total_reading = sum([a.total_reading_seconds for a in all_analytics])
    
    # Also sum listening progress from all books if analytics not initialized
    if total_listening == 0:
        all_lp = db.query(ListeningProgress).all()
        total_listening = int(sum([lp.position_seconds for lp in all_lp]))
        
    all_attempts = db.query(QuizAttempt).all()
    quizzes_taken = len(all_attempts)
    avg_score = round(sum([a.percentage for a in all_attempts]) / quizzes_taken, 1) if quizzes_taken > 0 else 0.0
    
    all_cards = db.query(Flashcard).all()
    mastered_cards = len([c for c in all_cards if c.is_mastered])
    reviewed_cards = sum([c.review_count for c in all_cards])
    
    # Aggregate weak topics
    weak_topics_set = []
    for att in all_attempts:
        if att.weak_topics:
            weak_topics_set.extend(att.weak_topics)
    unique_weak = list(dict.fromkeys(weak_topics_set))[:8]

    # Calculate retention score (composite of quiz performance + flashcard mastery)
    retention = 0
    if quizzes_taken > 0 or len(all_cards) > 0:
        quiz_component = (avg_score * 0.6)
        card_component = ((mastered_cards / max(1, len(all_cards))) * 100 * 0.4)
        retention = min(100, max(0, int(quiz_component + card_component)))

    total_minutes = int((total_listening + total_reading) / 60)

    # Streak calculation
    streak_days = 1
    if all_analytics:
        max_streak = max([a.learning_streak_days for a in all_analytics])
        streak_days = max(1, max_streak)

    return LearningAnalyticsResponse(
        total_listening_seconds=total_listening,
        total_reading_seconds=total_reading,
        total_study_minutes=total_minutes,
        chapters_completed=sum([a.chapters_completed for a in all_analytics]),
        quizzes_taken=quizzes_taken,
        avg_quiz_score=avg_score,
        flashcards_reviewed=reviewed_cards,
        flashcards_mastered=mastered_cards,
        learning_streak_days=streak_days,
        weak_topics=unique_weak,
        retention_score=retention
    )

@router.get("/books/{book_id}", response_model=LearningAnalyticsResponse)
def get_book_analytics(book_id: str, db: Session = Depends(get_db)):
    """Computes learning and retention metrics for a specific book."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    analytics = db.query(LearningAnalytics).filter(LearningAnalytics.book_id == book_id).first()
    
    # Listening time
    lp = db.query(ListeningProgress).filter(ListeningProgress.book_id == book_id).first()
    listening_seconds = int(lp.position_seconds) if lp else 0
    if analytics and analytics.total_listening_seconds > listening_seconds:
        listening_seconds = analytics.total_listening_seconds
        
    # Reading time
    rp = db.query(ReadingProgress).filter(ReadingProgress.book_id == book_id).first()
    reading_seconds = rp.reading_seconds if rp else 0
    if analytics and analytics.total_reading_seconds > reading_seconds:
        reading_seconds = analytics.total_reading_seconds

    # Quizzes
    attempts = db.query(QuizAttempt).filter(QuizAttempt.book_id == book_id).all()
    quizzes_count = len(attempts)
    avg_score = round(sum([a.percentage for a in attempts]) / quizzes_count, 1) if quizzes_count > 0 else 0.0

    # Flashcards
    cards = db.query(Flashcard).filter(Flashcard.book_id == book_id).all()
    mastered = len([c for c in cards if c.is_mastered])
    reviewed = sum([c.review_count for c in cards])

    # Weak topics
    weak_topics = []
    for att in attempts:
        if att.weak_topics:
            weak_topics.extend(att.weak_topics)
    unique_weak = list(dict.fromkeys(weak_topics))[:8]

    # Retention score
    retention = 0
    if quizzes_count > 0 or len(cards) > 0:
        q_comp = avg_score * 0.6
        c_comp = (mastered / max(1, len(cards))) * 100 * 0.4
        retention = min(100, max(0, int(q_comp + c_comp)))

    return LearningAnalyticsResponse(
        total_listening_seconds=listening_seconds,
        total_reading_seconds=reading_seconds,
        total_study_minutes=int((listening_seconds + reading_seconds) / 60),
        chapters_completed=analytics.chapters_completed if analytics else 0,
        quizzes_taken=quizzes_count,
        avg_quiz_score=avg_score,
        flashcards_reviewed=reviewed,
        flashcards_mastered=mastered,
        learning_streak_days=analytics.learning_streak_days if analytics else 1,
        weak_topics=unique_weak,
        retention_score=retention
    )

@router.post("/heartbeat")
def record_learning_heartbeat(req: RecordLearningHeartbeat, db: Session = Depends(get_db)):
    """Logs active reading or listening time in periodic background pulses."""
    book = db.query(Book).filter(Book.id == req.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    analytics = db.query(LearningAnalytics).filter(LearningAnalytics.book_id == req.book_id).first()
    if not analytics:
        analytics = LearningAnalytics(
            book_id=req.book_id,
            total_listening_seconds=0,
            total_reading_seconds=0,
            learning_streak_days=1,
            last_active_date=datetime.utcnow()
        )
        db.add(analytics)

    if req.activity_type == "reading":
        analytics.total_reading_seconds += req.seconds_delta
        # Update reading progress table
        rp = db.query(ReadingProgress).filter(ReadingProgress.book_id == req.book_id).first()
        if not rp:
            rp = ReadingProgress(book_id=req.book_id, reading_seconds=req.seconds_delta)
            db.add(rp)
        else:
            rp.reading_seconds += req.seconds_delta
            rp.updated_at = datetime.utcnow()
    else:
        analytics.total_listening_seconds += req.seconds_delta

    # Update streak
    now = datetime.utcnow()
    if analytics.last_active_date:
        diff_days = (now.date() - analytics.last_active_date.date()).days
        if diff_days == 1:
            analytics.learning_streak_days += 1
        elif diff_days > 1:
            analytics.learning_streak_days = 1
    analytics.last_active_date = now

    db.commit()
    return {"status": "ok", "seconds_added": req.seconds_delta}

@router.post("/books/{book_id}/reading-progress", response_model=ReadingProgressResponse)
def update_reading_progress(
    book_id: str,
    req: ReadingProgressUpdate,
    db: Session = Depends(get_db)
):
    """Updates the active reading position and reading duration for a book."""
    rp = db.query(ReadingProgress).filter(ReadingProgress.book_id == book_id).first()
    if not rp:
        rp = ReadingProgress(
            book_id=book_id,
            current_chapter_id=req.current_chapter_id,
            current_page=req.current_page,
            reading_seconds=max(0, req.reading_seconds_delta)
        )
        db.add(rp)
    else:
        if req.current_chapter_id:
            rp.current_chapter_id = req.current_chapter_id
        if req.current_page:
            rp.current_page = req.current_page
        if req.reading_seconds_delta > 0:
            rp.reading_seconds += req.reading_seconds_delta
        rp.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(rp)
    return rp
