from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import os
import logging

from app.database.database import get_db
from app.models.database_models import Book, Chapter, AudioChunk, TextChunk
from app.services.storage_service import get_storage_provider

from app.services.tts_service import get_tts_provider
from app.config import settings

router = APIRouter(prefix="/books/{book_id}/audio", tags=["Audio"])
logger = logging.getLogger(__name__)

@router.get("/chapters/{chapter_id}/chunks")
def get_chapter_audio_chunks(book_id: str, chapter_id: str, db: Session = Depends(get_db)):
    """Returns the list of text-and-audio chunks for a chapter, in order."""
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id, Chapter.book_id == book_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    chunks = db.query(TextChunk)\
        .filter(TextChunk.chapter_id == chapter_id)\
        .order_by(TextChunk.chunk_index.asc()).all()
        
    storage = get_storage_provider()
    results = []
    
    for tc in chunks:
        ac = db.query(AudioChunk).filter(AudioChunk.text_chunk_id == tc.id).first()
        results.append({
            "chunk_id": tc.id,
            "text": tc.content,
            "chunk_index": tc.chunk_index,
            "page_number": tc.page_number,
            "audio_url": f"/api/books/{book_id}/audio/chunks/{ac.id}" if ac else None,
            "status": ac.status if ac else "pending",
            "duration": ac.duration if ac else 0.0
        })
        
    return results

@router.get("/chunks/{audio_chunk_id}")
async def stream_audio_chunk(book_id: str, audio_chunk_id: str, db: Session = Depends(get_db)):
    """Streams a specific audio chunk MP3 file, generating it on-the-fly if pending."""
    ac = db.query(AudioChunk).filter(AudioChunk.id == audio_chunk_id).first()
    if not ac:
        raise HTTPException(status_code=404, detail="Audio chunk not found")
        
    storage = get_storage_provider()
    
    # On-the-fly synthesis if not yet generated
    if ac.status != "synthesized":
        try:
            logger.info(f"Synthesizing chunk {ac.text_chunk_id} on-the-fly...")
            text_chunk = db.query(TextChunk).filter(TextChunk.id == ac.text_chunk_id).first()
            if not text_chunk:
                raise HTTPException(status_code=404, detail="Text content not found")
                
            # Get provider and voice
            tts_provider = get_tts_provider()
            book = db.query(Book).filter(Book.id == book_id).first()
            lang = book.language if book else "en"
            voices = tts_provider.get_available_voices(lang)
            voice = voices[0]["id"] if voices else "en-US-AriaNeural"
            
            filename = f"{book_id}_ch_{ac.chapter_id}_chunk_{ac.text_chunk_id}.mp3"
            temp_audio_path = os.path.join(settings.AUDIO_DIR, filename)
            
            # Synthesize
            duration = await tts_provider.synthesize(text_chunk.content, temp_audio_path, voice)
            
            # Save file to storage
            with open(temp_audio_path, "rb") as af:
                audio_data = af.read()
            stored_path = storage.save_file(audio_data, "audio", filename)
            
            # Clean local temp file if S3
            if settings.STORAGE_PROVIDER != "local":
                try:
                    os.remove(temp_audio_path)
                except Exception:
                    pass
            
            # Update DB
            ac.filepath = stored_path
            ac.duration = duration
            ac.status = "synthesized"
            db.commit()
            db.refresh(ac)
            
        except Exception as e:
            logger.error(f"On-the-fly synthesis failed: {e}")
            raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {e}")
            
    filepath = storage.get_file_path_or_url(ac.filepath)
    
    # If storage is local file system, return a FileResponse
    if os.path.exists(filepath):
        return FileResponse(filepath, media_type="audio/mpeg", filename=os.path.basename(filepath))
        
    # If it's a URL (S3), we redirect or stream
    elif filepath.startswith("http"):
        import httpx
        # We can redirect
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=filepath)
        
    raise HTTPException(status_code=404, detail="Audio file not found on storage provider")

@router.get("/chapters/{chapter_id}/stream")
def stream_combined_chapter_audio(book_id: str, chapter_id: str, db: Session = Depends(get_db)):
    """Concatenates and streams the entire chapter's audio in a single stream."""
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id, Chapter.book_id == book_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    audio_chunks = db.query(AudioChunk)\
        .filter(AudioChunk.chapter_id == chapter_id, AudioChunk.status == "synthesized")\
        .order_by(AudioChunk.created_at.asc()).all() # Order by creation / link index
        
    if not audio_chunks:
        raise HTTPException(status_code=400, detail="No synthesized audio available for this chapter yet")
        
    # Generator to stream files sequentially
    def audio_generator():
        storage = get_storage_provider()
        for ac in audio_chunks:
            path = storage.get_file_path_or_url(ac.filepath)
            if os.path.exists(path):
                with open(path, "rb") as f:
                    # Stream in 16KB blocks
                    while chunk := f.read(16384):
                        yield chunk
            elif path.startswith("http"):
                import httpx
                with httpx.stream("GET", path) as r:
                    for chunk in r.iter_bytes(chunk_size=16384):
                        yield chunk
                        
    return StreamingResponse(audio_generator(), media_type="audio/mpeg")
