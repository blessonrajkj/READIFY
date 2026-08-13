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
