import asyncio
from duckduckgo_search import DDGS
from typing import List, Dict, Any
from ..db.vector_store import vector_store
from .profile_engine import extract_skills, embedding_model
import uuid
import random

async def scrape_jobs(query: str = "software engineer", limit: int = 30) -> List[Dict[str, Any]]:
    """
    Scrapes jobs using DuckDuckGo Search to get real-time results.
    """
    print(f"Searching for: {query}")
    
    # Use DDGS to find real jobs
    # We search for "hiring {query}" to get job listings
    # search_term = f"{query} jobs hiring now site:linkedin.com OR site:indeed.com OR site:greenhouse.io OR site:lever.co"
    # search_term = f"{query} jobs hiring now"
    search_term = f"{query} jobs"
    
    results = []
    try:
        # synchronous generator, run in executor or just iterate if fast enough
        # DDGS is blocking, but for this demo it's fine.
        ddgs = DDGS()
        results = list(ddgs.text(search_term, max_results=limit))
        print(f"DDGS found {len(results)} results for '{search_term}'")
    except Exception as e:
        print(f"Error searching DDGS: {e}")
        return []

    processed_jobs = []
    seen_urls = set()
    
    # Optional: Clear existing jobs to avoid duplicates in this demo
    # vector_store.jobs_collection.delete(where={}) 
    
    for res in results:
        title = res.get("title", "Unknown Role")
        url = res.get("href", "#")
        snippet = res.get("body", "")
        
        # 1. Deduplication: Check if URL seen in this run
        if url in seen_urls:
            continue
        seen_urls.add(url)

        # 2. Deduplication: Check if URL exists in DB
        existing = vector_store.jobs_collection.get(where={"url": url})
        if existing and existing["ids"]:
            print(f"Skipping duplicate job: {title}")
            continue
        
        # Simple heuristic to extract company from title or snippet
        # E.g. "Software Engineer at Google"
        company = "Unknown Company"
        if " at " in title:
            parts = title.split(" at ")
            if len(parts) > 1:
                company = parts[1].split(" |")[0].split(" -")[0].strip()
        elif "-" in title:
             company = title.split("-")[0].strip()

        # 3. Extract Skills (from snippet AND title)
        skills = extract_skills(snippet)
        if not skills:
            # Fallback: Try extracting from title
            skills = extract_skills(title)
            
        # 4. Quality Filter: Skip if no skills found
        if not skills:
            print(f"Skipping job with no detected skills: {title}")
            continue
        
        # 5. Generate Embedding
        text_to_embed = f"{title} {snippet}"
        embedding = embedding_model.encode(text_to_embed).tolist()
        
        job_id = str(uuid.uuid4())
        
        # Generate realistic mock metadata for UI polish
        applicants = random.randint(10, 200)
        days_left = random.randint(1, 14)
        salary_min = random.randint(4, 10)
        salary_max = salary_min + random.randint(2, 8)
        salary = f"₹{salary_min}L - ₹{salary_max}L/Year"
        job_type = random.choice(["Full Time", "Internship"])
        experience = "No prior experience required" if job_type == "Internship" else f"{random.randint(1, 3)}+ Years"
        posted_date = f"Posted {random.randint(1, 5)} days ago"

        # 6. Store in Vector DB
        vector_store.jobs_collection.add(
            ids=[job_id],
            embeddings=[embedding],
            metadatas={
                "title": title,
                "company": company,
                "url": url,
                "skills": ", ".join(skills),
                "description": snippet,
                "applicants": applicants,
                "days_left": days_left,
                "salary": salary,
                "job_type": job_type,
                "experience": experience,
                "posted_date": posted_date
            }
        )
        
        processed_jobs.append({
            "id": job_id,
            "title": title,
            "company": company,
            "url": url,
            "skills": skills,
            "description": snippet,
            "applicants": applicants,
            "days_left": days_left,
            "salary": salary,
            "job_type": job_type,
            "experience": experience,
            "posted_date": posted_date
        })
        
    return processed_jobs
