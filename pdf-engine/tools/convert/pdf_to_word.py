
import sys
import os
import json
from pdf2docx import Converter

def convert_pdf_to_word(input_path, output_path, pages=None):
    """
    Convert PDF to Word using pdf2docx.
    input_path: Path to source PDF
    output_path: Path to destination DOCX
    pages: Optional list of page indices (0-based) or 'all'
    """
    try:
        cv = Converter(input_path)
        
        # Handle page selection
        # pdf2docx allows passing a list of page numbers to `pages` arg
        target_pages = None
        
        if pages and pages != 'all':
            # Parse ranges like "1-3, 5, 8" into 0-based integer list
            target_pages = []
            try:
                for part in str(pages).split(','):
                    part = part.strip()
                    if '-' in part:
                        start, end = part.split('-')
                        # Convert 1-based "1-3" to 0-based indices [0, 1, 2]
                        target_pages.extend(range(int(start) - 1, int(end)))
                    elif part.isdigit():
                        target_pages.append(int(part) - 1)
                
                # Deduplicate and sort
                target_pages = sorted(list(set(target_pages)))
            except:
                target_pages = None # Fallback to all if parse fails

        # Convert
        # If target_pages is None, it converts all.
        cv.convert(output_path, pages=target_pages)
        cv.close()
        
        return {
            "success": True,
            "output": output_path
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
