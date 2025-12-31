from backend.agents.roadmap_graph import roadmap_graph

def generate_roadmap(profile_skills: list[str], job_skills: str, job_title: str):
    """
    Generates a learning roadmap using a Multi-Agent LangGraph system.
    """
    print(f"--- STARTING AGENTIC WORKFLOW for {job_title} ---")
    
    # Initial State
    initial_state = {
        "user_skills": profile_skills,
        "job_title": job_title,
        "job_skills": job_skills,
        "missing_skills": [],
        "roadmap_json": {},
        "feedback": "",
        "iteration_count": 0
    }
    
    # Invoke the Graph
    try:
        result = roadmap_graph.invoke(initial_state)
        # Extract Final Output
        roadmap = result.get("roadmap_json", {})
    except Exception as e:
        print(f"CRITICAL ERROR in Roadmap Graph: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "traceback": traceback.format_exc()}
    
    print("--- AGENTIC WORKFLOW COMPLETED ---")
    return roadmap
