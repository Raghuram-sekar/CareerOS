from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .services.scraper import scrape_jobs
from .services.matcher import find_matches
from .services.roadmap import generate_roadmap
from .services.profile_engine import generate_profile
from .db.vector_store import vector_store
import uuid

app = FastAPI(title="CareerOS API", version="1.0.0")

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"🔥 GLOBAL ERROR: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"⚠️ VALIDATION ERROR: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation Error", "errors": exc.errors()},
    )

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"➡️ REQUEST: {request.method} {request.url}")
    try:
        response = await call_next(request)
        print(f"⬅️ RESPONSE: {response.status_code}")
        return response
    except Exception as e:
        print(f"🔥 MIDDLEWARE ERROR: {e}")
        raise e

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "CareerOS"}

@app.get("/")
async def root():
    return {"message": "Welcome to CareerOS API"}

# --- Phase 1: Profile ---
from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File
import shutil
import tempfile
import os

# ... (imports)

@app.post("/api/v1/profile/upload")
async def upload_resume(file: UploadFile = File(...)):
    from .services.parser import parse_resume
    
    try:
        print(f"Received file upload: {file.filename}")
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
            
        print(f"Saved to temp path: {tmp_path}")
        
        try:
            parsed_data = parse_resume(tmp_path)
            print("Resume parsed successfully.")
            
            profile = generate_profile(parsed_data["text"])
            print("Profile generated successfully.")
            
            profile_id = str(uuid.uuid4())
            
            vector_store.add_profile(
                profile_id=profile_id,
                embedding=profile["embedding_vector"],
                metadata={
                    "skills": ", ".join(profile["hard_skills"]),
                    "summary": profile["raw_text_summary"]
                }
            )
            print(f"Profile stored with ID: {profile_id}")
            return {"profile_id": profile_id, "data": profile}
        finally:
            # Cleanup temp file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                print("Temp file cleaned up.")
                
    except Exception as e:
        print(f"ERROR in upload_resume: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- Phase 2: Intelligence ---
@app.post("/api/v1/jobs/scrape")
async def trigger_scrape(background_tasks: BackgroundTasks):
    # Run scraping in background
    background_tasks.add_task(scrape_jobs)
    return {"message": "Scraping started in background"}

@app.get("/api/v1/matches/{profile_id}")
async def get_matches(profile_id: str):
    matches = find_matches(profile_id)
    return {"matches": matches}

from pydantic import BaseModel
from typing import List

class RoadmapRequest(BaseModel):
    profile_skills: List[str]
    job_skills: str
    job_title: str

@app.post("/api/v1/roadmap")
async def create_roadmap(request: RoadmapRequest):
    roadmap = generate_roadmap(request.profile_skills, request.job_skills, request.job_title)
    return roadmap

# --- Phase 3: Agent Loop ---
@app.post("/api/v1/feedback")
async def submit_feedback(profile_id: str, job_id: str, outcome: str, reason: str = None):
    from .services.feedback import process_feedback
    result = process_feedback(profile_id, job_id, outcome, reason)
    return result

@app.post("/api/v1/post-mortem")
async def post_mortem_endpoint(job_title: str, job_description: str, user_skills: str, rejection_reason: str = None):
    skills_list = user_skills.split(',')
    from .services.post_mortem import analyze_rejection
    return analyze_rejection(job_title, job_description, skills_list, rejection_reason)

@app.post("/api/v1/tailor")
async def tailor_resume_endpoint(user_skills: str, job_description: str, job_title: str):
    skills_list = user_skills.split(',')
    from .services.tailor import tailor_resume
    return tailor_resume(skills_list, job_description, job_title)

class AuditRequest(BaseModel):
    resume_text: str
    job_description: str = ""

@app.post("/api/v1/audit")
async def audit_resume_endpoint(request: AuditRequest):
    from .agents.resume_audit import audit_resume
    return audit_resume(request.resume_text, request.job_description)
