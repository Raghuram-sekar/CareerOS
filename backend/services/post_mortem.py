import requests
import json
from typing import Dict, Any

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "gemma3:1b"

def analyze_rejection(job_title: str, job_description: str, user_skills: list, rejection_reason: str = None) -> Dict[str, Any]:
    """
    Analyzes why a user might have been rejected (or would be rejected) 
    and suggests a corrective action plan.
    """
    
    reason_context = f"User reported reason: {rejection_reason}" if rejection_reason else "No specific reason provided."
    
    prompt = f"""
    You are an expert Career Strategist.
    Target Job: {job_title}
    Job Description Snippet: {job_description[:500]}...
    User Skills: {', '.join(user_skills)}
    Rejection Context: {reason_context}
    
    Analyze the likely root cause of rejection (or gap) and suggest a specific corrective action.
    
    Format as JSON:
    {{
        "root_cause": "Brief explanation of the gap (e.g., Missing cloud experience)",
        "corrective_action": "Specific project or certification to fix it",
        "resources": ["Resource 1", "Resource 2"]
    }}
    
    Return ONLY JSON.
    """
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        result = response.json()
        return json.loads(result["response"])
    except Exception as e:
        print(f"Error analyzing rejection: {e}")
        return {
            "root_cause": "Unable to analyze at this time.",
            "corrective_action": "Review job description manually.",
            "resources": []
        }
