
import sys
import os
import argparse
import fitz # PyMuPDF
import json

def parse_page_range(range_str, total_pages):
    """
    Parses a page range string (e.g., "1-3,5,8-") into a list of 0-based indices.
    """
    if not range_str or range_str.lower() == 'all':
        return list(range(total_pages))
    
    pages = set()
    parts = range_str.split(',')
    
    for part in parts:
        part = part.strip()
        if '-' in part:
            start, end = part.split('-')
            # Handle "X-" (to end) or "-X" (from start) if needed, 
            # but simpler "1-5" is standard. Assuming explicitly providing numbers or open ended.
            
            try:
                s = int(start) if start else 1
                e = int(end) if end else total_pages
            except ValueError:
                continue # Skip invalid format
                
            # Clamp to limits
            s = max(1, s)
            e = min(total_pages, e)
            
            if s <= e:
                for p in range(s, e + 1):
                    pages.add(p - 1) # 0-based
        else:
            try:
                p = int(part)
                if 1 <= p <= total_pages:
                    pages.add(p - 1)
            except ValueError:
                continue
                
    return sorted(list(pages))

def convert_pdf_to_images(input_path, output_dir, fmt='jpg', dpi=150, color_mode='color', page_range='all'):
    """
    Converts PDF pages to images.
    """
    try:
        doc = fitz.open(input_path)
    except Exception as e:
        return {'success': False, 'error': f"Could not open PDF: {str(e)}"}

    total_pages = len(doc)
    pages_to_convert = parse_page_range(page_range, total_pages)
    
    if not pages_to_convert:
        return {'success': False, 'error': "No valid pages selected"}

    # Calculate Zoom based on DPI (72 is standard PDF dpi)
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    
    generated_files = []
    
    # Color space handling
    alpha = False
    colorspace = fitz.csRGB
    
    if color_mode == 'gray':
        colorspace = fitz.csGRAY
    elif color_mode == 'bw':
        # Handled at pixmap level or save level usually, but fitz specific:
        # We can convert pixmap later
        pass

    try:
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        
        for page_num in pages_to_convert:
            page = doc.load_page(page_num)
            
            # Render page
            pix = page.get_pixmap(matrix=mat, colorspace=colorspace, alpha=alpha)
            
            # Handle B&W thresholding if needed, but 'gray' is usually sufficient for simple request.
            # Sticking to standard rendering.
            
            # Construct filename: basename_page-X.fmt
            # The backend script produces simple names, the API/Frontend handles the "pdfbaba" suffix during packaging/renaming 
            # or we can do it here. The prompt said "Naming Rule (Mandatory Suffix) ... <base-name>_page-<number>_pdfbaba".
            # Let's apply it here to be safe and consistent.
            
            out_filename = f"{base_name}_page-{page_num + 1}_pdfbaba.{fmt}"
            out_path = os.path.join(output_dir, out_filename)
            
            pix.save(out_path)
            generated_files.append(out_path)
            
        doc.close()
        
        return {
            'success': True,
            'total_converted': len(generated_files),
            'files': generated_files
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='PDF to Image Converter')
    parser.add_argument('--input', required=True, help='Input PDF file')
    parser.add_argument('--output_dir', required=True, help='Output directory')
    parser.add_argument('--format', default='jpg', choices=['jpg', 'jpeg', 'png', 'webp', 'tiff', 'bmp'], help='Output format')
    parser.add_argument('--dpi', type=int, default=150, help='DPI resolution')
    parser.add_argument('--color', default='color', choices=['color', 'gray', 'bw'], help='Color mode')
    parser.add_argument('--pages', default='all', help='Page range (e.g., 1-5, 8)')

    args = parser.parse_args()

    # Create output directory if it doesn't exist
    if not os.path.exists(args.output_dir):
        os.makedirs(args.output_dir)

    result = convert_pdf_to_images(
        args.input,
        args.output_dir,
        fmt=args.format,
        dpi=args.dpi,
        color_mode=args.color,
        page_range=args.pages
    )

    print(json.dumps(result))
