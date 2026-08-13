import re
from typing import List, Dict, Any

class ChunkService:
    @staticmethod
    def chunk_text(text: str, max_chars: int = 1500, overlap: int = 0) -> List[Dict[str, Any]]:
        """Splits chapter text into TTS-safe chunks at paragraph/sentence boundaries."""
        if not text:
            return []
            
        chunks = []
        # Split by paragraph first
        paragraphs = text.split("\n\n")
        
        current_chunk = ""
        chunk_idx = 0
        start_char = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
                
            # If paragraph itself exceeds max_chars, we must split it by sentences
            if len(para) > max_chars:
                # If we have a current chunk, save it first
                if current_chunk:
                    chunks.append({
                        "content": current_chunk.strip(),
                        "chunk_index": chunk_idx,
                        "start_char": start_char,
                        "end_char": start_char + len(current_chunk)
                    })
                    start_char += len(current_chunk)
                    current_chunk = ""
                    chunk_idx += 1
                    
                # Split paragraph by sentences
                # Split keeping sentence delimiters (., !, ?)
                sentences = re.split(r'(?<=[.!?])\s+', para)
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                        
                    # If sentence is still larger than max_chars, split by words
                    if len(sentence) > max_chars:
                        words = sentence.split(" ")
                        temp_chunk = ""
                        for word in words:
                            if len(temp_chunk) + len(word) + 1 > max_chars:
                                chunks.append({
                                    "content": temp_chunk.strip(),
                                    "chunk_index": chunk_idx,
                                    "start_char": start_char,
                                    "end_char": start_char + len(temp_chunk)
                                })
                                start_char += len(temp_chunk)
                                temp_chunk = word + " "
                                chunk_idx += 1
                            else:
                                temp_chunk += word + " "
                        if temp_chunk:
                            current_chunk = temp_chunk
                    else:
                        # Sentence fits
                        if len(current_chunk) + len(sentence) + 1 > max_chars:
                            chunks.append({
                                "content": current_chunk.strip(),
                                "chunk_index": chunk_idx,
                                "start_char": start_char,
                                "end_char": start_char + len(current_chunk)
                            })
                            start_char += len(current_chunk)
                            current_chunk = sentence + " "
                            chunk_idx += 1
                        else:
                            current_chunk += sentence + " "
            else:
                # Paragraph fits
                # Check if adding it to current chunk exceeds limits
                if len(current_chunk) + len(para) + 2 > max_chars:
                    # Save current chunk
                    chunks.append({
                        "content": current_chunk.strip(),
                        "chunk_index": chunk_idx,
                        "start_char": start_char,
                        "end_char": start_char + len(current_chunk)
                    })
                    start_char += len(current_chunk)
                    current_chunk = para + "\n\n"
                    chunk_idx += 1
                else:
                    current_chunk += para + "\n\n"
                    
        # Add remaining text
        if current_chunk.strip():
            chunks.append({
                "content": current_chunk.strip(),
                "chunk_index": chunk_idx,
                "start_char": start_char,
                "end_char": start_char + len(current_chunk)
            })
            
        return chunks
