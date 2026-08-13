import os
import time
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

# Set up logging before imports
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("audio_worker")

from app.database.database import SessionLocal, engine
from app.models.database_models import Book, Chapter, TextChunk, AudioChunk, Job
from app.services.pdf_service import PDFService
from app.services.ocr_service import OCRService
from app.services.text_cleaner import TextCleaner
from app.services.chapter_detector import ChapterDetector
from app.services.chunk_service import ChunkService
from app.services.tts_service import get_tts_provider
from app.services.storage_service import get_storage_provider
from app.config import settings

# Initialize OCR service lazily only if needed (since loading EasyOCR models takes memory)
_ocr_service = None
def get_ocr_service() -> OCRService:
    global _ocr_service
    if not _ocr_service:
        _ocr_service = OCRService()
    return _ocr_service

async def process_pdf_job(db: Session, job: Job):
    """Executes the complete PDF text extraction, structuring, and audio synthesis pipeline."""
    book_id = job.book_id
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise ValueError(f"Book with ID {book_id} not found.")
        
    logger.info(f"Starting job {job.id} for book '{book.title}'")
    book.status = "processing"
    db.commit()
    
    # Track steps:
    # 0-10%: Loading & analysis
    # 10-40%: Text Extraction (or OCR)
    # 40-50%: Chapter Detection & database saving
    # 50-95%: TTS Audio Generation
    # 95-100%: Cleanup & completion
    
    job.status = "processing"
    job.progress = 5
    db.commit()
    
    # 1. Text Extraction / OCR
    logger.info("Step 1: Extracting text...")
    job.progress = 10
    db.commit()
    
    metadata = PDFService.extract_text_and_metadata(book.filepath)
    needs_ocr = metadata.get("needs_ocr", False)
    raw_pages = metadata.get("pages", [])
    total_pages = metadata.get("total_pages", 0)
    
    extracted_pages = []
    
    if needs_ocr:
        logger.info(f"PDF is scanned/image-only. Running OCR on {total_pages} pages...")
        ocr = get_ocr_service()
        for idx in range(total_pages):
            # Calculate OCR progress from 10% to 40%
            page_progress = 10 + int((idx / total_pages) * 30)
            job.progress = page_progress
            db.commit()
            
            page_text = ocr.extract_text_from_page(book.filepath, idx)
            extracted_pages.append(page_text)
    else:
        logger.info("PDF has selectable text. Using direct extraction.")
        extracted_pages = raw_pages
        job.progress = 40
        db.commit()
        
    # 2. Structuring / Chapter Detection
    logger.info("Step 2: Detecting chapters...")
    job.progress = 45
    db.commit()
    
    detected_chapters = ChapterDetector.detect_chapters(extracted_pages)
    logger.info(f"Detected {len(detected_chapters)} chapters/sections.")
    
    # Clear existing chapters & chunks if reprocessing
    db.query(Chapter).filter(Chapter.book_id == book_id).delete()
    db.commit()
    
    # Save chapters & extract chunkable text
    job.progress = 50
    db.commit()
    
    tts_chunks_to_process = []
    
    for idx, dc in enumerate(detected_chapters):
        # Create chapter
        db_chapter = Chapter(
            book_id=book_id,
            title=dc["title"],
            chapter_number=idx + 1,
            start_page=dc["start_page"],
            end_page=dc["end_page"],
            order_index=dc["order_index"]
        )
        db.add(db_chapter)
        db.flush() # Flush to generate chapter.id
        
        # Combine pages text for this chapter
        chapter_raw_text = ""
        for page_num in range(dc["start_page"], dc["end_page"] + 1):
            if page_num < len(extracted_pages):
                chapter_raw_text += extracted_pages[page_num] + "\n\n"
                
        # Clean text
        chapter_clean_text = TextCleaner.clean_text(chapter_raw_text, book.title, book.author or "")
        
        # Split into chunks
        chunks = ChunkService.chunk_text(chapter_clean_text)
        
        # Save text chunks in database and create corresponding pending AudioChunk records
        for tc_idx, chunk_data in enumerate(chunks):
            db_chunk = TextChunk(
                book_id=book_id,
                chapter_id=db_chapter.id,
                content=chunk_data["content"],
                chunk_index=chunk_data["chunk_index"],
                start_char=chunk_data["start_char"],
                end_char=chunk_data["end_char"],
                page_number=dc["start_page"] # approximate
            )
            db.add(db_chunk)
            db.flush() # Flush to get chunk ID
            
            # Create a pending AudioChunk record
            db_audio_chunk = AudioChunk(
                text_chunk_id=db_chunk.id,
                chapter_id=db_chapter.id,
                filepath="",
                duration=0.0,
                status="pending"
            )
            db.add(db_audio_chunk)
            
    db.commit()
    
    # Generate summary for each chapter asynchronously using Gemini (if key is set)
    if settings.GEMINI_API_KEY:
        logger.info("Generating AI chapter summaries using Gemini...")
        from app.services.rag_service import RAGService
        chapters_db = db.query(Chapter).filter(Chapter.book_id == book_id).all()
        for ch in chapters_db:
            ch_chunks = db.query(TextChunk).filter(TextChunk.chapter_id == ch.id).order_by(TextChunk.chunk_index.asc()).all()
            ch_full_text = " ".join([c.content for c in ch_chunks])
            
            try:
                summary_data = RAGService.generate_chapter_summaries_llm(ch.title, ch_full_text, settings.GEMINI_API_KEY)
                ch.summary = summary_data.get("summary")
                ch.key_takeaways = summary_data.get("key_takeaways")
                ch.important_concepts = summary_data.get("important_concepts")
                db.add(ch)
            except Exception as e:
                logger.error(f"Failed to generate summary for chapter {ch.title}: {e}")
        db.commit()
        
    # Mark job and book as completed!
    job.progress = 100
    job.status = "completed"
    book.status = "completed"
    db.commit()
    logger.info(f"Job {job.id} for book '{book.title}' structured successfully!")

