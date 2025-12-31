from typing import List, Dict, Any
from ..db.vector_store import vector_store

def calculate_match_score(profile_embedding: List[float], job_embedding: List[float]) -> float:
    """
    Calculates cosine similarity between two embeddings.
    (ChromaDB handles this internally for queries, but useful for explicit comparisons)
    """
    # Placeholder: ChromaDB returns distance, we can invert it or use it directly.
    # For now, we rely on ChromaDB's query ranking.
    pass

def find_matches(profile_id: str, n_results: int = 20) -> List[Dict[str, Any]]:
    """
    Finds the best matching jobs for a given profile.
    """
    # 1. Get Profile Embedding
    profile_data = vector_store.profiles_collection.get(
        ids=[profile_id],
        include=["embeddings", "metadatas"]
    )
    
    if profile_data["embeddings"] is None or len(profile_data["embeddings"]) == 0:
        return []
        
    profile_embedding = profile_data["embeddings"][0]
    
    # 2. Query Jobs Collection
    results = vector_store.jobs_collection.query(
        query_embeddings=[profile_embedding],
        n_results=n_results
    )
    
    matches = []
    seen_jobs = set()
    
    if results["ids"]:
        for i, job_id in enumerate(results["ids"][0]):
            metadata = results["metadatas"][0][i]
            title = metadata["title"]
            company = metadata["company"]
            
            # Deduplication: Check if (title, company) already seen in this result set
            job_key = (title.lower(), company.lower())
            if job_key in seen_jobs:
                continue
            seen_jobs.add(job_key)
            
            # ChromaDB returns L2 distance by default.
            # For normalized vectors: similarity = 1 - (distance^2) / 2
            # distance ranges from 0 (identical) to 2 (opposite).
            distance = results["distances"][0][i]
            similarity = 1 - (distance ** 2) / 2
            match_score = max(0.0, similarity) * 100
            
            matches.append({
                "job_id": job_id,
                "title": title,
                "company": company,
                "score": round(match_score, 1), # Return 0-100 score
                "skills": metadata.get("skills", ""),
                "url": metadata.get("url", "#"),
                "applicants": metadata.get("applicants", 0),
                "days_left": metadata.get("days_left", 0),
                "salary": metadata.get("salary", "Not Disclosed"),
                "job_type": metadata.get("job_type", "Full Time"),
                "experience": metadata.get("experience", "Entry Level"),
                "posted_date": metadata.get("posted_date", "Recently")
            })
            
    return matches
