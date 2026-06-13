import os
import random
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

import pandas as pd 
from src.core.rag import CrossDomainRAGIndex

def generate_queries():
    genres = [
        "A sci-fi movie", "A horror game", "A romantic comedy", "A puzzle game", 
        "An action RPG", "A historical drama", "A multiplayer shooter", 
        "A platformer", "A survival game", "A fantasy epic"
    ]
    settings = [
        "set in a post-apocalyptic wasteland", "in outer space", "during World War 2", 
        "in a neon cyberpunk city", "in a medieval kingdom", "in a modern metropolis", 
        "in a spooky haunted mansion", "underwater", "in a magical academy", "in a vast desert"
    ]
    details = [
        "with a great story", "featuring intense combat", "that is relaxing and cozy", 
        "with a mind-bending twist", "about exploring the unknown", "with puzzle solving",
        "focusing on survival", "with beautiful art", "that is very emotional", "with co-op multiplayer"
    ]
    
    queries = []
    for g in genres:
        for s in settings:
            queries.append(f"{g} {s}")
            
    random.seed(42)
    random.shuffle(queries)
    
    final_queries = []
    for i in range(100):
        detail = random.choice(details)
        final_queries.append(f"{queries[i]} {detail}.")
        
    return final_queries

def run():
    INDEX_FILE = "./vector_store/faiss_index.bin"
    META_FILE = "./vector_store/metadata.db"
    
    if not (os.path.exists(INDEX_FILE) and os.path.exists(META_FILE)):
        print("Missing index or db files.")
        return
        
    print("Loading RAG index...")
    rag = CrossDomainRAGIndex()
    rag.load(INDEX_FILE, META_FILE)
    
    queries = generate_queries()
    out_path = os.path.join("evaluation", "100_realistic_tests.txt")
    
    print(f"Running 100 queries and saving to {out_path}...")
    
    with open(out_path, 'w', encoding='utf-8') as f:
        for i, q in enumerate(queries, 1):
            if i % 10 == 0:
                print(f"Processed {i}/100 queries...")
            f.write(f"\n{'='*80}\n")
            f.write(f"TEST {i}/100 - QUERY: {q}\n")
            f.write(f"{'='*80}\n")
            
            results = rag.retrieve(q, top_k=3)
            for j, item in enumerate(results, 1):
                data = item['data']
                f.write(f"\n[{j}] Score: {item['score']:.4f} | Type: {data.get('type', 'UNKNOWN').upper()}\n")
                f.write(f"Title: {data.get('title', '')}\n")
                f.write(f"Themes/Genres: {data.get('themes', '')}\n")
                narrative = data.get('narrative', '')
                if len(narrative) > 250:
                    narrative = narrative[:247] + "..."
                f.write(f"Narrative: {narrative}\n")
                
    print("Done! All 100 tests saved.")

if __name__ == "__main__":
    run()
