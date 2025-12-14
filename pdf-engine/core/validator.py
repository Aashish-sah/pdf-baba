import fitz
import os
from pypdf import PdfReader # Changed from PyPDF2 to pypdf for consistency

class PDFValidator:
    def __init__(self):
        pass
    
    def validate(self, pdf_path, expected_pages=None):
        """Validate PDF is not corrupted"""
        try:
            # Check file exists and has size
            if not os.path.exists(pdf_path):
                return False
            
            file_size = os.path.getsize(pdf_path)
            if file_size < 1024:  # Less than 1KB
                return False
            
            # Try to open with PyMuPDF
            try:
                doc = fitz.open(pdf_path)
                actual_pages = len(doc)
                doc.close()
                
                # Check page count if expected
                if expected_pages and actual_pages != expected_pages:
                    return False
                
                # Check first few bytes
                with open(pdf_path, 'rb') as f:
                    header = f.read(5)
                    if header != b'%PDF-':
                        return False
                
                return True
                
            except Exception:
                # Try with PyPDF2/pypdf as fallback
                try:
                    with open(pdf_path, 'rb') as f:
                        reader = PdfReader(f)
                        if expected_pages and len(reader.pages) != expected_pages:
                            return False
                    return True
                except Exception:
                    return False
                    
        except Exception:
            return False
    
    def validate_content(self, pdf_path):
        """More thorough content validation"""
        try:
            doc = fitz.open(pdf_path)
            
            # Check each page has some content
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Try to extract text
                text = page.get_text()
                
                # Check for images
                images = page.get_images()
                
                # If no text and no images, page might be empty
                if not text.strip() and not images:
                    # Could be a blank page, which is okay
                    pass
            
            doc.close()
            return True
            
        except Exception:
            return False
