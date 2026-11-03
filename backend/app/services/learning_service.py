import re
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database_models import (
    Book, Chapter, TextChunk, Quiz, QuizQuestion, QuizAttempt, 
    Flashcard, StudyNote, LearningAnalytics
)

logger = logging.getLogger(__name__)

class LearningService:
    def __init__(self, db: Session, book_id: str):
        self.db = db
        self.book_id = book_id
        self.api_key = settings.GEMINI_API_KEY
        self.has_api_key = bool(self.api_key)
        self._init_gemini()

    def _init_gemini(self):
        if self.has_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.genai = genai
            except Exception as e:
                logger.error(f"Failed to configure Gemini for LearningService: {e}")
                self.has_api_key = False

    def _get_chapter_text(self, chapter_id: Optional[str] = None) -> str:
        """Retrieves and combines text chunks for a chapter or the entire book."""
        query = self.db.query(TextChunk).filter(TextChunk.book_id == self.book_id)
        if chapter_id:
            query = query.filter(TextChunk.chapter_id == chapter_id)
        chunks = query.order_by(TextChunk.chunk_index.asc()).all()
        if not chunks:
            return ""
        return "\n\n".join([c.content for c in chunks])

    def _get_chapter_pages(self, chapter_id: Optional[str] = None) -> List[int]:
        """Gets page numbers for the target content."""
        query = self.db.query(TextChunk).filter(TextChunk.book_id == self.book_id)
        if chapter_id:
            query = query.filter(TextChunk.chapter_id == chapter_id)
        chunks = query.all()
        pages = [c.page_number for c in chunks if c.page_number is not None]
        return sorted(list(set(pages))) if pages else [1]

    # =========================================================================
    # FLASHCARD GENERATION
    # =========================================================================

    def generate_flashcards(self, chapter_id: Optional[str] = None, count: int = 8) -> List[Flashcard]:
        """Generates conceptual and terminology flashcards for the selected chapter/book."""
        text = self._get_chapter_text(chapter_id)
        if not text:
            raise ValueError("No text content found to generate flashcards.")

        chapter = None
        chapter_title = "General"
        if chapter_id:
            chapter = self.db.query(Chapter).filter(Chapter.id == chapter_id).first()
            if chapter:
                chapter_title = chapter.title

        pages = self._get_chapter_pages(chapter_id)
        primary_page = pages[0] if pages else 1

        flashcards_data = []

        if self.has_api_key:
            try:
                model = self.genai.GenerativeModel('gemini-2.5-flash')
                sample_text = text[:18000]
                prompt = (
                    f"You are an expert educator. Generate {count} high-yield study flashcards based on the following text from '{chapter_title}'.\n"
                    f"Create a mix of:\n"
                    f"- Key terminology and definitions\n"
                    f"- Core concept explanations\n"
                    f"- High-impact questions and answers\n\n"
                    f"Return ONLY valid JSON as a list of objects with these keys:\n"
                    f"- 'front': The question, term, or prompt.\n"
                    f"- 'back': The clear, memorable explanation or definition (2-3 sentences max).\n"
                    f"- 'category': One of ['Terminology', 'Concept', 'Formula', 'Question'].\n"
                    f"- 'difficulty': One of ['easy', 'medium', 'hard'].\n\n"
                    f"Text:\n{sample_text}"
                )
                res = model.generate_content(prompt)
                clean_json = res.text.strip()
                if clean_json.startswith("```"):
                    clean_json = re.sub(r"^```(?:json)?\n", "", clean_json)
                    clean_json = re.sub(r"\n```$", "", clean_json)
                flashcards_data = json.loads(clean_json)
            except Exception as e:
                logger.error(f"Gemini flashcard generation failed: {e}. Falling back to heuristics.")
                flashcards_data = self._generate_flashcards_heuristic(text, count)
        else:
            flashcards_data = self._generate_flashcards_heuristic(text, count)

        # Save generated flashcards to database
        saved_cards = []
        for item in flashcards_data:
            card = Flashcard(
                book_id=self.book_id,
                chapter_id=chapter_id,
                front=item.get("front", "Key Concept"),
                back=item.get("back", "Concept definition and explanation."),
                category=item.get("category", "Concept"),
                difficulty=item.get("difficulty", "medium"),
                source_page=primary_page
            )
            self.db.add(card)
            saved_cards.append(card)

        self.db.commit()
        for c in saved_cards:
            self.db.refresh(c)
        return saved_cards

    def _generate_flashcards_heuristic(self, text: str, count: int) -> List[Dict[str, Any]]:
        """Offline heuristic flashcard extractor based on definitions and paragraph headers."""
        paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 60]
        results = []
        for p in paragraphs[:count]:
            sentences = [s.strip() for s in p.split(". ") if len(s.strip()) > 15]
            if not sentences:
                continue
            first_sentence = sentences[0]
            # Try to identify term or use first sentence as question
            if ":" in first_sentence:
                parts = first_sentence.split(":", 1)
                results.append({
                    "front": f"What is {parts[0].strip()}?",
                    "back": parts[1].strip() + (" " + sentences[1] if len(sentences) > 1 else ""),
                    "category": "Terminology",
                    "difficulty": "medium"
                })
            else:
                words = first_sentence.split()
                concept_name = " ".join(words[:4])
                results.append({
                    "front": f"Explain the core concept: {concept_name}...",
                    "back": p[:280] + ("..." if len(p) > 280 else ""),
                    "category": "Concept",
                    "difficulty": "easy"
                })
            if len(results) >= count:
                break
        return results

    # =========================================================================
    # QUIZ & MCQ GENERATION
    # =========================================================================

    def generate_quiz(self, chapter_id: Optional[str] = None, difficulty: str = "medium", question_count: int = 5) -> Quiz:
        """Generates an assessment quiz with multiple choice questions, explanations, and citations."""
        text = self._get_chapter_text(chapter_id)
        if not text:
            raise ValueError("No text content found to generate quiz.")

        chapter_title = "Complete Book"
        chapter = None
        if chapter_id:
            chapter = self.db.query(Chapter).filter(Chapter.id == chapter_id).first()
            if chapter:
                chapter_title = chapter.title

        pages = self._get_chapter_pages(chapter_id)
        ref_page = f"Page {pages[0]}" if pages else "Section Overview"

        quiz_title = f"{chapter_title} — Mastery Assessment"
        quiz_desc = f"Comprehensive {difficulty.capitalize()} test covering core concepts, arguments, and terminology from {chapter_title}."

        questions_data = []

        if self.has_api_key:
            try:
                model = self.genai.GenerativeModel('gemini-2.5-flash')
                sample_text = text[:18000]
                prompt = (
                    f"You are an elite academic examiner. Create a {question_count}-question multiple choice test based on the text from '{chapter_title}'.\n"
                    f"Target difficulty: {difficulty}.\n"
                    f"Requirements:\n"
                    f"- Exactly 4 plausible options per question.\n"
                    f"- Exactly 1 clear, unambiguous correct answer.\n"
                    f"- Detailed explanation of why the correct option is right and others are incorrect.\n"
                    f"- Ground every question in the provided text.\n\n"
                    f"Return ONLY valid JSON as a list of objects with keys:\n"
                    f"- 'question': Question string.\n"
                    f"- 'options': List of exactly 4 strings.\n"
                    f"- 'correct_option_index': Integer 0 to 3 pointing to the correct choice.\n"
                    f"- 'explanation': In-depth pedagogical explanation.\n"
                    f"- 'source_reference': Citation string (e.g. '{chapter_title}, {ref_page}').\n\n"
                    f"Text:\n{sample_text}"
                )
                res = model.generate_content(prompt)
                clean_json = res.text.strip()
                if clean_json.startswith("```"):
                    clean_json = re.sub(r"^```(?:json)?\n", "", clean_json)
                    clean_json = re.sub(r"\n```$", "", clean_json)
                questions_data = json.loads(clean_json)
            except Exception as e:
                logger.error(f"Gemini quiz generation failed: {e}. Falling back to heuristics.")
                questions_data = self._generate_quiz_heuristic(text, chapter_title, ref_page, question_count)
        else:
            questions_data = self._generate_quiz_heuristic(text, chapter_title, ref_page, question_count)

        # Create Quiz model
        db_quiz = Quiz(
            book_id=self.book_id,
            chapter_id=chapter_id,
            title=quiz_title,
            description=quiz_desc,
            difficulty=difficulty,
            time_limit_seconds=max(120, question_count * 60),
            total_questions=len(questions_data)
        )
        self.db.add(db_quiz)
        self.db.flush()

        for idx, q in enumerate(questions_data):
            db_question = QuizQuestion(
                quiz_id=db_quiz.id,
                question=q.get("question", f"Question {idx+1}"),
                options=q.get("options", ["Option A", "Option B", "Option C", "Option D"]),
                correct_option_index=int(q.get("correct_option_index", 0)),
                explanation=q.get("explanation", "The correct answer follows directly from the chapter context."),
                source_reference=q.get("source_reference", f"{chapter_title}, {ref_page}"),
                difficulty=difficulty,
                order_index=idx
            )
            self.db.add(db_question)

        self.db.commit()
        self.db.refresh(db_quiz)
        return db_quiz

    def _generate_quiz_heuristic(self, text: str, chapter_title: str, ref_page: str, count: int) -> List[Dict[str, Any]]:
        """Offline fallback quiz generator."""
        paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 80]
        questions = []
        for idx, p in enumerate(paragraphs[:count]):
            sentences = [s.strip() for s in p.split(". ") if len(s.strip()) > 20]
            if len(sentences) < 2:
                continue
            premise = sentences[0]
            conclusion = sentences[1]
            questions.append({
                "question": f"Regarding '{premise[:90]}...', which of the following is true according to the passage?",
                "options": [
                    conclusion[:100],
                    f"It contradicts the general premises outlined in {chapter_title}.",
                    "It has no measurable influence on the primary conclusions.",
                    "The text explicitly advises against this assertion."
                ],
                "correct_option_index": 0,
                "explanation": f"The text specifies that '{conclusion[:140]}'.",
                "source_reference": f"{chapter_title}, {ref_page}"
            })
            if len(questions) >= count:
                break
        return questions

    # =========================================================================
    # QUIZ EVALUATION & GRADING
    # =========================================================================

    def submit_quiz_attempt(self, quiz_id: str, answers: Dict[str, int], duration_seconds: int, user_id: Optional[int] = None) -> QuizAttempt:
        """Grades a quiz attempt, computes accuracy score, detects weak areas, and updates analytics."""
        quiz = self.db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.book_id == self.book_id).first()
        if not quiz:
            raise ValueError("Quiz not found.")

        questions = self.db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.order_index.asc()).all()
        if not questions:
            raise ValueError("Quiz has no questions.")

        score = 0
        weak_topics = []

        for q in questions:
            user_choice = answers.get(q.id)
            if user_choice is not None and user_choice == q.correct_option_index:
                score += 1
            else:
                # Add topic / question title to weak topics
                snippet = q.question[:60] + "..." if len(q.question) > 60 else q.question
                weak_topics.append(snippet)

        percentage = round((score / len(questions)) * 100, 1)

        attempt = QuizAttempt(
            quiz_id=quiz.id,
            book_id=self.book_id,
            user_id=user_id,
            score=score,
            total_questions=len(questions),
            percentage=percentage,
            answers=answers,
            weak_topics=weak_topics,
            duration_seconds=duration_seconds
        )
        self.db.add(attempt)

        # Update Analytics
        self._record_quiz_analytics(score, len(questions), percentage, weak_topics, user_id)

        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def _record_quiz_analytics(self, score: int, total_q: int, percentage: float, weak_topics: List[str], user_id: Optional[int]):
        """Updates overall learning analytics records."""
        analytics = self.db.query(LearningAnalytics).filter(
            LearningAnalytics.book_id == self.book_id
        ).first()

        if not analytics:
            analytics = LearningAnalytics(
                book_id=self.book_id,
                user_id=user_id,
                quizzes_taken=1,
                avg_quiz_score=percentage,
                weak_topics=weak_topics[:8],
                last_active_date=datetime.utcnow()
            )
            self.db.add(analytics)
        else:
            prev_total = analytics.quizzes_taken
            new_avg = round(((analytics.avg_quiz_score * prev_total) + percentage) / (prev_total + 1), 1)
            analytics.quizzes_taken += 1
            analytics.avg_quiz_score = new_avg
            # Merge weak topics
            existing_weak = analytics.weak_topics or []
            merged_weak = list(dict.fromkeys(existing_weak + weak_topics))[:10]
            analytics.weak_topics = merged_weak
            analytics.last_active_date = datetime.utcnow()
            self.db.add(analytics)

    # =========================================================================
    # STUDY NOTES & CHAPTER REVISION SUMMARY
    # =========================================================================

    def generate_study_notes(self, chapter_id: Optional[str] = None) -> StudyNote:
        """Generates comprehensive, formatted revision study notes for a chapter."""
        text = self._get_chapter_text(chapter_id)
        if not text:
            raise ValueError("No text content found to generate study notes.")

        chapter_title = "Core Document"
        chapter = None
        if chapter_id:
            chapter = self.db.query(Chapter).filter(Chapter.id == chapter_id).first()
            if chapter:
                chapter_title = chapter.title

        note_title = f"{chapter_title} — Executive Study Notes"
        content_md = ""

        if self.has_api_key:
            try:
                model = self.genai.GenerativeModel('gemini-2.5-flash')
                sample_text = text[:18000]
                prompt = (
                    f"You are a master academic researcher and educator. Create comprehensive, structured study and revision notes for '{chapter_title}'.\n"
                    f"Format the output in clean, readable Markdown with:\n"
                    f"## 1. Executive Summary\n"
                    f"## 2. Key Concepts & Terminology (with bold terms and definitions)\n"
                    f"## 3. Core Arguments & Frameworks\n"
                    f"## 4. Notable Examples & Applications\n"
                    f"## 5. Critical Revision Checklist (5-6 quick bullet points)\n\n"
                    f"Text:\n{sample_text}"
                )
                res = model.generate_content(prompt)
                content_md = res.text.strip()
            except Exception as e:
                logger.error(f"Gemini study notes generation failed: {e}. Using fallback format.")
                content_md = self._generate_notes_heuristic(text, chapter_title)
        else:
            content_md = self._generate_notes_heuristic(text, chapter_title)

        note = StudyNote(
            book_id=self.book_id,
            chapter_id=chapter_id,
            title=note_title,
            content=content_md,
            tags=["AI Generated", "Revision", chapter_title]
        )
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        return note

    def _generate_notes_heuristic(self, text: str, chapter_title: str) -> str:
        paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 60]
        summary_intro = paragraphs[0] if paragraphs else "No introduction available."
        bullet_points = "\n".join([f"- **Key Point {i+1}:** {p[:180]}..." for i, p in enumerate(paragraphs[1:6])])

        return (
            f"## 1. Executive Summary\n{summary_intro}\n\n"
            f"## 2. Core Takeaways & Arguments\n{bullet_points}\n\n"
            f"## 3. Revision Checklist\n"
            f"- Review the chapter vocabulary and foundational terms.\n"
            f"- Verify understanding of the chapter's core thesis.\n"
            f"- Complete practice tests to reinforce retention.\n"
        )
