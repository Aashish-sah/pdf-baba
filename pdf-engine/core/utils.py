import os
import shutil
from pathlib import Path

def format_file_size(size_bytes):
    """Format file size in human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def cleanup_temp_files(temp_dir):
    """Clean up temporary files"""
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)

def get_file_info(file_path):
    """Get basic file information"""
    if not os.path.exists(file_path):
        return None
    
    stat = os.stat(file_path)
    return {
        'size_bytes': stat.st_size,
        'size_formatted': format_file_size(stat.st_size),
        'created': stat.st_ctime,
        'modified': stat.st_mtime
    }
