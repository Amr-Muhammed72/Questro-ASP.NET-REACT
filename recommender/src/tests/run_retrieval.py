import os
import sys
import json
import time
import traceback

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
try:
    import pandas as pd
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

    from src.core.rag import CrossDomainRAGIndex
    from generate_queries import generate_queries

    def run_retrieval():
        INDEX_FILE = "../../vector_store/faiss_index.bin"
        META_FILE = "../../vector_store/metadata.db"
        
        if not (os.path.exists(INDEX_FILE) and os.path.exists(META_FILE)):
            print("Missing index or db files.")
            return
            
        print("Loading RAG index...")
        rag = CrossDomainRAGIndex()
        rag.load(INDEX_FILE, META_FILE)
        
        queries = generate_queries()
        
        # We will output two formats: the old human-readable txt, and a new json for metrics
        os.makedirs("../../evaluation", exist_ok=True)
        txt_out_path = os.path.join("../../evaluation", "100_realistic_tests.txt")
        json_out_path = os.path.join("../../evaluation", "test_results.json")
        
        print(f"Running {len(queries)} queries...")
        
        results_for_json = []
        
        with open(txt_out_path, 'w', encoding='utf-8') as f:
            for i, q_obj in enumerate(queries, 1):
                if i % 10 == 0:
                    print(f"Processed {i}/{len(queries)} queries...")
                    
                q_text = q_obj["full_query"]
                f.write(f"\n{'='*80}\n")
                f.write(f"TEST {i}/{len(queries)} - QUERY: {q_text}\n")
                f.write(f"{'='*80}\n")
                
                # Record start time for latency metric
                start_time = time.time()
                results = rag.retrieve(q_text, top_k=3, allow_adult=False)
                latency = time.time() - start_time
                
                json_record = {
                    "query_info": q_obj,
                    "latency_sec": latency,
                    "retrieved": []
                }
                
                for j, item in enumerate(results, 1):
                    data = item['data']
                    score = item['score']
                    item_type = data.get('type', 'UNKNOWN').upper()
                    title = data.get('title', '')
                    themes = data.get('themes', '')
                    narrative = data.get('narrative', '')
                    
                    # Write to TXT
                    f.write(f"\n[{j}] Score: {score:.4f} | Type: {item_type}\n")
                    f.write(f"Title: {title}\n")
                    f.write(f"Themes/Genres: {themes}\n")
                    narr_display = narrative[:247] + "..." if len(narrative) > 250 else narrative
                    f.write(f"Narrative: {narr_display}\n")
                    
                    # Write to JSON
                    json_record["retrieved"].append({
                        "rank": j,
                        "score": score,
                        "type": item_type,
                        "title": title,
                        "themes": themes,
                        "narrative": narrative
                    })
                    
                results_for_json.append(json_record)
                    
        with open(json_out_path, 'w', encoding='utf-8') as f:
            json.dump(results_for_json, f, indent=2, ensure_ascii=False)
            
        print(f"Done! Saved txt to {txt_out_path} and json to {json_out_path}.")

    if __name__ == "__main__":
        run_retrieval()

except Exception as e:
    print("CRASHED!")
    traceback.print_exc()
    with open("crash.log", "w") as f:
        f.write(traceback.format_exc())
