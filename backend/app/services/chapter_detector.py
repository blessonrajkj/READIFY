import re
from typing import List, Dict, Any

class ChapterDetector:
    # Common chapter titles patterns
    CHAPTER_PATTERNS = [
        r'^(?:(?:chapter|section|part|unit|book|division)\s+(?:[0-9]+|[ivxldm]+|\w+)(?::|\s+\-|\s*\n|$))',
        r'^(?:(?:introduction|preface|foreword|prologue|epilogue|conclusion|afterword|appendix)(?::|\s+\-|\s*\n|$))',
    ]

    @staticmethod
    def detect_chapters(pages_text: List[str]) -> List[Dict[str, Any]]:
        """Scans page texts to detect chapter markings, returns list of candidate chapters.
        
        Format: [{'title': 'Chapter 1: ...', 'start_page': 0, 'end_page': 10, 'order_index': 0}]
        """
        candidates = []
        patterns = [re.compile(p, re.IGNORECASE) for p in ChapterDetector.CHAPTER_PATTERNS]
        
        for page_idx, page_text in enumerate(pages_text):
            lines = page_text.split("\n")
            page_candidates = []
            for line in lines:
                line_strip = line.strip()
                # A valid chapter heading line is short (under 80 chars) and matches chapter patterns
                if 3 < len(line_strip) < 80:
                    matched = False
                    for pattern in patterns:
                        if pattern.match(line_strip):
                            matched = True
                            break
                            
                    if matched:
                        title = line_strip
                        # Avoid adding duplicates
                        if not any(c["title"].lower() == title.lower() for c in candidates):
                            page_candidates.append({
                                "title": title,
                                "start_page": page_idx,
                                "end_page": page_idx, # Will adjust below
                                "order_index": 0
                            })
            
            # If a single page matches more than 2 chapters, it's a Table of Contents / Index page.
            # Discard to let chapters be detected on their actual content pages later.
            if len(page_candidates) <= 2:
                for pc in page_candidates:
                    pc["order_index"] = len(candidates)
                    candidates.append(pc)
                            
        # Post-process: adjust end pages
        if candidates:
            for i in range(len(candidates) - 1):
                candidates[i]["end_page"] = candidates[i+1]["start_page"] - 1
            candidates[-1]["end_page"] = len(pages_text) - 1
            
        # Fallback: If no chapters detected, chunk the book into groups of 10 pages
        if not candidates:
            pages_per_chapter = 10
            total_pages = len(pages_text)
            chapter_count = (total_pages + pages_per_chapter - 1) // pages_per_chapter
            
            for idx in range(chapter_count):
                start = idx * pages_per_chapter
                end = min(total_pages - 1, start + pages_per_chapter - 1)
                candidates.append({
                    "title": f"Section {idx + 1} (Pages {start + 1}-{end + 1})",
                    "start_page": start,
                    "end_page": end,
                    "order_index": idx
                })
                
        return candidates
