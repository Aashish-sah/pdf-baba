
import os
import shutil
import fitz  # PyMuPDF
from pypdf import PdfReader, PdfWriter
from PIL import Image
import io

class PDFCompressor:
    def __init__(self):
        self.temp_files = []

    def _cleanup(self):
        for f in self.temp_files:
            if os.path.exists(f):
                try:
                    os.remove(f)
                except:
                    pass

    def get_file_size_kb(self, path):
        return os.path.getsize(path) / 1024

    def validate_compressed_pdf(self, pdf_path, original_page_count):
        """Validate compressed PDF is not corrupted"""
        try:
            # 1. Check if file can be opened
            if os.path.getsize(pdf_path) < 100: # Too small
                return False

            with open(pdf_path, 'rb') as f:
                header = f.read(5)
                if header != b'%PDF-':
                    return False
            
            # 2. Check page count matches (using pypdf)
            reader = PdfReader(pdf_path)
            if len(reader.pages) != original_page_count:
                return False
            
            return True
        except Exception:
            return False

    def analyze_pdf(self, pdf_path):
        """Analyze PDF content"""
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        image_count = 0
        
        for page in doc:
            image_count += len(page.get_images())
            
        doc.close()
        
        return {
            "total_pages": total_pages,
            "image_count": image_count,
            "has_images": image_count > 0
        }


    def compress_image_heavy(self, input_path, output_path, quality=75, dpi=150):
        """Compress using PyMuPDF for images - Safe Method"""
        try:
            doc = fitz.open(input_path)
            
            for page in doc:
                # Get all images on the page
                img_list = page.get_images()
                
                # Iterate in reverse order so replacements don't mess up indices if that were an issue (it's not for get_images but good practice)
                for item in img_list:
                    xref = item[0]
                    
                    try:
                        # Extract image to check size/type
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        
                        # Open with Pillow
                        pil_img = Image.open(io.BytesIO(image_bytes))
                        width, height = pil_img.size
                        
                        # Skip small images (icons, etc)
                        if width < 150 or height < 150:
                            continue

                        # Calculate target dimensions
                        # A4 @ 150 DPI ~ 1240 px width
                        target_max_dim = int((dpi / 72.0) * 1000) 
                        
                        needs_resize = width > target_max_dim or height > target_max_dim
                        
                        # If we don't need to resize and quality is already likely low, skip to avoid re-compression artifacts
                        if not needs_resize and base_image["ext"] == "jpeg":
                            continue

                        # Resize if needed
                        if needs_resize:
                            pil_img.thumbnail((target_max_dim, target_max_dim), Image.Resampling.LANCZOS)
                        
                        # Convert to RGB (standardize colorspace to avoid corruption with CMYK/transparency issues in simple JPEGs)
                        if pil_img.mode in ("RGBA", "P"):
                            pil_img = pil_img.convert("RGB")
                        
                        # Save to buffer
                        buffer = io.BytesIO()
                        pil_img.save(buffer, format="JPEG", quality=quality, optimize=True)
                        new_bytes = buffer.getvalue()
                        
                        # Only replace if we actually save space (and it's significant enough)
                        if len(new_bytes) < len(image_bytes):
                            # SAFE replacement: replace_image handles dict updates automatically
                            page.replace_image(xref, stream=new_bytes)
                            
                    except Exception as e:
                        # If a specific image fails, just skip it and move to next
                        # print(f"Warning: Failed to compress image {xref}: {e}")
                        continue

            # Save with maximum structural compression (garbage collection + deflate)
            doc.save(
                output_path,
                garbage=4,  # Level 4: extensive clean up
                deflate=True, 
                clean=True
            )
            doc.close()
            return True
            
        except Exception as e:
            if 'doc' in locals():
                doc.close()
            raise e

    def compress_pdf(self, input_path, output_path, params={}):
        """
        Smart compression pipeline
        """
        try:
            original_size_kb = self.get_file_size_kb(input_path)
            
            # Step 1: Analyze
            analysis = self.analyze_pdf(input_path)
            
            # Step 2: Determine target
            target_kb = params.get('target_size_kb')
            
            # Default logic: Aim for 50-60% of original size if no target
            if not target_kb:
                target_kb = original_size_kb * 0.5 
            else:
                target_kb = float(target_kb)

            # Safety floor
            min_safe = 50 + (analysis['total_pages'] * 20)
            target_kb = max(target_kb, min_safe)

            print(f"Compressing {input_path} (Images: {analysis['image_count']})")
            print(f"Goal: {target_kb:.0f} KB")

            # Strategy Selection
            if original_size_kb <= target_kb:
                shutil.copy2(input_path, output_path)
                return True

            # If text only, use PyPDF for structural compression
            if not analysis['has_images']:
                self.compress_text_heavy(input_path, output_path)
                return True

            # Image Heavy: Iterative Approach
            # We sort attempts from Highest Quality -> Lowest Quality.
            # We pick the FIRST one that is <= target_kb.
            # This ensures we maximize quality while meeting the size constraint.
            
            attempts = []
            
            # High Quality Tiers (try these first)
            attempts.append({"quality": 95, "dpi": 300})
            attempts.append({"quality": 90, "dpi": 200})
            
            # Medium Tiers
            attempts.append({"quality": 80, "dpi": 150})
            attempts.append({"quality": 75, "dpi": 144})
            
            # Aggressive Tiers (only if needed)
            attempts.append({"quality": 60, "dpi": 120})
            attempts.append({"quality": 50, "dpi": 96})

            # Check if we need extreme reduction (>80%), if so, maybe skip the very high quality ones to save time?
            # actually, let's keep them but maybe skip 300dpi if original size is massive?
            # For now, simplistic approach is fine, redundancy just costs CPU time.

            for i, settings in enumerate(attempts):
                temp_out = f"{output_path}_attempt_{i}.pdf"
                self.temp_files.append(temp_out)
                
                try:
                    self.compress_image_heavy(input_path, temp_out, settings['quality'], settings['dpi'])
                    
                    if not self.validate_compressed_pdf(temp_out, analysis['total_pages']):
                        continue
                        
                    new_size = self.get_file_size_kb(temp_out)
                    print(f"Attempt {i}: {new_size:.0f} KB (Strategy: Q{settings['quality']} DPI{settings['dpi']})")
                    
                    if new_size <= target_kb:
                        shutil.move(temp_out, output_path)
                        self._cleanup()
                        return True
                    
                    best_candidate = temp_out
                    
                except Exception:
                    continue

            # Fallback to best result found
            if 'best_candidate' in locals() and os.path.exists(best_candidate):
                 shutil.move(best_candidate, output_path)
            else:
                 # If all failed, use simple text compression as last resort to at least do something
                 self.compress_text_heavy(input_path, output_path)

            self._cleanup()
            return True

        except Exception as e:
            self._cleanup()
            shutil.copy2(input_path, output_path)
            raise e

# Wrapper function for main.py
def compress_pdf(input_path, output_path, level_or_params=None):
    # Convert legacy level arg to params dict if needed
    params = {}
    if isinstance(level_or_params, dict):
        params = level_or_params
    elif isinstance(level_or_params, str):
        # map "high", "medium" to something if we wanted, for now just empty
        pass
        
    compressor = PDFCompressor()
    return compressor.compress_pdf(input_path, output_path, params)
