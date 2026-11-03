import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid

from app.database.database import Base
from app.models.database_models import (
    Book, Chapter, TextChunk, Flashcard, Quiz, QuizQuestion, QuizAttempt, StudyNote, LearningAnalytics
)
from app.services.learning_service import LearningService

# In-memory SQLite engine for fast testing
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def test_db():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed a book, chapter, and text chunks
    book = Book(
        id=str(uuid.uuid4()),
        title="Thinking, Fast and Slow",
        author="Daniel Kahneman",
        filename="test.pdf",
        filepath="dummy.pdf",
        total_pages=5,
        status="completed"
    )
    db.add(book)
    db.flush()

    chapter = Chapter(
        id=str(uuid.uuid4()),
        book_id=book.id,
        title="Chapter 1: Two Systems",
        chapter_number=1,
        start_page=1,
        end_page=5,
        duration=120.0,
        order_index=1
    )
    db.add(chapter)
    db.flush()

    sample_paragraphs = [
        "System 1 operates automatically and quickly, with little or no effort and no sense of voluntary control. System 1 has biases and makes systematic errors.",
        "System 2 allocates attention to the effortful mental operations that demand it, including complex computations. System 2 is associated with the subjective experience of agency, choice, and concentration.",
        "Heuristics: A simple procedure that helps find adequate, though often imperfect, answers to difficult questions.",
        "The Law of Small Numbers: Extreme outcomes (both high and low) are more likely to be found in small than in large samples."
    ]

    for idx, p in enumerate(sample_paragraphs):
        chunk = TextChunk(
            id=str(uuid.uuid4()),
            book_id=book.id,
            chapter_id=chapter.id,
            content=p,
            chunk_index=idx,
            page_number=idx + 1
        )
        db.add(chunk)

    db.commit()

    yield db

    db.close()

def test_generate_flashcards(test_db):
    book = test_db.query(Book).first()
    chapter = test_db.query(Chapter).first()
    
    service = LearningService(db=test_db, book_id=book.id)
    # Ensure offline heuristic generation works cleanly
    service.has_api_key = False
    
    cards = service.generate_flashcards(chapter_id=chapter.id, count=3)
    assert len(cards) >= 1
    assert cards[0].front is not None
    assert cards[0].back is not None
    assert cards[0].book_id == book.id

def test_generate_and_submit_quiz(test_db):
    book = test_db.query(Book).first()
    chapter = test_db.query(Chapter).first()
    
    service = LearningService(db=test_db, book_id=book.id)
    service.has_api_key = False
    
    quiz = service.generate_quiz(chapter_id=chapter.id, difficulty="medium", question_count=3)
    assert quiz.id is not None
    assert quiz.total_questions >= 1
    
    questions = test_db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
    assert len(questions) >= 1
    q1 = questions[0]
    assert len(q1.options) == 4
    assert q1.correct_option_index in [0, 1, 2, 3]

    # Test submission
    # Submit the correct answer for q1
    answers = { q1.id: q1.correct_option_index }
    attempt = service.submit_quiz_attempt(quiz_id=quiz.id, answers=answers, duration_seconds=45)
    
    assert attempt.score == 1
    assert attempt.percentage > 0
    assert attempt.quiz_id == quiz.id

    # Check analytics updated
    analytics = test_db.query(LearningAnalytics).filter(LearningAnalytics.book_id == book.id).first()
    assert analytics is not None
    assert analytics.quizzes_taken == 1

def test_generate_study_notes(test_db):
    book = test_db.query(Book).first()
    chapter = test_db.query(Chapter).first()
    
    service = LearningService(db=test_db, book_id=book.id)
    service.has_api_key = False
    
    note = service.generate_study_notes(chapter_id=chapter.id)
    assert note.id is not None
    assert "Executive Summary" in note.content
    assert note.book_id == book.id
