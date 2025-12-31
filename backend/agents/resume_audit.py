from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage
import json
import re

llm = ChatOllama(model="gemma3:1b", format="json", temperature=0.1)

def audit_resume(resume_text: str, job_description: str = ""):
    """
    Analyzes the resume for ATS compatibility, content quality, and formatting.
    """
    print("--- STARTING RESUME AUDIT ---")
    
    prompt = f"""
    You are an expert ATS (Applicant Tracking System) Auditor and Resume Coach.
    
    CONTEXT:
    Resume Text: {resume_text[:2000]}... (truncated)
    Target Job Description (Optional): {job_description[:500] if job_description else "General Tech Role"}
    
    TASK:
    Audit this resume and provide a detailed score and feedback report.
    
    CRITERIA:
    1. **Impact**: Does it use strong action verbs? (e.g. "Architected" vs "Worked on")
    2. **Quantification**: Are there numbers/metrics? (e.g. "Improved by 40%" vs "Improved performance")
    3. **Keywords**: Does it have relevant tech keywords?
    4. **Formatting**: Is it readable? (Inferred from text structure)
    
    OUTPUT FORMAT:
    JSON with the following structure:
    {{
        "score": 75,
        "summary": "Good technical depth but lacks quantifiable metrics.",
        "sections": [
            {{
                "name": "Impact & Verbs",
                "score": 60,
                "status": "warning",
                "issues": ["Overused 'Worked on'", "Passive voice detected"],
                "suggestions": ["Use 'Spearheaded', 'Orchestrated', 'Engineered'"]
            }},
            {{
                "name": "Quantifiable Metrics",
                "score": 40,
                "status": "critical",
                "issues": ["Very few numbers found", "Claims lack proof"],
                "suggestions": ["Add % improvement", "Mention user scale (e.g. 10k users)"]
            }},
            {{
                "name": "Keywords & Skills",
                "score": 90,
                "status": "good",
                "issues": [],
                "suggestions": []
            }}
        ],
        "missing_keywords": ["CI/CD", "Unit Testing"]
    }}
    """
    
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content
        
        # JSON Parsing Logic
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            raise ValueError("Could not parse JSON")
            
    except Exception as e:
        print(f"Error auditing resume: {e}")
        return {
            "score": 0,
            "summary": "Error analyzing resume.",
            "sections": [],
            "missing_keywords": []
        }
