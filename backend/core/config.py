import os

class Settings:
    PROJECT_NAME: str = "CareerOS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Vector Store
    CHROMA_PERSIST_DIRECTORY: str = os.path.join(os.getcwd(), "chroma_db")
    
    # Models
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    NER_MODEL: str = "en_core_web_sm"

settings = Settings()
