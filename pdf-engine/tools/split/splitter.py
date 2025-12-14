import os
import fitz  # PyMuPDF
from typing import List, Dict

class PDFSplitter:
    def __init__(self, debug=False):
        self.debug = debug

    def parse_range(self, range_str: str, total_pages: int) -> List[int]:
        """
        Parses range string like "1-5, 8, 10-12" into zero-indexed page numbers.
        Handles "1-end" or "5-".
        """
        pages = set()
        parts = range_str.split(',')
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
                
            if '-' in part:
                start_str, end_str = part.split('-', 1)
                start_str = start_str.strip()
                end_str = end_str.strip()
                
                try:
                    start = int(start_str)
                except ValueError:
                    continue # Invalid start
                
                if end_str.lower() in ('end', ''):
                    end = total_pages
                else:
                    try:
                        end = int(end_str)
                    except ValueError:
                        end = total_pages # Fallback? Or ignore? Let's cap at total
                
                # Adjust to 0-index inclusive of end
                # User input 1-based, code 0-based
                # User 1-5 -> Code 0-4
                # range(start-1, end)
                
                start_idx = max(0, start - 1)
                end_idx = min(total_pages, end)
                
                for i in range(start_idx, end_idx):
                    pages.add(i)
            else:
                try:
                    page = int(part)
                    if 1 <= page <= total_pages:
                        pages.add(page - 1)
                except ValueError:
                    pass
                    
        return sorted(list(pages))

    def _add_page_numbers(self, doc):
        """Adds page numbers to the bottom center of each page."""
        for page_num, page in enumerate(doc):
            rect = page.rect
            text = f"{page_num + 1}"
            p_point = fitz.Point(rect.width / 2, rect.height - 40) # 40pt from bottom
            
            page.insert_text(
                p_point,
                text,
                fontsize=12,
                fontname="helv",
                color=(0, 0, 0)
            )

    def split_by_range(self, input_path: str, output_path: str, range_str: str, properties: dict = None) -> dict:
        try:
            if properties is None:
                properties = {}
                
            doc = fitz.open(input_path)
            total_pages = len(doc)
            
            selected_pages = self.parse_range(range_str, total_pages)
            
            if not selected_pages:
                return {'success': False, 'error': 'No valid pages selected'}
            
            # Create new document
            out_doc = fitz.open()
            
            # Copy ONLY selected pages
            # insert_pdf(src, from_page=start, to_page=end) matches 0-based indices inclusive
            for page_idx in selected_pages:
                 out_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
            
            # Add page numbers if requested
            if properties.get('pageNumbers', False):
                self._add_page_numbers(out_doc)
                
            out_doc.save(output_path, garbage=4, deflate=True)
            out_doc.close()
            doc.close()
            
            output_size = os.path.getsize(output_path) / 1024
            
            return {
                'success': True,
                'total_pages': len(selected_pages),
                'output_size_kb': round(output_size, 2)
            }
            
        except Exception as e:
            if self.debug:
                print(f"Split Error: {e}")
            return {'success': False, 'error': str(e)}
