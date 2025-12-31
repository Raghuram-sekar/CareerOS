# CareerOS System Architecture & Methodology

## 1. Tools & Technologies Stack

### Frontend (User Experience)
-   **Framework**: **Next.js 14+** (React) - Server-side rendering and static generation.
-   **Styling**: **Tailwind CSS** - Utility-first styling with custom "Glassmorphism" design system.
-   **Icons**: **Lucide React** - Consistent, lightweight icon set.
-   **HTTP Client**: **Axios** - For communicating with the backend API.
-   **State Management**: React Hooks (`useState`, `useEffect`).

### Backend (The Core)
-   **Framework**: **FastAPI** (Python 3.11+) - High-performance, async API server.
-   **Server**: **Uvicorn** - ASGI server implementation.
-   **Data Validation**: **Pydantic** - Data validation and settings management using Python type hints.

### AI & Agentic Core (The Brain)
-   **Orchestration**: **LangGraph** - For building stateful, multi-agent workflows (Analyst -> Architect -> Reviewer).
-   **LLM Interface**: **LangChain** & **LangChain-Ollama** - Abstraction layer for LLM interaction.
-   **Local LLM**: **Ollama** (running `gemma3:1b` or `llama3`) - Privacy-first, local inference engine.
-   **Embeddings**: **Sentence-Transformers** (`all-MiniLM-L6-v2`) - For converting text to vector embeddings.

### Data & Memory (The Knowledge)
-   **Vector Database**: **ChromaDB** - Stores profile and job embeddings for semantic search (Long-term Semantic Memory).
-   **NLP**: **spaCy** (`en_core_web_sm`) - Named Entity Recognition (NER) for skill extraction.
-   **Parsing**: **PyMuPDF** - Extracts text from PDF resumes.
-   **Live Data**: **DuckDuckGo Search** - Fetches real-time job market data.

---

## 2. Methodology: Cognitive Architecture

The system follows a **"Think, Plan, Act, Reflect"** cognitive cycle, implemented via **LangGraph**:

1.  **Perception (Ingest)**:
    -   User uploads a resume -> Parser extracts text -> Profile Engine vectorizes it.
    -   System scrapes job descriptions -> Vectorizes them.

2.  **Cognition (The Agent Loop)**:
    -   **Think (Gap Analyst Agent)**: Compares User Profile Vector vs. Job Vector. Identifies the "delta" (missing skills).
    -   **Plan (Curriculum Architect Agent)**: Takes the delta and constructs a Directed Acyclic Graph (DAG) of learning steps.
    -   **Reflect (Reviewer Agent / Meta-Learner)**: Critiques the plan. If it fails quality checks, it rejects it and forces the Architect to replan (Self-Correction).

3.  **Action (Execution)**:
    -   **Tailor Service**: Actively rewrites the user's resume bullet points to match the target job.
    -   **Roadmap Visualization**: Renders the plan as an interactive timeline.

---

## 3. Architecture Diagram Content

When drawing your diagram, organize it into these layers:

### Layer 1: User Interface (Client)
-   **Next.js App**: The dashboard where users interact.
-   **Components**: Job Feed, Roadmap Timeline, Resume Uploader, Modal.

### Layer 2: API Gateway (Server)
-   **FastAPI Router**: Handles `/api/v1/profile`, `/api/v1/roadmap`, `/api/v1/tailor`.
-   **CORS Middleware**: Handles security and origin requests.

### Layer 3: The Agentic Orchestrator (LangGraph)
*Draw this as a cycle or flow chart inside the backend block.*
-   **Node A**: Gap Analyst (Input: Profile + Job).
-   **Node B**: Curriculum Architect (Input: Missing Skills).
-   **Node C**: Reviewer / Meta-Learner (Input: Roadmap).
-   **Edge**: Feedback Loop (Reviewer -> Architect).

### Layer 4: Intelligence Services
-   **Profile Engine**: spaCy + Transformers.
-   **Matcher**: Scikit-Learn (Cosine Similarity).
-   **Tailor**: Direct LLM Service.

### Layer 5: Data Persistence
-   **ChromaDB**: Stores Vectors (Profile, Jobs).
-   **Local Filesystem**: Stores PDF Resumes (temporary).

### Layer 6: External / Local Models
-   **Ollama Service**: The actual LLM process running locally.
-   **Internet**: DuckDuckGo (for live scraping).

---

## 4. Future Extensibility
*Items we can add later if requested:*
-   **Episodic Memory (SQL)**: Storing past user interactions in SQLite/PostgreSQL.
-   **Tool Use (Function Calling)**: Giving agents access to a Python REPL or Google Calendar.
-   **Multi-Modal**: Analyzing video interviews or profile photos.
