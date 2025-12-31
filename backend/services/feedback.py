from typing import Dict, Any
from ..db.vector_store import vector_store
from .roadmap import generate_roadmap

def process_feedback(profile_id: str, job_id: str, outcome: str, reason: str = None) -> Dict[str, Any]:
    """
    Processes user feedback on a job application.
    If rejected, it analyzes the reason and suggests a roadmap update.
    """
    
    # 1. Log the interaction (In a real app, this would go to a relational DB)
    # For now, we'll update the profile metadata in ChromaDB to store history
    
    profile_data = vector_store.profiles_collection.get(
        ids=[profile_id],
        include=["metadatas", "documents"]
    )
    
    if not profile_data["metadatas"]:
        return {"error": "Profile not found"}
        
    metadata = profile_data["metadatas"][0]
    current_history = metadata.get("application_history", "")
    
    new_entry = f"Job:{job_id}|Outcome:{outcome}|Reason:{reason};"
    updated_history = current_history + new_entry
    
    # Update metadata
    metadata["application_history"] = updated_history
    vector_store.profiles_collection.update(
        ids=[profile_id],
        metadatas=[metadata]
    )
    
    result = {"status": "Feedback logged", "outcome": outcome}
    
    # 2. If Rejected, Trigger "Reflect" -> New Roadmap
    if outcome.lower() == "rejected" and reason:
        # Simple reflection: Assume the reason indicates a missing skill
        # In a full agentic loop, an LLM would analyze the reason text.
        
        # Trigger a roadmap update suggestion
        result["suggestion"] = "Roadmap update recommended based on feedback."
        result["action"] = "fetch_new_roadmap"
        
    return result
