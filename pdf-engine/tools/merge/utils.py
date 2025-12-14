import os
from PyPDF2 import PdfReader
import fitz

def validate_pdf_files(file_paths):
    """
    Validate that files are valid PDFs
    """
    valid_files = []
    errors = []
    
    for file_path in file_paths:
        if not os.path.exists(file_path):
            errors.append(f"File not found: {os.path.basename(file_path)}")
            continue
        
        # Check if it's a PDF
        try:
            with open(file_path, 'rb') as f:
                header = f.read(5)
                if header != b'%PDF-':
                    errors.append(f"Not a valid PDF: {os.path.basename(file_path)}")
                    continue
        except:
            errors.append(f"Cannot read file: {os.path.basename(file_path)}")
            continue
        
        # Try to open with PDF reader
        try:
            reader = PdfReader(file_path)
            page_count = len(reader.pages)
            
            valid_files.append({
                'path': file_path,
                'name': os.path.basename(file_path),
                'size_kb': os.path.getsize(file_path) / 1024,
                'pages': page_count,
                'valid': True
            })
        except Exception as e:
            errors.append(f"Invalid PDF: {os.path.basename(file_path)} - {str(e)}")
    
    return valid_files, errors

def analyze_pdf_compatibility(pdf_paths):
    """
    Analyze if PDFs can be merged well together
    """
    if len(pdf_paths) < 2:
        return {'compatible': True, 'warnings': []}
    
    warnings = []
    
    # Get first PDF properties
    first_pdf = pdf_paths[0]
    try:
        first_doc = fitz.open(first_pdf)
        first_page = first_doc[0]
        first_size = first_page.rect
        
        for i, pdf_path in enumerate(pdf_paths[1:], 1):
            try:
                doc = fitz.open(pdf_path)
                page = doc[0]
                page_size = page.rect
                
                # Check page size compatibility
                if abs(page_size.width - first_size.width) > 10 or \
                   abs(page_size.height - first_size.height) > 10:
                    warnings.append(f"PDF {i+1} has different page size")
                
                doc.close()
            except:
                warnings.append(f"Cannot analyze PDF {i+1}")
        
        first_doc.close()
    except:
        pass
    
    return {
        'compatible': len(warnings) == 0,
        'warnings': warnings
    }

def split_large_merges(pdf_paths, max_pages=500):
    """
    Split large merges into batches
    """
    if len(pdf_paths) <= 1:
        return [pdf_paths]
    
    batches = []
    current_batch = []
    current_page_count = 0
    
    for pdf_path in pdf_paths:
        try:
            reader = PdfReader(pdf_path)
            page_count = len(reader.pages)
            
            if current_page_count + page_count > max_pages and current_batch:
                batches.append(current_batch)
                current_batch = [pdf_path]
                current_page_count = page_count
            else:
                current_batch.append(pdf_path)
                current_page_count += page_count
        except:
            # If can't read pages, add anyway
            current_batch.append(pdf_path)
    
    if current_batch:
        batches.append(current_batch)
    
    return batches
