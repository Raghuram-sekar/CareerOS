import fitz  # PyMuPDF
from typing import Dict, Any

def parse_resume(file_path: str) -> Dict[str, Any]:
    """
    Extracts text from a PDF resume.
    """
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    
    return {
        "text": text,
        "page_count": len(doc)
    }
