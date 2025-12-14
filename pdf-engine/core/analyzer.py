import fitz  # PyMuPDF
import os
from PIL import Image
import io

class PDFAnalyzer:
    def __init__(self):
        pass
    
    def analyze(self, pdf_path):
        """Analyze PDF content and structure"""
        doc = fitz.open(pdf_path)
        
        total_pages = len(doc)
        total_images = 0
        text_ratio = 0
        image_sizes = []
        is_scanned = True
        
        for page_num in range(total_pages):
            page = doc[page_num]
            
            # Extract text
            text = page.get_text()
            if text.strip():
                is_scanned = False
            
            # Get images
            images = page.get_images()
            total_images += len(images)
            
            for img in images:
                xref = img[0]
                try:
                    base_image = doc.extract_image(xref)
                    if base_image:
                        image_bytes = base_image.get("image")
                        if image_bytes:
                            image_sizes.append(len(image_bytes))
                except:
                    continue
        
        doc.close()
        
        # Calculate text ratio
        text_char_count = len(text) if 'text' in locals() else 0
        total_chars_estimate = total_pages * 2000  # Rough estimate
        
        if total_chars_estimate > 0:
            text_ratio = text_char_count / total_chars_estimate
        
        # Calculate estimated minimum size
        min_size_kb = self._calculate_minimum_size(
            total_pages, total_images, image_sizes, is_scanned
        )
        
        return {
            "pages": total_pages,
            "images": total_images,
            "image_sizes_kb": [size/1024 for size in image_sizes],
            "total_image_size_kb": sum(image_sizes)/1024 if image_sizes else 0,
            "is_scanned": is_scanned,
            "text_ratio": text_ratio,
            "estimated_min_size_kb": min_size_kb,
            "file_size_kb": os.path.getsize(pdf_path) / 1024
        }
    
    def _calculate_minimum_size(self, pages, images, image_sizes, is_scanned):
        """Calculate minimum safe size for this PDF"""
        # Base PDF structure
        min_size = 50  # KB
        
        # Add for pages
        min_size += pages * 10
        
        # Add for images
        if images > 0:
            if image_sizes:
                # Calculate current average image size
                avg_image_size = sum(image_sizes) / len(image_sizes) / 1024  # KB
                # Minimum reasonable image size (compressed JPEG)
                min_image_size = max(avg_image_size * 0.1, 20)  # 10% of original or 20KB
                min_size += images * min_image_size
            else:
                min_size += images * 50  # 50KB per image if unknown
        
        # If scanned PDF (all images), be more conservative
        if is_scanned:
            min_size *= 1.5
        
        # Add safety margin
        min_size *= 1.2
        
        return min(min_size, 10240)  # Cap at 10MB
