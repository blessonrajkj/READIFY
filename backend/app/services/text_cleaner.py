import re

class TextCleaner:
    @staticmethod
    def clean_text(text: str, book_title: str = "", author: str = "") -> str:
        """Intelligently cleans extracted PDF text for TTS synthesis."""
        if not text:
            return ""
            
        # 1. Normalize line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        
        # 2. Remove running headers/footers, book titles, and author name repeats
        # We search line by line
        lines = text.split("\n")
        cleaned_lines = []
        
        title_words = set(re.findall(r'\w+', book_title.lower())) if book_title else set()
        author_words = set(re.findall(r'\w+', author.lower())) if author else set()
        
        for line in lines:
            line_strip = line.strip()
            
            # Skip empty lines
            if not line_strip:
                cleaned_lines.append("")
                continue
                
            # Skip page numbers (lines consisting only of digits, optionally surrounded by whitespace/hyphens)
            if re.match(r'^[\s\-]*\d+[\s\-]*$', line_strip):
                continue
                
            # Skip lines matching repeated running titles / author names
            line_words = set(re.findall(r'\w+', line_strip.lower()))
            if line_words:
                # If a line contains only book title words or author words (and is short)
                if len(line_strip) < 50:
                    if (title_words and line_words.issubset(title_words)) or (author_words and line_words.issubset(author_words)):
                        continue
                        
            cleaned_lines.append(line)
            
        text = "\n".join(cleaned_lines)
        
        # 3. Join hyphenated words split across lines (e.g. "multi-\nprocessing" -> "multiprocessing")
        text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
        
        # 4. Join line-broken sentences that are not paragraphs
        # If a line ends with a word and the next line starts with a lowercase letter, join them with a space
        lines = text.split("\n")
        joined_text = ""
        for i in range(len(lines)):
            current_line = lines[i].strip()
            if not current_line:
                joined_text += "\n\n"
                continue
                
            if joined_text and not joined_text.endswith("\n\n"):
                # Check if we should join with a space
                # If current line starts with lowercase and previous line didn't end with sentence-ending punctuation
                prev_char = joined_text[-1]
                if current_line[0].islower() and prev_char not in {'.', '!', '?', ':'}:
                    joined_text += " " + current_line
                else:
                    # Keep newlines for structural breathing
                    joined_text += "\n" + current_line
            else:
                joined_text += current_line
                
        text = joined_text
        
        # 5. Clean up excessive whitespaces
        # Convert multiple spaces to a single space
        text = re.sub(r'[ \t]+', ' ', text)
        # Convert multiple newlines (greater than 2) to double newlines (paragraphs)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # 6. Remove OCR artifacts / garbage characters
        # But preserve quotes, dialogue markers (- / em-dash), and normal punctuation
        # (e.g. prevent stripping of quotes like "" or '')
        text = re.sub(r'[^\w\s\d.,!?;:\'"\-\(\)“”‘’\u0b80-\u0bff\u0900-\u097f]', '', text)
        
        return text.strip()
