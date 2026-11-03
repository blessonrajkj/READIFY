from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Book Schemas
class BookResponse(BaseModel):
    id: str
    title: str
    author: Optional[str] = None
    filename: str
    filepath: str
    cover_path: Optional[str] = None
    language: str
    status: str
    total_pages: int
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    status: Optional[str] = None
    language: Optional[str] = None

# Chapter Schemas
class ChapterResponse(BaseModel):
    id: str
    book_id: str
    title: str
    chapter_number: int
    start_page: Optional[int] = None
    end_page: Optional[int] = None
    duration: float
    summary: Optional[str] = None
    key_takeaways: Optional[List[str]] = None
    important_concepts: Optional[List[Any]] = None
    order_index: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    key_takeaways: Optional[List[str]] = None
    order_index: Optional[int] = None

class ChapterCreate(BaseModel):
    title: str
    chapter_number: int
    start_page: Optional[int] = None
    end_page: Optional[int] = None
    order_index: int

class ChapterMergeRequest(BaseModel):
    chapter_ids: List[str]
    new_title: str

class ChapterSplitRequest(BaseModel):
    split_char_index: int # character index in text where the split should happen

# Text Chunk Schema
class TextChunkResponse(BaseModel):
    id: str
    book_id: str
    chapter_id: str
    content: str
    chunk_index: int
    page_number: Optional[int] = None

    class Config:
        from_attributes = True

# Listening Progress Schemas
class ListeningProgressResponse(BaseModel):
    id: str
    book_id: str
    current_chapter_id: Optional[str] = None
    position_seconds: float
    speed: float
    updated_at: datetime

    class Config:
        from_attributes = True

class ListeningProgressUpdate(BaseModel):
    current_chapter_id: Optional[str] = None
    position_seconds: float
    speed: float = 1.0

# Search Schemas
class SearchResultItem(BaseModel):
    content: str
    chapter_title: str
    chapter_id: str
    page_number: Optional[int] = None
    char_index: int

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]

# AI Assistant Schemas
class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: str
    book_id: str
    created_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

class QuestionRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None

class QuestionResponse(BaseModel):
    answer: str
    conversation_id: str
    sources: List[Dict[str, Any]] = []

# Job Schema
class JobResponse(BaseModel):
    id: str
    book_id: str
    job_type: str
    status: str
    progress: int
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Bookmark Schemas
class BookmarkCreate(BaseModel):
    chapter_id: str
    chunk_id: Optional[str] = None
    chunk_index: int = 0
    page_number: Optional[int] = None
    text_snippet: Optional[str] = None
    note: Optional[str] = None

class BookmarkResponse(BaseModel):
    id: str
    book_id: str
    chapter_id: str
    chunk_id: Optional[str] = None
    chunk_index: int = 0
    page_number: Optional[int] = None
    text_snippet: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Study Note Schemas
class StudyNoteCreate(BaseModel):
    chapter_id: Optional[str] = None
    title: str
    content: str
    tags: Optional[List[str]] = []
    color: Optional[str] = "default"

class StudyNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    color: Optional[str] = None
    is_pinned: Optional[bool] = None

class StudyNoteResponse(BaseModel):
    id: str
    book_id: str
    chapter_id: Optional[str] = None
    title: str
    content: str
    tags: Optional[List[str]] = []
    color: Optional[str] = "default"
    is_pinned: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Flashcard Schemas
class FlashcardCreate(BaseModel):
    chapter_id: Optional[str] = None
    front: str
    back: str
    category: Optional[str] = "Concept"
    difficulty: Optional[str] = "medium"
    source_page: Optional[int] = None

class FlashcardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    is_mastered: Optional[bool] = None

class FlashcardResponse(BaseModel):
    id: str
    book_id: str
    chapter_id: Optional[str] = None
    front: str
    back: str
    category: str
    difficulty: str
    source_page: Optional[int] = None
    is_mastered: bool
    review_count: int
    last_reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Quiz Schemas
class QuizQuestionResponse(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_option_index: int
    explanation: str
    source_reference: Optional[str] = None
    difficulty: str
    order_index: int

    class Config:
        from_attributes = True

class QuizResponse(BaseModel):
    id: str
    book_id: str
    chapter_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    difficulty: str
    time_limit_seconds: int
    total_questions: int
    created_at: datetime
    questions: List[QuizQuestionResponse] = []

    class Config:
        from_attributes = True

class QuizCreateRequest(BaseModel):
    chapter_id: Optional[str] = None
    difficulty: Optional[str] = "medium"
    question_count: Optional[int] = 5

class QuizSubmission(BaseModel):
    answers: Dict[str, int] # question_id -> selected_option_index
    duration_seconds: int = 0

class QuizAttemptResponse(BaseModel):
    id: str
    quiz_id: str
    book_id: str
    score: int
    total_questions: int
    percentage: float
    answers: Dict[str, int]
    weak_topics: Optional[List[str]] = []
    duration_seconds: int
    created_at: datetime

    class Config:
        from_attributes = True

# Reading Progress Schemas
class ReadingProgressUpdate(BaseModel):
    current_chapter_id: Optional[str] = None
    current_page: int = 1
    reading_seconds_delta: int = 0 # seconds elapsed in this reading session

class ReadingProgressResponse(BaseModel):
    id: str
    book_id: str
    current_chapter_id: Optional[str] = None
    current_page: int
    reading_seconds: int
    updated_at: datetime

    class Config:
        from_attributes = True

# Learning Analytics Schemas
class RecordLearningHeartbeat(BaseModel):
    book_id: str
    activity_type: str # "reading" or "listening"
    seconds_delta: int = 15

class LearningAnalyticsResponse(BaseModel):
    total_listening_seconds: int = 0
    total_reading_seconds: int = 0
    total_study_minutes: int = 0
    chapters_completed: int = 0
    quizzes_taken: int = 0
    avg_quiz_score: float = 0.0
    flashcards_reviewed: int = 0
    flashcards_mastered: int = 0
    learning_streak_days: int = 1
    weak_topics: List[str] = []
    retention_score: int = 0
