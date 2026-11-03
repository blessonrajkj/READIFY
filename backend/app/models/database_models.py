from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Book(Base):
    __tablename__ = "books"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    title = Column(String, index=True, nullable=False)
    author = Column(String, index=True, nullable=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    cover_path = Column(String, nullable=True)
    language = Column(String, default="en")
    status = Column(String, default="pending") # pending, processing, completed, failed
    total_pages = Column(Integer, default=0)
    file_size = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    chapters = relationship("Chapter", back_populates="book", cascade="all, delete-orphan")
    text_chunks = relationship("TextChunk", back_populates="book", cascade="all, delete-orphan")
    listening_progress = relationship("ListeningProgress", back_populates="book", cascade="all, delete-orphan")
    conversations = relationship("AIConversation", back_populates="book", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="book", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="book", cascade="all, delete-orphan")
    study_notes = relationship("StudyNote", back_populates="book", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="book", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="book", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="book", cascade="all, delete-orphan")
    reading_progress = relationship("ReadingProgress", back_populates="book", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    chapter_number = Column(Integer, nullable=False)
    start_page = Column(Integer, nullable=True)
    end_page = Column(Integer, nullable=True)
    duration = Column(Float, default=0.0) # Estimated audio duration in seconds
    summary = Column(Text, nullable=True)
    key_takeaways = Column(JSON, nullable=True) # list of strings
    important_concepts = Column(JSON, nullable=True) # list of dicts/strings
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    book = relationship("Book", back_populates="chapters")
    text_chunks = relationship("TextChunk", back_populates="chapter", cascade="all, delete-orphan")
    audio_chunks = relationship("AudioChunk", back_populates="chapter", cascade="all, delete-orphan")
    progress_records = relationship("ListeningProgress", back_populates="current_chapter")
    flashcards = relationship("Flashcard", back_populates="chapter", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="chapter", cascade="all, delete-orphan")
    study_notes = relationship("StudyNote", back_populates="chapter", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="chapter", cascade="all, delete-orphan")

class TextChunk(Base):
    __tablename__ = "text_chunks"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    start_char = Column(Integer, nullable=True)
    end_char = Column(Integer, nullable=True)
    page_number = Column(Integer, nullable=True)
    
    # Relationships
    book = relationship("Book", back_populates="text_chunks")
    chapter = relationship("Chapter", back_populates="text_chunks")
    audio_chunk = relationship("AudioChunk", uselist=False, back_populates="text_chunk", cascade="all, delete-orphan")

class AudioChunk(Base):
    __tablename__ = "audio_chunks"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    text_chunk_id = Column(String, ForeignKey("text_chunks.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    filepath = Column(String, nullable=False)
    duration = Column(Float, default=0.0) # duration of this chunk in seconds
    status = Column(String, default="pending") # pending, synthesized, failed
    try_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    text_chunk = relationship("TextChunk", back_populates="audio_chunk")
    chapter = relationship("Chapter", back_populates="audio_chunks")

class ListeningProgress(Base):
    __tablename__ = "listening_progress"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    current_chapter_id = Column(String, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True)
    position_seconds = Column(Float, default=0.0)
    speed = Column(Float, default=1.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    book = relationship("Book", back_populates="listening_progress")
    current_chapter = relationship("Chapter", back_populates="progress_records")

class AIConversation(Base):
    __tablename__ = "ai_conversations"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    book = relationship("Book", back_populates="conversations")
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan")

class AIMessage(Base):
    __tablename__ = "ai_messages"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    conversation_id = Column(String, ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False) # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    conversation = relationship("AIConversation", back_populates="messages")

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    job_type = Column(String, nullable=False) # process_pdf, generate_audio
    status = Column(String, default="pending") # pending, processing, completed, failed
    progress = Column(Integer, default=0) # 0 to 100
    error_message = Column(Text, nullable=True)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    book = relationship("Book", back_populates="jobs")

class Bookmark(Base):
    __tablename__ = "bookmarks"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String, ForeignKey("text_chunks.id", ondelete="SET NULL"), nullable=True)
    chunk_index = Column(Integer, default=0)
    page_number = Column(Integer, nullable=True)
    text_snippet = Column(Text, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    book = relationship("Book", back_populates="bookmarks")
    chapter = relationship("Chapter", back_populates="bookmarks")

class StudyNote(Base):
    __tablename__ = "study_notes"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(JSON, nullable=True) # list of tags
    color = Column(String, default="default")
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    book = relationship("Book", back_populates="study_notes")
    chapter = relationship("Chapter", back_populates="study_notes")

class Flashcard(Base):
    __tablename__ = "flashcards"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True, index=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    category = Column(String, default="Concept") # Concept, Terminology, Formula, Question
    difficulty = Column(String, default="medium") # easy, medium, hard
    source_page = Column(Integer, nullable=True)
    is_mastered = Column(Boolean, default=False)
    review_count = Column(Integer, default=0)
    last_reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    book = relationship("Book", back_populates="flashcards")
    chapter = relationship("Chapter", back_populates="flashcards")

class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(String, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String, default="medium") # easy, medium, hard
    time_limit_seconds = Column(Integer, default=300)
    total_questions = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    book = relationship("Book", back_populates="quizzes")
    chapter = relationship("Chapter", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.order_index")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizAttempt.created_at.desc()")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False) # list of 4 string options
    correct_option_index = Column(Integer, nullable=False) # 0 to 3
    explanation = Column(Text, nullable=False)
    source_reference = Column(String, nullable=True) # e.g. "Page 12, Chapter 1"
    difficulty = Column(String, default="medium")
    order_index = Column(Integer, default=0)
    
    # Relationships
    quiz = relationship("Quiz", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False)
    answers = Column(JSON, nullable=False) # { question_id: selected_index }
    weak_topics = Column(JSON, nullable=True) # list of strings/concepts
    duration_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    quiz = relationship("Quiz", back_populates="attempts")
    book = relationship("Book", back_populates="quiz_attempts")

class ReadingProgress(Base):
    __tablename__ = "reading_progress"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    current_chapter_id = Column(String, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True)
    current_page = Column(Integer, default=1)
    reading_seconds = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    book = relationship("Book", back_populates="reading_progress")

class LearningAnalytics(Base):
    __tablename__ = "learning_analytics"
    
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    total_listening_seconds = Column(Integer, default=0)
    total_reading_seconds = Column(Integer, default=0)
    chapters_completed = Column(Integer, default=0)
    quizzes_taken = Column(Integer, default=0)
    avg_quiz_score = Column(Float, default=0.0)
    flashcards_reviewed = Column(Integer, default=0)
    flashcards_mastered = Column(Integer, default=0)
    learning_streak_days = Column(Integer, default=1)
    weak_topics = Column(JSON, nullable=True) # list of weak concepts
    last_active_date = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
