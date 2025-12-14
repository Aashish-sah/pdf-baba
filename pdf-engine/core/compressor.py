
import fitz  # PyMuPDF
from PIL import Image
import io
import os
import shutil
import tempfile

class PDFCompressor:
    def __init__(self, debug=False):
        self.debug = debug
        self.temp_dir = tempfile.mkdtemp(prefix="pdf_simple_")

    def compress(self, input_path, output_path, target_size_kb=None, quality='medium', analysis=None):
        """
        SIMPLE LOGIC:
        - Goal: Compress to 50% of original size (or user target).
        - Method: Try decreasing quality until goal is met.
        - Fix: Start with VERY high quality to avoid over-compression.
        """
        try:
            original_size_kb = os.path.getsize(input_path) / 1024
            
            # --- 1. DETERMINE GOAL (Strict 50%) ---
            if target_size_kb is not None and target_size_kb > 0:
                # User specified size
                target = float(target_size_kb)
            else:
                # Default: Exactly half size
                target = original_size_kb * 0.5 

            # Minimum floor
            if target < 50: target = 50

            # Shortcut
            if original_size_kb <= target:
                 shutil.copy2(input_path, output_path)
                 return {'success': True, 'compressed_size_kb': original_size_kb}

            # --- 2. LOOP UNTIL DONE ---
            # Descent: Lossless-ish -> High -> Medium -> Low
            steps = [
                {'q': 95, 'dpi': 300, 'name': 'Best'},     # Very gentle (New Tier)
                {'q': 85, 'dpi': 200, 'name': 'High'},     # Gentle
                {'q': 75, 'dpi': 150, 'name': 'Medium'},   # Standard
                {'q': 60, 'dpi': 120, 'name': 'Strong'},   # Strong
                {'q': 45, 'dpi': 90,  'name': 'Aggressive'},
            ]

            best_file = None
            best_difference = float('inf') # Find closest to target without going over? 
            # Actually, we just want the *First* one that is <= target.
            # Because the list is ordered by Quality (Desc), the first success is the Best Quality Success.

            for step in steps:
                temp_out = os.path.join(self.temp_dir, f"temp_{step['name']}.pdf")
                
                # Run safe compression
                self._process(input_path, temp_out, step['q'], step['dpi'])
                
                if os.path.exists(temp_out):
                    current_size = os.path.getsize(temp_out) / 1024
                    
                    # Track result
                    # Stop if goal met
                    if current_size <= target:
                        shutil.copy2(temp_out, output_path)
                        return {'success': True, 'compressed_size_kb': current_size}
                    
                    # If we haven't met target yet, keep this result as a fallback (it's the smallest so far)
                    # Wait, no. The LOOP goes from High Size -> Low Size.
                    # So the LAST result will be the smallest. 
                    best_file = temp_out
                    best_size = current_size

            # If we tried everything and failed to hit 50%, return the smallest (last) one
            if best_file:
                shutil.copy2(best_file, output_path)
                return {'success': True, 'compressed_size_kb': best_size}

            # Default
            shutil.copy2(input_path, output_path)
            return {'success': True, 'compressed_size_kb': original_size_kb}

        except Exception as e:
            return {'success': False, 'error': str(e)}

    def _process(self, input_p, output_p, q, dpi):
        """Safe image resizing/compression"""
        try:
            doc = fitz.open(input_p)
            for page in doc:
                for img in page.get_images():
                    xref = img[0]
                    if img[1] > 0: continue
                    try:
                        base = doc.extract_image(xref)
                        pil_img = Image.open(io.BytesIO(base["image"]))
                        if pil_img.mode in ['P', 'RGBA', 'CMYK']: pil_img = pil_img.convert('RGB')
                        
                        max_d = int((dpi / 72.0) * 800)
                        w, h = pil_img.size
                        
                        buf = io.BytesIO()
                        # Resize if needed
                        if w > max_d or h > max_d:
                            pil_img.thumbnail((max_d, max_d), Image.Resampling.LANCZOS)
                        
                        pil_img.save(buf, "JPEG", quality=q, optimize=True)
                        new_bytes = buf.getvalue()
                        
                        # Apply change
                        # Note: In aggressive mode we might replace even if larger? 
                        # No, always keep smaller to ensure monotonic decrease if possible. 
                        # EXCEPT if we really resized it down, then we trust the resize.
                        if len(new_bytes) < len(base["image"]) or (w > max_d):
                            page.replace_image(xref, stream=new_bytes)
                    except: pass
            doc.save(output_p, garbage=4, deflate=True, clean=True)
            doc.close()
        except: pass
