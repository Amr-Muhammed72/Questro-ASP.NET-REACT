import faiss
import json
import os
import numpy as np
import torch 
from .util import normalize_text
from sentence_transformers import SentenceTransformer
import sqlite3

class CrossDomainRAGIndex:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Initializing embedding model on: {device.upper()}")
        
        self.model = SentenceTransformer(model_name, device=device)
        self.dimension = self.model.get_embedding_dimension()
        
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
        
        faiss.normalize_L2(embeddings)
        self.index.add(embeddings)
        
        # Strip the redundant embedding_text field to save gigabytes of RAM and disk space
        for rec in unified_records:
            if 'embedding_text' in rec:
                del rec['embedding_text']
                
        self.metadata_store.extend(unified_records)
        
        print(f"Successfully indexed {self.index.ntotal} items.")

    def save(self, index_path: str, meta_path: str):
        """Saves the FAISS index and metadata to disk."""
        
        print("Writing FAISS index to disk...")
        faiss.write_index(self.index, index_path)
        
        print("Writing metadata to SQLite database...")
        if os.path.exists(meta_path):
            os.remove(meta_path)
            
        conn = sqlite3.connect(meta_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE metadata (
                id INTEGER PRIMARY KEY,
                data TEXT
            )
        ''')
        
        for i, item in enumerate(self.metadata_store):
            cursor.execute('INSERT INTO metadata (id, data) VALUES (?, ?)', (i, json.dumps(item)))
            
        conn.commit()
        conn.close()
        
        print("Save complete!")

    def load(self, index_path: str, meta_path: str):
        """Loads the FAISS index and metadata from disk."""
        
        print("Loading FAISS index from disk...")
        self.index = faiss.read_index(index_path, faiss.IO_FLAG_MMAP)
        
        print("Connecting to metadata SQLite database...")
        self.db_conn = sqlite3.connect(meta_path, check_same_thread=False)
        
        print(f"Loaded index with {self.index.ntotal} items.")

    def retrieve(self, query: str, top_k: int = 5) -> list:
        """Retrieves the top_k most similar items to the user's query."""
        
        clean_query = normalize_text(query)
        
        if isinstance(clean_query, list):
            clean_query = " ".join([str(item) for item in clean_query])
        else:
            clean_query = str(clean_query)
        
        query_embedding = self.model.encode([clean_query], convert_to_numpy=True)
        query_embedding = np.atleast_2d(query_embedding).astype(np.float32)
        faiss.normalize_L2(query_embedding)
        
        distances, indices = self.index.search(query_embedding, top_k)
        
        results = []
        cursor = self.db_conn.cursor()
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1: 
                cursor.execute('SELECT data FROM metadata WHERE id = ?', (int(idx),))
                row = cursor.fetchone()
                if row:
                    results.append({
                        "score": float(dist),
                        "data": json.loads(row[0])
                    })
                    
        return results