async def worker_loop():
    """Main worker event loop to poll and execute jobs."""
    logger.info("Readify AI Background Worker started. Waiting for jobs...")
    
    while True:
        db = SessionLocal()
        try:
            # PostgreSQL FOR UPDATE SKIP LOCKED
            # Selects and locks a single pending job so that multiple workers can run concurrently
            query = text("""
                SELECT id FROM jobs 
                WHERE status = 'pending' 
                ORDER BY created_at ASC 
                LIMIT 1 
                FOR UPDATE SKIP LOCKED
            """)
            result = db.execute(query).fetchone()
            
            if result:
                job_id = result[0]
                # Lock and fetch job object in SQLAlchemy
                job = db.query(Job).filter(Job.id == job_id).first()
                if job:
                    # Update status to processing immediately within the transaction
                    job.status = "processing"
                    job.updated_at = datetime.utcnow()
                    db.commit()
                    
                    try:
                        # Process
                        await process_pdf_job(db, job)
                    except Exception as e:
                        logger.error(f"Error processing job {job_id}: {e}")
                        db.rollback()
                        
                        # Fetch job again to mark as failed
                        job = db.query(Job).filter(Job.id == job_id).first()
                        if job:
                            job.status = "failed"
                            job.error_message = str(e)
                            db.add(job)
                            
                        # Update book status to failed
                        book = db.query(Book).filter(Book.id == job.book_id).first()
                        if book:
                            book.status = "failed"
                            db.add(book)
                            
                        db.commit()
            else:
                # No PDF processing jobs found, let's poll for a pending AudioChunk to synthesize in the background!
                # Select a pending AudioChunk
                ac = db.query(AudioChunk).filter(AudioChunk.status == "pending").first()
                if ac:
                    # Let's synthesize this specific audio chunk in the background!
                    # Get its text chunk
                    text_chunk = db.query(TextChunk).filter(TextChunk.id == ac.text_chunk_id).first()
                    if text_chunk:
                        # Mark it as processing so other workers don't pick it up
                        ac.status = "processing"
                        db.commit()
                        
                        try:
                            # Perform synthesis
                            tts_provider = get_tts_provider()
                            storage = get_storage_provider()
                            
                            # Get book and voice
                            book = db.query(Book).filter(Book.id == text_chunk.book_id).first()
                            lang = book.language if book else "en"
                            voices = tts_provider.get_available_voices(lang)
                            voice = voices[0]["id"] if voices else "en-US-AriaNeural"
                            
                            filename = f"{text_chunk.book_id}_ch_{ac.chapter_id}_chunk_{ac.text_chunk_id}.mp3"
                            temp_audio_path = os.path.join(settings.AUDIO_DIR, filename)
                            
                            duration = await tts_provider.synthesize(text_chunk.content, temp_audio_path, voice)
                            
                            with open(temp_audio_path, "rb") as af:
                                audio_data = af.read()
                            stored_path = storage.save_file(audio_data, "audio", filename)
                            
                            if settings.STORAGE_PROVIDER != "local":
                                try:
                                    os.remove(temp_audio_path)
                                except Exception:
                                    pass
                                    
                            ac.filepath = stored_path
                            ac.duration = duration
                            ac.status = "synthesized"
                            db.commit()
                            
                            # Also update the chapter duration in the DB
                            ch = db.query(Chapter).filter(Chapter.id == ac.chapter_id).first()
                            if ch:
                                total_duration = db.query(text("SUM(duration)")).select_from(AudioChunk).filter(AudioChunk.chapter_id == ch.id).scalar() or 0.0
                                ch.duration = float(total_duration)
                                db.commit()
                                
                            logger.info(f"Background synthesized audio chunk {ac.id} for book {text_chunk.book_id}")
                        except Exception as e:
                            logger.error(f"Background synthesis failed for chunk {ac.id}: {e}")
                            ac.status = "pending" # Reset so it retries later
                            db.commit()
                    else:
                        # Bad database entry
                        db.delete(ac)
                        db.commit()
                else:
                    # No PDF jobs and no pending audio chunks, sleep for a short duration
                    await asyncio.sleep(1.5)
        except Exception as e:
            logger.error(f"Worker database loop exception: {e}")
            await asyncio.sleep(5)
        finally:
            db.close()

if __name__ == "__main__":
    # Force logging to console and set root level to INFO
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Clear any bad handlers and add a clean stdout stream handler
    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
    root_logger.addHandler(console_handler)
    
    # Direct print to bypass buffering/logging silencing
    print("\n==================================================", flush=True)
    print("Readify AI Background Worker successfully initialized!", flush=True)
    print("Waiting for PDF-to-Audiobook jobs...", flush=True)
    print("==================================================\n", flush=True)
    
    asyncio.run(worker_loop())
