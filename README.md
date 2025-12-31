# CareerOS - AI-Powered Career Orchestration Agent 🚀

**CareerOS** is an autonomous AI agent designed to help job seekers analyze their profile, find matching opportunities, and bridge skill gaps with personalized learning roadmaps. Built for the **AI-Verse Hackathon**.


## ✨ Key Features

*   **📄 Smart Resume Parsing**: Extracts structured data (Name, Email, Phone, Skills) from PDF resumes using `PyMuPDF` and `spaCy`.
*   **🔍 Intelligent Job Matching**: Uses Vector Embeddings (`SentenceTransformers` + `ChromaDB`) to semantically match candidates with jobs.
*   **🗺️ Personalized Learning Roadmaps**: Generates a 3-phase (Basics → Intermediate → Advanced) learning path for missing skills using **LangGraph**.
*   **✅ ATS Resume Audit**: Scores your resume against job descriptions and provides actionable feedback on Impact, Quantification, and Keywords.
*   **🕵️ Job Post-Mortem**: Analyzes why a job might *not* be a good fit and suggests corrective actions.
*   **🎨 Premium UI**: A modern, responsive interface built with **Next.js**, **Tailwind CSS**, and **Shadcn UI**.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: Next.js 14 (App Router)
*   **Styling**: Tailwind CSS, Framer Motion (Animations)
*   **Components**: Shadcn UI, Lucide React Icons
*   **State Management**: React Hooks

### Backend
*   **Framework**: FastAPI (Python)
*   **AI/LLM**: Ollama (Gemma 3: 1B), LangChain, LangGraph
*   **Database**: ChromaDB (Vector Store)
*   **NLP**: spaCy, SentenceTransformers
*   **Tools**: PyMuPDF (PDF Parsing), DuckDuckGo Search (Job Scraping)

## 🚀 Getting Started

### Prerequisites
*   **Node.js** (v18+)
*   **Python** (v3.10+)
*   **Ollama** (Running locally with `gemma3:1b` model)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Run the server
python -m uvicorn backend.main:app --reload
```
*Server runs on `http://127.0.0.1:8000`*

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
*App runs on `http://localhost:3000`*

## 💡 Usage Guide

1.  **Upload Resume**: Drag & Drop your PDF resume on the landing page.
2.  **View Matches**: The dashboard will display jobs matched to your profile score.
3.  **Generate Roadmap**: Click "Generate Roadmap" on any job card to get a tailored learning plan.
4.  **Run ATS Check**: Use the sidebar button "Run ATS Check" to audit your resume quality.

## 📂 Project Structure

```
├── backend/
│   ├── agents/          # LangGraph Agents (Roadmap, Audit)
│   ├── db/              # Vector Store (ChromaDB)
│   ├── services/        # Core Logic (Parser, Scraper, Matcher)
│   └── main.py          # API Entry Point
├── frontend/
│   ├── src/app/         # Next.js Pages & Components
│   └── public/          # Static Assets
└── README.md            # You are here
```

