from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import re
import logging

from app.database.database import get_db
from app.models.database_models import Book, TextChunk, Chapter
from app.models.schemas import SearchResponse, SearchResultItem

router = APIRouter(prefix="/books/{book_id}/search", tags=["Search"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=SearchResponse)
def search_book_content(
    book_id: str,
    q: str = Query(..., min_length=2, description="Search query string"),
    db: Session = Depends(get_db)
):
    """Searches for occurrences of query text in the book's extracted text chunks."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    # Query matching text chunks
    # We load the parent chapter title as well to display it in results
    matches = db.query(TextChunk, Chapter.title)\
        .join(Chapter, TextChunk.chapter_id == Chapter.id)\
        .filter(TextChunk.book_id == book_id, TextChunk.content.ilike(f"%{q}%"))\
        .limit(50).all()
        
    results = []
    
    # We want to extract a snippet around the match
    for tc, chapter_title in matches:
        content = tc.content
        # Case insensitive find
        iterator = re.finditer(re.escape(q), content, re.IGNORECASE)
        for match in iterator:
            start_pos = match.start()
            end_pos = match.end()
            
            # Substring snippet (100 characters before and after)
            snippet_start = max(0, start_pos - 80)
            snippet_end = min(len(content), end_pos + 80)
            
            snippet = content[snippet_start:snippet_end]
            # Add ellipses if text is cut off
            if snippet_start > 0:
                snippet = "..." + snippet
            if snippet_end < len(content):
                snippet = snippet + "..."
                
            results.append(SearchResultItem(
                content=snippet,
                chapter_title=chapter_title,
                chapter_id=tc.chapter_id,
                page_number=tc.page_number,
                char_index=start_pos
            ))
            
    return SearchResponse(query=q, results=results)
