import fitz  # PyMuPDF
import io
import base64
from PIL import Image

class PDFPreviewGenerator:
    def __init__(self):
        pass
    
    def generate_thumbnail(self, pdf_path, page_num=0, width=300):
        """
        Generate a thumbnail for a specific page of a PDF.
        Returns a base64 encoded PNG string.
        """
        try:
            doc = fitz.open(pdf_path)
            if page_num >= len(doc):
                page_num = 0
                
            page = doc[page_num]
            
            # Calculate zoom factor to match target width
            # Standard PDF page is approx 595 points wide (A4)
            zoom = width / page.rect.width
            matrix = fitz.Matrix(zoom, zoom)
            
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            
            # Convert to PIL Image for high-quality saving
            img_data = pix.tobytes("ppm")
            img = Image.open(io.BytesIO(img_data))
            
            # Convert to base64
            buffered = io.BytesIO()
            img.save(buffered, format="PNG", optimize=True)
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            doc.close()
            return {'success': True, 'image': f"data:image/png;base64,{img_str}"}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    # Test
    import sys
    if len(sys.argv) > 1:
        gen = PDFPreviewGenerator()
        print(gen.generate_thumbnail(sys.argv[1])['success'])
