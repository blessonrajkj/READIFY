import numpy as np
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional, Tuple
import logging
from app.config import settings
from app.models.database_models import TextChunk, AIMessage

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, db: Session, book_id: str):
        self.db = db
        self.book_id = book_id
        self._initialize_gemini()

    def _initialize_gemini(self):
        self.api_key = settings.GEMINI_API_KEY
        self.has_api_key = bool(self.api_key)
        
        if self.has_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.genai = genai
                logger.info("Gemini AI API successfully configured in RAGService.")
            except Exception as e:
                logger.error(f"Failed to configure Gemini Generative AI: {e}")
                self.has_api_key = False
        else:
            logger.warning("GEMINI_API_KEY not configured. AI Book Assistant will operate in local fallback mode.")

    def _get_all_chunks(self) -> List[TextChunk]:
        """Retrieves all text chunks for this book from the database."""
        return self.db.query(TextChunk).filter(TextChunk.book_id == self.book_id).all()

    def _get_local_tfidf_similarity(self, query: str, chunks: List[TextChunk]) -> List[Tuple[float, TextChunk]]:
        """A simple, robust, dependency-free TF-IDF matching fallback for offline searches."""
        import math
        from collections import Counter
        
        def tokenize(text):
            return re.findall(r'\w+', text.lower())
            
        import re
        query_words = tokenize(query)
        if not query_words:
            return [(0.0, chunk) for chunk in chunks]
            
        # Count term frequencies in chunks
        chunk_docs = [tokenize(c.content) for c in chunks]
        num_docs = len(chunks)
        
        # Calculate IDF
        idf = {}
        all_words = set(query_words)
        for word in all_words:
            doc_count = sum(1 for doc in chunk_docs if word in doc)
            # Standard smooth IDF
            idf[word] = math.log((1 + num_docs) / (1 + doc_count)) + 1
            
        scores = []
        for idx, doc in enumerate(chunk_docs):
            if not doc:
                scores.append((0.0, chunks[idx]))
                continue
            # Score doc
            doc_counter = Counter(doc)
            score = 0.0
            for word in query_words:
                if word in doc_counter:
                    # Term frequency * Inverse document frequency
                    tf = doc_counter[word] / len(doc)
                    score += tf * idf[word]
            scores.append((score, chunks[idx]))
            
        # Sort by score descending
        scores.sort(key=lambda x: x[0], reverse=True)
        return scores

    def _get_gemini_embeddings_and_search(self, query: str, chunks: List[TextChunk], limit: int = 5) -> List[TextChunk]:
        """Retrieves top matching chunks using Gemini Embeddings and cosine similarity."""
        try:
            # 1. Generate query embedding
            q_emb_res = self.genai.embed_content(
                model="models/text-embedding-004",
                content=query,
                task_type="retrieval_query"
            )
            q_emb = np.array(q_emb_res["embedding"])
            
            # 2. Embed all chunks (in a production environment, we should pre-embed and store embeddings in DB
            # but for a single book on-the-fly, or batch-processing on upload, this works.
            # To be efficient, we batch embed or use cache. Let's do batch embedding.)
            texts = [c.content for c in chunks]
            # Chunk lists into groups of 100 to avoid API limits
            embeddings = []
            chunk_size = 100
            for i in range(0, len(texts), chunk_size):
                batch_texts = texts[i:i+chunk_size]
                emb_res = self.genai.embed_content(
                    model="models/text-embedding-004",
                    content=batch_texts,
                    task_type="retrieval_document"
                )
                embeddings.extend(emb_res["embedding"])
                
            embs_matrix = np.array(embeddings)
            
            # 3. Calculate cosine similarity
            norms = np.linalg.norm(embs_matrix, axis=1)
            q_norm = np.linalg.norm(q_emb)
            
            # Avoid division by zero
            norms[norms == 0] = 1e-10
            if q_norm == 0:
                q_norm = 1e-10
                
            similarities = np.dot(embs_matrix, q_emb) / (norms * q_norm)
            
            # 4. Sort and return
            top_indices = np.argsort(similarities)[::-1][:limit]
            return [chunks[idx] for idx in top_indices]
            
        except Exception as e:
            logger.error(f"Gemini embedding search failed: {e}. Falling back to TF-IDF.")
            # Fallback to local TF-IDF if embedding fails
            tfidf_results = self._get_local_tfidf_similarity(query, chunks)
            return [chunk for score, chunk in tfidf_results[:limit]]

    def query_book(self, question: str, chat_history: List[AIMessage] = None) -> Dict[str, Any]:
        """Queries the book using retrieved passages and LLM answer generation."""
        chunks = self._get_all_chunks()
        if not chunks:
            return {
                "answer": "This book does not have any processed text chunks. Please ensure it is processed successfully.",
                "sources": []
            }
            
        # 1. Retrieve top 5 matching passages
        if self.has_api_key:
            matched_chunks = self._get_gemini_embeddings_and_search(question, chunks, limit=5)
        else:
            tfidf_results = self._get_local_tfidf_similarity(question, chunks)
            matched_chunks = [chunk for score, chunk in tfidf_results[:5]]
            
        # 2. Build context string
        context = ""
        sources = []
        for idx, c in enumerate(matched_chunks):
            # Find chapter title
            from app.models.database_models import Chapter
            chapter = self.db.query(Chapter).filter(Chapter.id == c.chapter_id).first()
            ch_title = chapter.title if chapter else f"Chapter {c.chapter_id}"
            
            context += f"\n--- Source {idx+1} (Page {c.page_number or 'N/A'}, {ch_title}) ---\n{c.content}\n"
            sources.append({
                "page": c.page_number,
                "chapter_title": ch_title,
                "chapter_id": c.chapter_id,
                "snippet": c.content[:150] + "..."
            })
            
        # 3. Generate response using Gemini
        if self.has_api_key:
            try:
                # Format chat history
                history_prompt = ""
                if chat_history:
                    history_prompt = "\nHere is the recent conversation history for context:\n"
                    for msg in chat_history[-6:]:  # Last 6 messages
                        history_prompt += f"{msg.role.capitalize()}: {msg.content}\n"
                
                prompt = (
                    f"You are Readify AI, an expert reading assistant. Answer the user's question about the book using ONLY the provided text passages.\n"
                    f"If the information is not in the text passages, state clearly that the book does not mention it and do not make up details.\n\n"
                    f"--- Text Passages ---\n{context}\n"
                    f"{history_prompt}\n"
                    f"Question: {question}\n\n"
                    f"Answer (be structured, reference chapter names or pages if mentioned in the sources):"
                )
                
                model = self.genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(prompt)
                
                return {
                    "answer": response.text,
                    "sources": sources
                }
            except Exception as e:
                logger.error(f"Gemini generative completion failed: {e}")
                return {
                    "answer": f"I found some relevant passages, but failed to generate an AI response due to an API error: {e}.\nHere are the raw passages retrieved:\n\n{context}",
                    "sources": sources
                }
        else:
            # Fallback when there's no API key
            fallback_answer = (
                "**Local Offline Mode (No API Key Configured)**\n\n"
                "To get AI-generated answers, please configure `GEMINI_API_KEY` in the `.env` file.\n"
                "However, I searched the book and found these relevant passages matching your question:\n\n"
            )
            for idx, c in enumerate(matched_chunks):
                from app.models.database_models import Chapter
                chapter = self.db.query(Chapter).filter(Chapter.id == c.chapter_id).first()
                ch_title = chapter.title if chapter else f"Chapter {c.chapter_id}"
                fallback_answer += f"**From Page {c.page_number or 'N/A'} ({ch_title}):**\n> {c.content.strip()[:300]}...\n\n"
                
            return {
                "answer": fallback_answer,
                "sources": sources
            }

    @staticmethod
    def generate_chapter_summaries_llm(chapter_title: str, text: str, api_key: str) -> Dict[str, Any]:
        """Utilized during background worker execution to pre-generate chapter summaries, takeaways, and key terms."""
        try:
            import google.generativeai as genai
            import json
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Limit text size to ~10k characters for summary prompt to avoid context overflow
            sample_text = text[:15000]
            
            prompt = (
                f"Analyze the following chapter text from the chapter '{chapter_title}'.\n"
                f"Generate a JSON response with exactly three keys:\n"
                f"1. 'summary': A comprehensive 2-3 paragraph summary of the chapter contents.\n"
                f"2. 'key_takeaways': A list of 4-6 bullet-point core lessons or arguments.\n"
                f"3. 'important_concepts': A list of key terminology/concepts introduced, each defined in 1 sentence. E.g. [{{'term': 'Concept Name', 'definition': 'Definition description'}}].\n\n"
                f"Return ONLY valid JSON. No markdown wrappers like ```json or similar.\n\n"
                f"Chapter Text:\n{sample_text}"
            )
            
            response = model.generate_content(prompt)
            clean_json_str = response.text.strip()
            
            # Basic cleaning if AI returned markdown wrappers
            if clean_json_str.startswith("```"):
                clean_json_str = re.sub(r"^```(?:json)?\n", "", clean_json_str)
                clean_json_str = re.sub(r"\n```$", "", clean_json_str)
                
            data = json.loads(clean_json_str)
            return {
                "summary": data.get("summary", ""),
                "key_takeaways": data.get("key_takeaways", []),
                "important_concepts": data.get("important_concepts", [])
            }
        except Exception as e:
            logger.error(f"Failed to generate chapter summaries via Gemini: {e}")
            # Fallback to local heuristic summaries
            sentences = text.split(". ")
            short_summary = ". ".join(sentences[:5]) + "." if len(sentences) > 5 else text
            return {
                "summary": short_summary,
                "key_takeaways": ["Please add a Gemini API key to generate automated summaries.", "Local fallback extracts the first paragraph."],
                "important_concepts": [{"term": "Setup required", "definition": "Add GEMINI_API_KEY in the configuration."}]
            }
