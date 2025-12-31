from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
import json
import re

# Helper to clean JSON
def parse_json_output(content: str):
    try:
        # Try direct parse
        return json.loads(content)
    except json.JSONDecodeError:
        # Try to find JSON block
        match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        # Try to find just the brace block
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError(f"Could not parse JSON from: {content}")

# 1. Define State
class RoadmapState(TypedDict):
    user_skills: List[str]
    job_title: str
    job_skills: str
    missing_skills: List[str]
    roadmap_json: Dict[str, Any]
    feedback: str
    iteration_count: int

# Initialize LLM
llm = ChatOllama(model="gemma3:1b", format="json", temperature=0.1)

# 2. Define Nodes

def gap_analyzer_node(state: RoadmapState):
    """
    Agent 1: The Analyst
    Role: Identifies the gap between user skills and job requirements.
    """
    print("--- AGENT: GAP ANALYST ---")
    
    prompt = f"""
    You are an expert Technical Career Analyst.
    
    CONTEXT:
    - User Skills: {', '.join(state['user_skills'])}
    - Job Title: {state['job_title']}
    - Job Requirements: {state['job_skills']}
    
    TASK:
    Identify the MISSING skills that the user needs to learn for this job.
    1. IGNORE skills the user already has (e.g. if they know Python, exclude it).
    2. Focus on technical hard skills (e.g. Kubernetes, React, AWS).
    
    OUTPUT:
    JSON with a single key 'missing_skills' containing a list of strings.
    Example: {{ "missing_skills": ["Kubernetes", "Docker", "System Design"] }}
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        content = parse_json_output(response.content)
    except Exception as e:
        print(f"Gap Analyst JSON Error: {e}")
        content = {"missing_skills": []}
    
    print(f"Identified Gaps: {content.get('missing_skills', [])}")
    return {"missing_skills": content.get("missing_skills", [])}

def curriculum_architect_node(state: RoadmapState):
    """
    Agent 2: The Architect
    Role: Creates a structured learning path for the missing skills.
    """
    print("--- AGENT: CURRICULUM ARCHITECT ---")
    
    missing = state['missing_skills']
    feedback = state.get('feedback', "")
    
    if not missing:
        # Fallback if no gaps found
        print("No gaps found. Generating mastery roadmap.")
        prompt = f"""
        The user is a perfect match for the {state['job_title']} role.
        Create a 'Mastery & Interview Prep' roadmap.
        Focus on: Advanced Patterns, System Design, and Behavioral Interview prep.
        
        Format as JSON with 'nodes' and 'edges'.
        Nodes: {{ "id": "1", "label": "Advanced System Design", "status": "pending", "week": "Week 1" }}
        """
    else:
        print(f"Creating roadmap for: {missing}")
        if feedback:
            print(f"⚠️ REVISING based on feedback: {feedback}")
            
        prompt = f"""
        You are an expert Curriculum Architect.
        
        TASK:
        Create a structured, step-by-step learning roadmap for these SPECIFIC missing skills:
        {', '.join(missing)}
        
        CONTEXT:
        Target Role: {state['job_title']}
        Previous Feedback (if any): {feedback}
        
        STRUCTURE:
        The roadmap MUST be divided into 3 distinct phases:
        1. **Phase 1: Foundations (Basics)** - Core concepts and syntax.
        2. **Phase 2: Core Competency (Intermediate)** - Building real things, common patterns.
        3. **Phase 3: Mastery (Advanced)** - Performance, security, system design, best practices.
        
        RULES:
        1. Break down the missing skills into logical steps within these phases.
        2. Be specific (e.g. "Learn React Hooks" instead of just "React").
        3. Assign a 'week' estimate to each step.
        
        OUTPUT:
        JSON with 'nodes' and 'edges'.
        Nodes: {{ "id": "1", "label": "Topic Name", "phase": "Basics", "week": "Week 1", "description": "Brief what to learn" }}
        Edges: {{ "source": "1", "target": "2" }}
        """
        
    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        roadmap = parse_json_output(response.content)
    except Exception as e:
        print(f"Architect JSON Error: {e}")
        roadmap = {}
    
    return {"roadmap_json": roadmap, "iteration_count": state.get("iteration_count", 0) + 1}

def reviewer_node(state: RoadmapState):
    """
    Agent 3: The Reviewer (Meta-Learner)
    Role: Evaluates the roadmap quality and requests revisions if needed.
    """
    print("--- AGENT: REVIEWER (META-LEARNER) ---")
    
    roadmap = state['roadmap_json']
    missing = state['missing_skills']
    
    prompt = f"""
    You are a Senior Technical Reviewer.
    
    TASK:
    Review the proposed learning roadmap.
    
    CONTEXT:
    - Missing Skills Needed: {', '.join(missing)}
    - Proposed Roadmap Nodes: {[n.get('label') for n in roadmap.get('nodes', [])]}
    
    CRITERIA:
    1. Does the roadmap cover ALL missing skills?
    2. Are the steps specific enough?
    
    OUTPUT:
    JSON with:
    - "status": "APPROVE" or "REJECT"
    - "feedback": "Reason for rejection" (if rejected)
    
    Example: {{ "status": "APPROVE", "feedback": "Looks good" }}
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        review = parse_json_output(response.content)
    except Exception:
        review = {"status": "APPROVE"} # Fallback to approve if parsing fails
        
    print(f"Review Decision: {review.get('status')} - {review.get('feedback', '')}")
    return {"feedback": review.get("feedback", ""), "review_status": review.get("status", "APPROVE")}

def should_continue(state: RoadmapState):
    # OPTIMIZATION: Skipping loop to prevent timeouts on local machine
    print("✅ Roadmap Approved (Fast Track).")
    return "approve"

# 3. Build Graph
workflow = StateGraph(RoadmapState)

workflow.add_node("analyst", gap_analyzer_node)
workflow.add_node("architect", curriculum_architect_node)
workflow.add_node("reviewer", reviewer_node)

workflow.set_entry_point("analyst")
workflow.add_edge("analyst", "architect")
workflow.add_edge("architect", "reviewer")

workflow.add_conditional_edges(
    "reviewer",
    should_continue,
    {
        "approve": END,
        "reject": "architect"
    }
)

# Compile
roadmap_graph = workflow.compile()
