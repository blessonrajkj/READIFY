import os
import fitz  # PyMuPDF
from typing import List, Dict, Any, Tuple, Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class PDFService:
    @staticmethod
    def extract_text_and_metadata(filepath: str) -> Dict[str, Any]:
        """Extracts text page-by-page, metadata, and checks if OCR is needed. Supports PDF and TXT."""
        ext = os.path.splitext(filepath)[1].lower()
        
        # Support for plain text files
        if ext == ".txt":
            try:
                with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                    full_text = f.read()
                
                # Split into pseudo-pages (~2500 chars per page, roughly 400 words)
                page_size = 2500
                pages_text = []
                for i in range(0, len(full_text), page_size):
                    chunk = full_text[i:i+page_size]
                    if chunk.strip():
                        pages_text.append(chunk)
                
                if not pages_text:
                    pages_text = [""]
                    
                filename_base = os.path.splitext(os.path.basename(filepath))[0]
                return {
                    "title": filename_base.replace("_", " ").title(),
                    "author": "Document Author",
                    "total_pages": len(pages_text),
                    "needs_ocr": False,
                    "pages": pages_text
                }
            except Exception as e:
                logger.error(f"Error reading TXT '{filepath}': {e}")
                raise RuntimeError(f"Failed to read TXT file: {e}")

        # PDF processing
        try:
            doc = fitz.open(filepath)
            total_pages = len(doc)
            
            # Extract metadata
            metadata = doc.metadata or {}
            title = metadata.get("title") or os.path.splitext(os.path.basename(filepath))[0]
            author = metadata.get("author") or "Unknown Author"
            
            pages_text: List[str] = []
            total_char_count = 0
            
            for page_num in range(total_pages):
                page = doc.load_page(page_num)
                text = page.get_text()
                pages_text.append(text)
                total_char_count += len(text.strip())
                
            # Heuristic: If average characters per page is less than 50, it is likely scanned/image-based
            avg_chars = total_char_count / total_pages if total_pages > 0 else 0
            needs_ocr = avg_chars < 50
            
            logger.info(f"PDF Analysis: Title='{title}', Pages={total_pages}, Avg Chars/Page={avg_chars:.1f}, Needs OCR={needs_ocr}")
            
            return {
                "title": title,
                "author": author,
                "total_pages": total_pages,
                "needs_ocr": needs_ocr,
                "pages": pages_text
            }
        except Exception as e:
            logger.error(f"Error reading PDF '{filepath}': {e}")
            raise RuntimeError(f"Failed to read PDF file: {e}")

    @staticmethod
    def extract_cover_image(pdf_filepath: str, cover_filename: str) -> Optional[str]:
        """Renders the first page of the PDF as a JPEG cover image and returns its storage path."""
        try:
            doc = fitz.open(pdf_filepath)
            if len(doc) == 0:
                return None
                
            page = doc.load_page(0)
            
            # Render page to a pixmap (image)
            # Use zoom=2.0 for higher quality
            zoom = 2.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            
            cover_dir = settings.COVER_DIR
            os.makedirs(cover_dir, exist_ok=True)
            cover_path = os.path.join(cover_dir, cover_filename)
            
            pix.save(cover_path)
            logger.info(f"Cover page successfully rendered to {cover_path}")
            return cover_path
        except Exception as e:
            logger.error(f"Failed to extract cover image from {pdf_filepath}: {e}")
            return None
