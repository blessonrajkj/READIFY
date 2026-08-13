import pytest
import os
from app.services.text_cleaner import TextCleaner
from app.services.chapter_detector import ChapterDetector
from app.services.chunk_service import ChunkService
from app.services.tts_service import get_tts_provider, EdgeTTSProvider

def test_text_cleaning():
    raw_text = "Atomic Habits\nJames Clear\n- 12 -\nThis is a test- \nbreak sentence.  \n\n\nAnother paragraph  with   extra spaces."
    cleaned = TextCleaner.clean_text(raw_text, "Atomic Habits", "James Clear")
    
    assert "Atomic Habits" not in cleaned
    assert "- 12 -" not in cleaned
    assert "test- \nbreak" not in cleaned
    assert "testbreak" in cleaned
    assert "extra spaces" in cleaned
    # Ensure double spacing is collapsed
    assert "  " not in cleaned

def test_chapter_detection_heuristics():
    pages = [
        "Title Page\nBy Blesson Raj",
        "Introduction\nThis is the preface of the book.",
        "Chapter 1\nThe First Concept\nContent about the start of atomic habits.",
        "Chapter 2: The Core Laws\nAtomic laws and rules.",
        "Epilogue\nWrap up of the book."
    ]
    
    chapters = ChapterDetector.detect_chapters(pages)
    
    assert len(chapters) >= 4
    # Check if introduction detected
    intro = [c for c in chapters if "introduction" in c["title"].lower()]
    assert len(intro) > 0
    
    # Check if chapter 1 detected
    ch1 = [c for c in chapters if "chapter 1" in c["title"].lower()]
    assert len(ch1) > 0

def test_text_chunking():
    # Large text block
    text = ". ".join([f"This is sentence index {i}" for i in range(100)])
    chunks = ChunkService.chunk_text(text, max_chars=300)
    
    assert len(chunks) > 1
    # Verify indexes and character ranges are sequential and non-overlapping
    last_end = 0
    for idx, chunk in enumerate(chunks):
        assert chunk["chunk_index"] == idx
        assert chunk["start_char"] >= last_end
        assert len(chunk["content"]) <= 300
        last_end = chunk["end_char"]

def test_tts_provider_factory():
    provider = get_tts_provider()
    assert isinstance(provider, EdgeTTSProvider)
    
    voices = provider.get_available_voices("en-US")
    assert len(voices) > 0
    assert any(v["id"] == "en-US-AriaNeural" for v in voices)
    
    voices_ta = provider.get_available_voices("ta-IN")
    assert len(voices_ta) > 0
    assert any(v["id"] == "ta-IN-ValluvarNeural" for v in voices_ta)
