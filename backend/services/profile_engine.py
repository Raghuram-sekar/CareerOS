import spacy
from sentence_transformers import SentenceTransformer
from ..core.config import settings
from typing import Dict, Any, List

# Load models (lazy loading recommended in production, but fine here)
try:
    nlp = spacy.load(settings.NER_MODEL)
except OSError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "spacy", "download", settings.NER_MODEL])
    nlp = spacy.load(settings.NER_MODEL)

embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)

# Comprehensive list of tech skills for keyword matching
TECH_KEYWORDS = {
    "python", "java", "c++", "c#", "javascript", "typescript", "react", "angular", "vue", "node.js", "node",
    "django", "flask", "fastapi", "spring", "springboot", "hibernate", "dotnet", ".net",
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform", "ansible",
    "sql", "mysql", "postgresql", "mongodb", "redis", "cassandra", "elasticsearch",
    "git", "github", "gitlab", "jira", "agile", "scrum",
    "machine learning", "deep learning", "nlp", "computervision", "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn",
    "html", "css", "sass", "less", "bootstrap", "tailwind", "material-ui",
    "linux", "unix", "bash", "shell", "powershell",
    "rest", "graphql", "grpc", "microservices", "api",
    "flutter", "dart", "react native", "swift", "kotlin", "android", "ios",
    "figma", "adobe xd", "sketch"
}

def extract_skills(text: str) -> List[str]:
    skills = set()
    text_lower = text.lower()
    
    # 1. Keyword Matching (Case-insensitive)
    for keyword in TECH_KEYWORDS:
        # Use regex to match whole words only (avoid matching "java" in "javascript" if not careful, though set handles duplicates)
        # Simple check: is the keyword in the text?
        # For better precision, we can use regex word boundaries: \bkeyword\b
        if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
            # Capitalize for display (simple heuristic)
            if keyword == "aws" or keyword == "sql" or keyword == "api":
                skills.add(keyword.upper())
            elif keyword == "node.js" or keyword == "react.js":
                skills.add(keyword.title())
            else:
                skills.add(keyword.title())

    # 2. NER Extraction (Fallback/Supplement)
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT", "WORK_OF_ART"]:
            # Filter out common false positives if needed
            if ent.text.lower() not in skills:
                skills.add(ent.text)
                
    return list(skills)

import re

def extract_contact_info(text: str):
    # Simple regex for email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else None
    
    # Simple regex for phone (very basic)
    phone_match = re.search(r'[\+\(]?[0-9][0-9 .\-\(\)]{8,}[0-9]', text)
    phone = phone_match.group(0) if phone_match else None
    
    return email, phone

def clean_name(name: str, nlp_model) -> str:
    if not name:
        return "Candidate"
    
    # 1. Remove newlines and extra spaces
    name = " ".join(name.split())
    
    # 2. Check for GPE (Location) inside the name string
    doc = nlp_model(name)
    clean_parts = []
    for token in doc:
        # If token is part of a GPE, skip it (naive but helps with "Name City")
        if token.ent_type_ == "GPE":
            continue
        clean_parts.append(token.text)
    
    cleaned = " ".join(clean_parts)
    
    # 3. Length Heuristic: If still > 3 words, take first 2 (First Last)
    # This fixes "Raghuram Sekar Coimbatore" -> "Raghuram Sekar"
    words = cleaned.split()
    if len(words) > 3:
        return " ".join(words[:2])
    
    return cleaned

def generate_profile(text: str) -> Dict[str, Any]:
    skills = extract_skills(text)
    embedding = embedding_model.encode(text).tolist()
    
    # Extract entities for Name and Location
    doc = nlp(text)
    name = None
    for ent in doc.ents:
        if ent.label_ == "PERSON" and not name:
            name = ent.text
            break
    
    # Clean the extracted name
    final_name = clean_name(name, nlp)
            
    email, phone = extract_contact_info(text)
    
    return {
        "name": final_name,
        "email": email or "Not found",
        "phone": phone or "Not found",
        "hard_skills": skills,
        "embedding_vector": embedding,
        "raw_text_summary": text[:200] + "..."
    }
