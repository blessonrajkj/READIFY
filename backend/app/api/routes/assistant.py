from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.database.database import get_db
from app.models.database_models import Book, Chapter, AIConversation, AIMessage
from app.models.schemas import QuestionRequest, QuestionResponse, ConversationResponse, MessageResponse
from app.services.rag_service import RAGService

router = APIRouter(prefix="/books/{book_id}/assistant", tags=["AI Assistant"])
logger = logging.getLogger(__name__)

@router.post("/chat", response_model=QuestionResponse)
def ask_assistant(book_id: str, req: QuestionRequest, db: Session = Depends(get_db)):
    """Asks the AI assistant a question about the book content, using RAG."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    # Get or create conversation
    conv_id = req.conversation_id
    conversation = None
    
    if conv_id:
        conversation = db.query(AIConversation).filter(AIConversation.id == conv_id, AIConversation.book_id == book_id).first()
        
    if not conversation:
        conversation = AIConversation(book_id=book_id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
    # Save user message
    user_msg = AIMessage(
        conversation_id=conversation.id,
        role="user",
        content=req.question
    )
    db.add(user_msg)
    db.commit()
    
    try:
        # Run RAG
        rag_service = RAGService(db=db, book_id=book_id)
        rag_result = rag_service.query_book(req.question, chat_history=conversation.messages[:-1])
        
        # Save assistant message
        assistant_msg = AIMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=rag_result["answer"]
        )
        db.add(assistant_msg)
        db.commit()
        
        return QuestionResponse(
            answer=rag_result["answer"],
            conversation_id=conversation.id,
            sources=rag_result.get("sources", [])
        )
    except Exception as e:
        logger.error(f"RAG query failed: {e}")
        # Save error message so conversation isn't broken
        error_msg = AIMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=f"Sorry, I encountered an error processing your query: {e}. Please ensure your GEMINI_API_KEY is configured."
        )
        db.add(error_msg)
        db.commit()
        
        return QuestionResponse(
            answer=error_msg.content,
            conversation_id=conversation.id,
            sources=[]
        )

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(book_id: str, conversation_id: str, db: Session = Depends(get_db)):
    """Retrieves conversation chat history."""
    conversation = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.book_id == book_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    return conversation

@router.get("/chapters/{chapter_id}/summary")
def get_chapter_summary(book_id: str, chapter_id: str, db: Session = Depends(get_db)):
    """Returns the generated summary, takeaways, and concepts for a chapter."""
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id, Chapter.book_id == book_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    # Standard reading rate of 150 WPM
    # Calculate word count of all text chunks in the chapter
    from app.models.database_models import TextChunk
    total_words = 0
    chunks = db.query(TextChunk).filter(TextChunk.chapter_id == chapter_id).all()
    for c in chunks:
        total_words += len(c.content.split())
        
    est_duration_minutes = max(1, round(total_words / 150))
    
    return {
        "summary": chapter.summary or "Summary is being generated in the background...",
        "key_takeaways": chapter.key_takeaways or [],
        "important_concepts": chapter.important_concepts or [],
        "estimated_minutes": est_duration_minutes
    }
