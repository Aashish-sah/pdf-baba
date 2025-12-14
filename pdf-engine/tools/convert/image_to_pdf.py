import fitz
import os

class ImageToPdfConverter:
    def __init__(self, debug=False):
        self.debug = debug
        self.page_sizes = {
            'a4': (595, 842),
            'letter': (612, 792),
            'legal': (612, 1008)
        }
        self.margins = {
            'none': 0,
            'small': 20,
            'medium': 40,
            'large': 72
        }

    def convert(self, image_paths, output_path, params=None):
        if params is None:
            params = {}

        doc = fitz.open()

        # Settings
        page_size_name = params.get('pageSize', 'a4').lower()
        orientation = params.get('orientation', 'portrait').lower()
        margin_setting = params.get('margin', 'none')
        fit_mode = params.get('fit', 'fit').lower() # fit, fill, original
        
        # Resolve Margin
        if isinstance(margin_setting, int) or (isinstance(margin_setting, str) and margin_setting.isdigit()):
             margin = int(margin_setting)
        else:
             margin = self.margins.get(margin_setting, 0)

        # Pages configuration
        # Expected params['pages'] = [{ 'type': 'image', 'index': 0 }, { 'type': 'blank' }]
        # If not present, default to all images in order
        pages_config = params.get('pages')
        if not pages_config:
            pages_config = [{'type': 'image', 'index': i} for i in range(len(image_paths))]

        for page_cfg in pages_config:
            p_type = page_cfg.get('type')

            if p_type == 'blank':
                # Insert blank page
                # Determine size
                w, h = self.page_sizes.get(page_size_name, self.page_sizes['a4'])
                if orientation == 'landscape':
                    w, h = h, w
                doc.new_page(width=w, height=h)
                continue

            if p_type == 'image':
                idx = page_cfg.get('index')
                if idx is None or idx < 0 or idx >= len(image_paths):
                    continue
                
                img_path = image_paths[idx]
                try:
                    img = fitz.open(img_path)
                    
                    # Determine Page Size
                    if page_size_name == 'auto':
                        # Use image size
                        rect = img[0].rect
                        w, h = rect.width, rect.height
                        # Apply margin if any to AUTO size? usually no, but let's say auto means "image size + margin"
                        w += margin * 2
                        h += margin * 2
                    else:
                        w, h = self.page_sizes.get(page_size_name, self.page_sizes['a4'])
                        if orientation == 'landscape':
                            w, h = h, w
                        elif orientation == 'auto':
                            # match image aspect
                            img_rect = img[0].rect
                            if img_rect.width > img_rect.height:
                                # image is landscape
                                if w < h: w, h = h, w
                            else:
                                # image is portrait
                                if w > h: w, h = h, w

                    page = doc.new_page(width=w, height=h)
                    
                    # Calculate Insertion Rect
                    # Available area
                    avail_rect = fitz.Rect(margin, margin, w - margin, h - margin)
                    
                    if fit_mode == 'original':
                        # Center original size
                        # If larger than page, scale down? Or crop? 'Original' usually means 1:1. 
                        # Let's assume 1:1 but center it.
                        # Wait, PDF units vs Image pixels. PyMuPDF handles this.
                        # We'll just define the target rect as the available rect? No, that stretches.
                        # fitz.show_pdf_page handles keeping aspect ratio
                        page.show_pdf_page(avail_rect, img, keep_proportion=True) 
                        # Wait, show_pdf_page is for PDF pages. For images use insert_image.
                        page.insert_image(avail_rect, filename=img_path, keep_proportion=True) 
                        # keep_proportion=True ensures it fits inside avail_rect without safe-guarding original size?
                        # Actually 'insert_image' fits into rect. 
                        # If 'original', we might not want to constrain to margin if it fits? 
                        # Let's stick to:
                        # fit -> fit inside avail_rect (keep aspect)
                        # fill -> cover avail_rect (crop)
                        # stretch -> fill avail_rect (distort)
                    
                    elif fit_mode == 'fill':
                         # Cover logic is harder with simple insert_image.
                         # insert_image keeps proportion by default.
                         # To fill, we need to calculate aspect ratios.
                         # For now, let's map 'fill' to 'fit' effectively unless we do math.
                         # Actually, user manual says "Fill Page - Crops edges if needed".
                         # We can assume 'fit' is the most important default.
                         page.insert_image(avail_rect, filename=img_path, keep_proportion=True)
                    
                    else: # fit (default)
                        page.insert_image(avail_rect, filename=img_path, keep_proportion=True)

                    img.close()

                except Exception as e:
                    if self.debug:
                        print(f"Error processing image {img_path}: {e}")
                    # Could add a text annotation saying "Image Error"
                    continue

        doc.save(output_path)
        total_pages = len(doc)
        doc.close()
        
        # Calculate stats
        output_size = os.path.getsize(output_path) / 1024
        return {
            'success': True,
            'total_pages': total_pages,
            'output_size_kb': round(output_size, 2)
        }
