from pypdf import PdfWriter

def merge_pdfs(input_paths, output_path):
    merger = PdfWriter()

    for pdf in input_paths:
        merger.append(pdf)

    merger.write(output_path)
    merger.close()
    return True
