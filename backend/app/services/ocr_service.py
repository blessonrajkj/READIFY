import os
import fitz  # PyMuPDF
import easyocr
import tempfile
import logging
from typing import List

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self, languages: List[str] = None):
        """Initializes the EasyOCR reader.
        
        languages: list of language codes e.g. ['en', 'hi', 'ta']
        """
        # Default to English, Hindi, and Tamil as requested
        if not languages:
            languages = ['en', 'hi', 'ta']
            
        logger.info(f"Initializing EasyOCR with languages: {languages}")
        try:
            # gpu=True will auto-detect CUDA if available
            self.reader = easyocr.Reader(languages, gpu=True)
            logger.info("EasyOCR initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize EasyOCR: {e}. Falling back to CPU mode.")
            self.reader = easyocr.Reader(languages, gpu=False)

    def extract_text_from_page(self, pdf_filepath: str, page_num: int) -> str:
        """Renders a PDF page to a temporary image and runs EasyOCR on it."""
        temp_img_path = None
        try:
            doc = fitz.open(pdf_filepath)
            if page_num < 0 or page_num >= len(doc):
                raise ValueError(f"Invalid page number {page_num} for PDF of size {len(doc)}")
                
            page = doc.load_page(page_num)
            
            # Render page to high-quality image (zoom factor of 2.0 to 3.0 is recommended for OCR)
            zoom = 2.5
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            
            # Save to a temporary file
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
                temp_img_path = temp_file.name
                
            pix.save(temp_img_path)
            
            # Perform OCR
            logger.info(f"Running OCR on page {page_num}...")
            ocr_result = self.reader.readtext(temp_img_path, detail=0)
            
            # Combine lines
            extracted_text = "\n".join(ocr_result)
            return extracted_text
            
        except Exception as e:
            logger.error(f"OCR failed on page {page_num} of file {pdf_filepath}: {e}")
            return ""
        finally:
            # Clean up temp image
            if temp_img_path and os.path.exists(temp_img_path):
                try:
                    os.remove(temp_img_path)
                except Exception as e:
                    logger.warning(f"Failed to delete temp OCR image {temp_img_path}: {e}")
