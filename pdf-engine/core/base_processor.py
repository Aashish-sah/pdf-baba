class BaseProcessor:
    def __init__(self):
        pass

    def validate(self, file_path):
        import os
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        if not file_path.lower().endswith('.pdf'):
            raise ValueError("File is not a PDF")
        return True
