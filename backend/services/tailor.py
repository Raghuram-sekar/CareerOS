import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"

def tailor_resume(user_skills: list[str], job_description: str, job_title: str):
    """
    Rewrites resume bullet points to match the job description using LLM.
    """
    prompt = f"""
    You are an expert Resume Writer and ATS Specialist.
    
    CONTEXT:
    - User Skills: {', '.join(user_skills)}
    - Target Job: {job_title}
    - Job Description Snippet: {job_description[:500]}...
    
    TASK:
    Generate 3 optimized resume bullet points that highlight the user's skills in the context of this job.
    Use keywords from the job description to pass ATS scanners.
    
    OUTPUT FORMAT:
    JSON with a key "tailored_bullets" (list of strings).
    Example: {{ "tailored_bullets": ["Implemented CI/CD pipelines...", "Optimized Docker containers..."] }}
    """

    payload = {
        "model": "gemma3:1b",
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
        print(f"Error tailoring resume: {e}")
        return {"tailored_bullets": ["Error generating tailored content."]}
