import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import logging

from app.database.database import get_db
from app.models.database_models import Book, Job, User
from app.models.schemas import BookResponse, JobResponse
from app.services.pdf_service import PDFService
from app.services.storage_service import get_storage_provider
from app.api.routes.auth import get_current_user_optional
from app.config import settings

router = APIRouter(prefix="/books", tags=["Books"])
logger = logging.getLogger(__name__)

# File validation rules
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = {".pdf"}

def validate_file(file: UploadFile):
    # Extension check
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Only PDF files are allowed."
        )
    
    # Check mime type (basic check, could be spoofed, so we also rely on extension and content parsing)
    if file.content_type != "application/pdf" and not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content type must be PDF."
        )

@router.post("/upload", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def upload_book(
    file: UploadFile = File(...),
    title_override: Optional[str] = Form(None),
    author_override: Optional[str] = Form(None),
    language: str = Form("en"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # Validate file format
    validate_file(file)
    
    # Save the file first to measure size and process it
    book_id = str(uuid.uuid4())
    secure_filename = f"{book_id}_{secure_filename_helper(file.filename)}"
    storage = get_storage_provider()
    
    # Read file content
    contents = await file.read()
    file_size = len(contents)
    
    # Validate file size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File is too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB."
        )
    
    # Save to storage (uploads category)
    try:
        saved_path = storage.save_file(contents, "uploads", secure_filename)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save uploaded PDF: {e}"
        )
    
    try:
        # Render cover image and extract metadata
        metadata = PDFService.extract_text_and_metadata(saved_path)
        
        # Cover extraction
        cover_filename = f"{book_id}_cover.jpg"
        cover_local_path = PDFService.extract_cover_image(saved_path, cover_filename)
        
        cover_path = None
        if cover_local_path and os.path.exists(cover_local_path):
            # Save cover to storage
            with open(cover_local_path, "rb") as cf:
                cover_content = cf.read()
            cover_path = storage.save_file(cover_content, "covers", cover_filename)
            # Remove local temp cover if storage is not local
            if settings.STORAGE_PROVIDER != "local":
                try:
                    os.remove(cover_local_path)
                except Exception:
                    pass
        
        # Determine book details
        book_title = title_override or metadata.get("title") or os.path.splitext(file.filename)[0]
        book_author = author_override or metadata.get("author") or "Unknown Author"
        total_pages = metadata.get("total_pages") or 0
        needs_ocr = metadata.get("needs_ocr") or False
        
        # Create Book model
        db_book = Book(
            id=book_id,
            title=book_title,
            author=book_author,
            filename=file.filename,
            filepath=saved_path,
            cover_path=cover_path,
            language=language,
            total_pages=total_pages,
            file_size=file_size,
            status="pending"
        )
        db.add(db_book)
        db.commit()
        db.refresh(db_book)
        
        # Create processing Job
        db_job = Job(
            book_id=book_id,
            job_type="process_pdf",
            status="pending",
            progress=0,
            payload={"needs_ocr": needs_ocr}
        )
        db.add(db_job)
        db.commit()
        
        logger.info(f"Book '{book_title}' successfully uploaded and queued for processing. Job ID: {db_job.id}")
        return db_book
        
    except Exception as e:
        logger.error(f"Error post-processing PDF upload: {e}")
        # Cleanup file if failed
        storage.delete_file(saved_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize PDF processing: {e}"
        )

@router.get("/", response_model=List[BookResponse])
def list_books(db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    books = db.query(Book).order_by(Book.created_at.desc()).all()
    return books

@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.delete("/{book_id}")
def delete_book(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    storage = get_storage_provider()
    
    # 1. Delete source PDF
    if book.filepath:
        storage.delete_file(book.filepath)
        
    # 2. Delete cover image
    if book.cover_path:
        storage.delete_file(book.cover_path)
        
    # 3. Audio chunks delete
    # Query all audio chunks associated with this book and delete files
    from app.models.database_models import AudioChunk, TextChunk
    audio_chunks = db.query(AudioChunk).join(TextChunk).filter(TextChunk.book_id == book_id).all()
    for ac in audio_chunks:
        storage.delete_file(ac.filepath)
        
    # 4. Remove DB records (cascade deletes chapters, chunks, jobs, progress, assistant messages)
    db.delete(book)
    db.commit()
    
    return {"detail": "Book and all related audio files deleted successfully"}

@router.post("/{book_id}/reprocess", response_model=JobResponse)
def reprocess_book(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    # Reset status
    book.status = "pending"
    db.add(book)
    
    # Terminate active jobs if any
    active_jobs = db.query(Job).filter(Job.book_id == book_id, Job.status.in_(["pending", "processing"])).all()
    for j in active_jobs:
        j.status = "failed"
        j.error_message = "Terminated due to user reprocess request."
        db.add(j)
        
    # Create new job
    # Recheck if it needs OCR
    metadata = PDFService.extract_text_and_metadata(book.filepath)
    needs_ocr = metadata.get("needs_ocr") or False
    
    db_job = Job(
        book_id=book_id,
        job_type="process_pdf",
        status="pending",
        progress=0,
        payload={"needs_ocr": needs_ocr}
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    return db_job

@router.get("/{book_id}/progress", response_model=Optional[JobResponse])
def get_book_progress(book_id: str, db: Session = Depends(get_db)):
    # Find the most recent active or last completed job for the book
    job = db.query(Job).filter(Job.book_id == book_id).order_by(Job.created_at.desc()).first()
    return job

def secure_filename_helper(filename: str) -> str:
    """Sanitizes file names to prevent path traversal and clean up whitespace."""
    import re
    # Extract basename just in case
    base = os.path.basename(filename)
    # Remove non-alphanumeric, dots, dashes or underscores
    name_part, ext = os.path.splitext(base)
    sanitized_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', name_part)
    # Keep it reasonable length
    return f"{sanitized_name[:50]}{ext.lower()}"
