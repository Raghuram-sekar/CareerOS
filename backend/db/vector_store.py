import chromadb
from chromadb.config import Settings as ChromaSettings
from ..core.config import settings

class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIRECTORY)
        self.profiles_collection = self.client.get_or_create_collection("profiles")
        self.jobs_collection = self.client.get_or_create_collection("jobs")

    def add_profile(self, profile_id: str, embedding: list, metadata: dict):
        self.profiles_collection.add(
            ids=[profile_id],
            embeddings=[embedding],
            metadatas=[metadata]
        )

    def query_profiles(self, query_embedding: list, n_results: int = 5):
        return self.profiles_collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )

vector_store = VectorStore()
