from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from app.database.database import get_db
from app.models.database_models import Book, Chapter, TextChunk, AudioChunk
from app.models.schemas import ChapterResponse, ChapterUpdate, ChapterMergeRequest, ChapterSplitRequest

router = APIRouter(prefix="/books/{book_id}/chapters", tags=["Chapters"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[ChapterResponse])
def get_book_chapters(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    chapters = db.query(Chapter).filter(Chapter.book_id == book_id).order_by(Chapter.order_index.asc()).all()
    return chapters

@router.patch("/{chapter_id}", response_model=ChapterResponse)
def update_chapter(book_id: str, chapter_id: str, chapter_in: ChapterUpdate, db: Session = Depends(get_db)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id, Chapter.book_id == book_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    update_data = chapter_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(chapter, field, value)
        
    db.commit()
    db.refresh(chapter)
    return chapter

@router.delete("/{chapter_id}")
def delete_chapter(book_id: str, chapter_id: str, db: Session = Depends(get_db)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id, Chapter.book_id == book_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    # Delete associated audio files on storage
    from app.services.storage_service import get_storage_provider
    storage = get_storage_provider()
    audio_chunks = db.query(AudioChunk).filter(AudioChunk.chapter_id == chapter_id).all()
    for ac in audio_chunks:
        storage.delete_file(ac.filepath)
        
    db.delete(chapter)
    db.commit()
    return {"detail": "Chapter deleted successfully"}

@router.post("/reorder")
def reorder_chapters(book_id: str, chapter_ids: List[str], db: Session = Depends(get_db)):
    """Accepts a list of chapter IDs in the desired order and updates their order_index."""
    chapters = db.query(Chapter).filter(Chapter.book_id == book_id).all()
    chapter_map = {c.id: c for c in chapters}
    
    for index, c_id in enumerate(chapter_ids):
        if c_id in chapter_map:
            chapter_map[c_id].order_index = index
            
    db.commit()
    return {"detail": "Chapters reordered successfully"}

@router.post("/merge", response_model=ChapterResponse)
def merge_chapters(book_id: str, merge_req: ChapterMergeRequest, db: Session = Depends(get_db)):
    """Merges multiple chapters into a single chapter."""
    if len(merge_req.chapter_ids) < 2:
        raise HTTPException(status_code=400, detail="Must provide at least two chapter IDs to merge")
        
    # Fetch chapters in order
    chapters = db.query(Chapter)\
        .filter(Chapter.id.in_(merge_req.chapter_ids), Chapter.book_id == book_id)\
        .order_by(Chapter.order_index.asc()).all()
        
    if len(chapters) != len(merge_req.chapter_ids):
        raise HTTPException(status_code=404, detail="Some chapters were not found in this book")
        
    main_chapter = chapters[0]
    merged_chapters = chapters[1:]
    
    # 1. Update text chunks of other chapters to refer to main_chapter
    # Compute chunk offsets
    max_chunk_index = db.query(TextChunk)\
        .filter(TextChunk.chapter_id == main_chapter.id)\
        .count()
        
    current_offset = max_chunk_index
    for other_c in merged_chapters:
        other_chunks = db.query(TextChunk)\
            .filter(TextChunk.chapter_id == other_c.id)\
            .order_by(TextChunk.chunk_index.asc()).all()
            
        for chunk in other_chunks:
            chunk.chapter_id = main_chapter.id
            chunk.chunk_index = current_offset
            current_offset += 1
            db.add(chunk)
            
    # 2. Combine duration and page ranges
    total_duration = main_chapter.duration
    end_page = main_chapter.end_page
    
    for other_c in merged_chapters:
        total_duration += other_c.duration
        if other_c.end_page and (not end_page or other_c.end_page > end_page):
            end_page = other_c.end_page
            
    main_chapter.title = merge_req.new_title
    main_chapter.duration = total_duration
    main_chapter.end_page = end_page
    
    # Reset audio chunk associations of merged chapters
    # Note: Chunks will need audio regeneration if merged (or we can combine MP3s in workers,
    # but simplest is to invalidate audio status so worker synthesizes them if needed)
    db.query(AudioChunk).filter(AudioChunk.chapter_id.in_([c.id for c in merged_chapters])).delete(synchronize_session=False)
    
    # Delete secondary chapters
    for other_c in merged_chapters:
        db.delete(other_c)
        
    db.commit()
    db.refresh(main_chapter)
    return main_chapter

@router.post("/{chapter_id}/split", response_model=List[ChapterResponse])
def split_chapter(book_id: str, chapter_id: str, split_req: ChapterSplitRequest, db: Session = Depends(get_db)):
    """Splits a single chapter into two parts at a specific text chunk index."""
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id, Chapter.book_id == book_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    chunks = db.query(TextChunk)\
        .filter(TextChunk.chapter_id == chapter_id)\
        .order_by(TextChunk.chunk_index.asc()).all()
        
    split_index = split_req.split_char_index # interpreting split index as TextChunk index
    if split_index <= 0 or split_index >= len(chunks):
        raise HTTPException(status_code=400, detail="Invalid split chunk index position")
        
    first_part_chunks = chunks[:split_index]
    second_part_chunks = chunks[split_index:]
    
    # Create new chapter
    new_chapter_num = chapter.chapter_number + 1
    
    # Shift existing chapters
    db.query(Chapter)\
        .filter(Chapter.book_id == book_id, Chapter.order_index > chapter.order_index)\
        .update({Chapter.order_index: Chapter.order_index + 1, Chapter.chapter_number: Chapter.chapter_number + 1})
        
    new_chapter = Chapter(
        book_id=book_id,
        title=f"{chapter.title} (Part 2)",
        chapter_number=new_chapter_num,
        start_page=second_part_chunks[0].page_number if second_part_chunks else chapter.start_page,
        end_page=chapter.end_page,
        duration=chapter.duration * (len(second_part_chunks) / len(chunks)),
        order_index=chapter.order_index + 1
    )
    db.add(new_chapter)
    db.flush() # flush to generate ID
    
    # Update first chapter's end page and duration
    chapter.end_page = first_part_chunks[-1].page_number if first_part_chunks else chapter.start_page
    chapter.duration = chapter.duration * (len(first_part_chunks) / len(chunks))
    
    # Move second part chunks to the new chapter
    for idx, chunk in enumerate(second_part_chunks):
        chunk.chapter_id = new_chapter.id
        chunk.chunk_index = idx
        db.add(chunk)
        
    # Reindex first part chunks just in case
    for idx, chunk in enumerate(first_part_chunks):
        chunk.chunk_index = idx
        db.add(chunk)
        
    # Delete existing audio chunks for this chapter as it was split (invalidation)
    db.query(AudioChunk).filter(AudioChunk.chapter_id == chapter_id).delete()
    
    db.commit()
    db.refresh(chapter)
    db.refresh(new_chapter)
    
    return [chapter, new_chapter]
