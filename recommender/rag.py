import faiss
import json
import os
import numpy as np
import torch 
from util import normalize_text
from sentence_transformers import SentenceTransformer

class CrossDomainRAGIndex:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Initializing embedding model on: {device.upper()}")
        
        self.model = SentenceTransformer(model_name, device=device)
        self.dimension = self.model.get_sentence_embedding_dimension()
        
        self.index = faiss.IndexHNSWFlat(self.dimension, 32)
        self.metadata_store = []

    def build_index(self, unified_records: list):
        """Generates embeddings and builds the FAISS index."""
        
        texts = [rec['embedding_text'] for rec in unified_records]
        
        print(f"Generating embeddings for {len(texts)} items...")
        
        embeddings = self.model.encode(
            texts, 
            convert_to_numpy=True, 
            show_progress_bar=True,
            batch_size=512 
        )
        
        self.index.add(embeddings)
        self.metadata_store.extend(unified_records)
        
        print(f"Successfully indexed {self.index.ntotal} items.")

    def save(self, index_path: str, meta_path: str):
        """Saves the FAISS index and metadata to disk."""
        
        print("Writing FAISS index to disk...")
        faiss.write_index(self.index, index_path)
        
        print("Writing metadata to disk...")
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(self.metadata_store, f)
        
        print("Save complete!")

    def load(self, index_path: str, meta_path: str):
        """Loads the FAISS index and metadata from disk."""
        
        print("Loading FAISS index from disk...")
        self.index = faiss.read_index(index_path)
        
        print("Loading metadata from disk...")
        with open(meta_path, 'r', encoding='utf-8') as f:
            self.metadata_store = json.load(f)
        
        print(f"Loaded index with {self.index.ntotal} items.")
    def retrieve(self, query: str, top_k: int = 5) -> list:
        """Retrieves the top_k most similar items to the user's query."""
        
        clean_query = normalize_text(query)
        
        query_embedding = self.model.encode([clean_query], convert_to_numpy=True)
        
        import numpy as np
        query_embedding = np.atleast_2d(query_embedding).astype(np.float32)
        
        distances, indices = self.index.search(query_embedding, top_k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1: 
                try:
                    results.append({
                        "score": float(dist),
                        "data": self.metadata_store[idx]
                    })
                except IndexError:
                    continue
                    
        return results