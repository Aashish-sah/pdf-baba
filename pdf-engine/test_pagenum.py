import fitz

def add_header_footer(input_pdf, output_pdf):
    doc = fitz.open(input_pdf)
    total = len(doc)
    for i, page in enumerate(doc):
        text = f"Page {i+1} of {total}"
        rect = page.rect
        # Test coordinates: 30 pts from bottom
        point = fitz.Point(rect.width / 2, rect.height - 30)
        
        # Using insert_text with center alignment trick or insert_textbox
        # insert_text doesn't support 'align', it places at point.
        # So we stick to calculating x manually.
        text_len = fitz.get_text_length(text, fontsize=12)
        x = (rect.width - text_len) / 2
        
        # Debug print
        print(f"Page {i+1}: Rect {rect}, Text at ({x}, {rect.height - 30})")
        
        # Insert
        page.insert_text((x, rect.height - 30), text, fontsize=12, color=(0, 0, 0))
        
    doc.save(output_pdf)
    print(f"Saved to {output_pdf}")

if __name__ == "__main__":
    # Create a dummy PDF first if needed
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "Hello World")
    doc.save("test_page_num_input.pdf")
    doc.close()
    
    add_header_footer("test_page_num_input.pdf", "test_page_num_output.pdf")
