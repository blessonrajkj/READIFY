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
        
        # Save text chunks in database
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
            
            tts_chunks_to_process.append((db_chapter.id, db_chunk.id, chunk_data["content"]))
            
    db.commit()
    
    # 3. Text-to-Speech (TTS) Synthesis
    # We synthesize chunk-by-chunk and save audio records
    logger.info(f"Step 3: Synthesizing speech for {len(tts_chunks_to_process)} chunks...")
    tts_provider = get_tts_provider()
    storage = get_storage_provider()
    
    # Deduce language and voice
    # Simple check for Hindi/Tamil characters
    lang = book.language or "en"
    # Choose default voice based on language
    available_voices = tts_provider.get_available_voices(lang)
    default_voice = available_voices[0]["id"] if available_voices else None
    
    total_chunks = len(tts_chunks_to_process)
    
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
        
    # Process TTS
    for idx, (chapter_id, chunk_id, content) in enumerate(tts_chunks_to_process):
        # Calculate progress from 55% to 95%
        tts_progress = 55 + int((idx / total_chunks) * 40) if total_chunks > 0 else 95
        job.progress = tts_progress
        db.commit()
        
        # Audio filename
        filename = f"{book_id}_ch_{chapter_id}_chunk_{chunk_id}.mp3"
        temp_audio_path = os.path.join(settings.AUDIO_DIR, filename)
        
        try:
            # Perform synthesis
            duration = await tts_provider.synthesize(content, temp_audio_path, default_voice)
            
            # Save chunk to storage provider
            with open(temp_audio_path, "rb") as af:
                audio_data = af.read()
            stored_path = storage.save_file(audio_data, "audio", filename)
            
            # Remove temp local audio file if storage is not local
            if settings.STORAGE_PROVIDER != "local":
                try:
                    os.remove(temp_audio_path)
                except Exception:
                    pass
                    
            # Save AudioChunk in DB
            db_audio_chunk = AudioChunk(
                text_chunk_id=chunk_id,
                chapter_id=chapter_id,
                filepath=stored_path,
                duration=duration,
                status="synthesized"
            )
            db.add(db_audio_chunk)
            db.commit()
            
        except Exception as e:
            logger.error(f"TTS synthesis failed for chunk {chunk_id}: {e}")
            # Save failed audio chunk
            db_audio_chunk = AudioChunk(
                text_chunk_id=chunk_id,
                chapter_id=chapter_id,
                filepath="",
                duration=0.0,
                status="failed",
                try_count=1
            )
            db.add(db_audio_chunk)
            db.commit()
            
    # Calculate chapter durations
    logger.info("Finalizing chapter durations...")
    chapters_db = db.query(Chapter).filter(Chapter.book_id == book_id).all()
    for ch in chapters_db:
        # Sum of audio durations
        total_duration = db.query(text("SUM(duration)")).select_from(AudioChunk).filter(AudioChunk.chapter_id == ch.id).scalar() or 0.0
        ch.duration = float(total_duration)
        db.add(ch)
        
    # Mark job and book as completed!
    job.progress = 100
    job.status = "completed"
    book.status = "completed"
    db.commit()
    logger.info(f"Job {job.id} for book '{book.title}' completed successfully!")

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
                # No jobs found, sleep for a short duration
                await asyncio.sleep(1.5)
        except Exception as e:
            logger.error(f"Worker database loop exception: {e}")
            await asyncio.sleep(5)
        finally:
            db.close()

if __name__ == "__main__":
    asyncio.run(worker_loop())
