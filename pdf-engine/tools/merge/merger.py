import os
import fitz  # PyMuPDF
from typing import List, Dict

class AdvancedPDFMerger:
    def __init__(self, debug=False):
        self.debug = debug
        
        # Standard sizes in points (72 dpi)
        self.PAGE_SIZES = {
            'a4': (595.0, 842.0),
            'letter': (612.0, 792.0)
        }

    def merge_with_properties(self, 
                            file_paths: List[str], 
                            output_path: str,
                            order: List[int] = None,
                            properties: Dict = None) -> dict:
        try:
            if not properties:
                properties = {}

            # 1. Arrange files
            if order and len(order) == len(file_paths):
                ordered_paths = [file_paths[i] for i in order]
            else:
                ordered_paths = file_paths

            # 2. Check if Normalization is needed
            normalize = properties.get('normalize', False)
            target_size = None
            
            if normalize:
                size_name = properties.get('paperSize', 'a4').lower()
                base_size = self.PAGE_SIZES.get(size_name, self.PAGE_SIZES['a4'])
                orientation = properties.get('orientation', 'portrait')
                if orientation == 'landscape':
                    target_size = (base_size[1], base_size[0])
                else:
                    target_size = base_size

            # 3. Build Document
            # If normalizing, we create blank pages and draw on them.
            # If NOT normalizing, we just append pages.
            
            output_doc = fitz.open()
            toc = []
            current_page_count = 0

            for path in ordered_paths:
                src_doc = fitz.open(path)
                file_name = os.path.basename(path).replace('.pdf', '')
                
                # TOC Entry
                if properties.get('toc'):
                    toc.append([1, file_name, current_page_count + 1])

                if normalize and target_size:
                    # Normalized Merge
                    width, height = target_size
                    
                    for page in src_doc:
                        # Create new blank page
                        new_page = output_doc.new_page(width=width, height=height)
                        
                        # Calculate fitting rectangle
                        src_rect = page.rect
                        scale = min(width / src_rect.width, height / src_rect.height)
                        
                        # Center the content
                        disp_width = src_rect.width * scale
                        disp_height = src_rect.height * scale
                        
                        x = (width - disp_width) / 2
                        y = (height - disp_height) / 2
                        
                        target_rect = fitz.Rect(x, y, x + disp_width, y + disp_height)
                        
                        new_page.show_pdf_page(target_rect, src_doc, page.number)
                        current_page_count += 1
                        
                else:
                    # Standard Merge (Fast)
                    output_doc.insert_pdf(src_doc)
                    current_page_count += len(src_doc)
                
                src_doc.close()

                # Add Blank Page if requested (and not the last file)
                if properties.get('blankPage') and path != ordered_paths[-1]:
                    # Create a blank page matching the last page's size if possible, or A4
                    # For standard merge, we just add a new page at the end of output_doc
                    if current_page_count > 0:
                        last_page = output_doc[-1]
                        output_doc.new_page(width=last_page.rect.width, height=last_page.rect.height)
                    else:
                        output_doc.new_page() # Default A4
                    current_page_count += 1

            # 4. Post-Process (Page Numbers, TOC)
            
            if properties.get('pageNumbers'):
                self._add_page_numbers(output_doc)
            
            # TOC REMOVED as per user request (logic kept if properties passed for compatibility, but UI will hide it)
            # Actually user asked to REMOVE option, backend can still support it if passed, 
            # but let's leave it as is or clean it up? 
            # I will leave the TOC logic in backend in case they want it back later, it does no harm if frontend sends false.
            if properties.get('toc') and toc:
                output_doc.set_toc(toc)

            output_doc.save(output_path, garbage=4, deflate=True)
            output_doc.close()

            output_size = os.path.getsize(output_path) / 1024
            return {
                'success': True,
                'files_merged': len(ordered_paths),
                'total_pages': current_page_count,
                'output_size_kb': round(output_size, 2)
            }

        except Exception as e:
            if self.debug:
                print(f"Merge Error: {e}")
            return {'success': False, 'error': str(e)}

    def _add_page_numbers(self, doc):
        total = len(doc)
        for i, page in enumerate(doc):
            text = f"Page {i+1} of {total}"
            rect = page.rect
            # Center text at bottom
            # Text width approx
            text_len = fitz.get_text_length(text, fontsize=12)
            x = (rect.width - text_len) / 2
            # Adjusted to 40 pts from bottom to avoid cutting off
            point = fitz.Point(x, rect.height - 40)
            
            page.insert_text(point, text, fontsize=12, color=(0,0,0))

