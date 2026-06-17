import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import requests
import threading

from src.core.rag import CrossDomainRAGIndex
from src.core.util import generate_recommendation_prompt

app = Flask(__name__)

client_url = os.getenv('CLIENT_URL', 'http://localhost:3000')
port = int(os.getenv('PORT', 5000))

CORS(app, origins=[client_url])

INDEX_FILE = "./vector_store/faiss_index.bin"
META_FILE = "./vector_store/metadata.db"

rag_system = None
is_initializing = False

def initialize_rag_bg():
    global is_initializing
    if is_initializing:
        return
    is_initializing = True
    try:
        initialize_rag()
    except Exception as e:
        print(f"Background initialization failed: {e}")
    finally:
        is_initializing = False

def initialize_rag():
    """Initializes and loads the RAG system into memory once at startup."""
    global rag_system

    if not os.path.exists(INDEX_FILE) or not os.path.exists(META_FILE):
        raise RuntimeError(
            "CRITICAL ERROR: Index files missing! "
            "Please build faiss_index.bin and metadata.db locally and "
            "upload them to the server before starting the app."
        )
    
    print("\n--- Loading CrossDomainRAGIndex into Server Memory ---")
    temp_rag = CrossDomainRAGIndex()
    temp_rag.load(INDEX_FILE, META_FILE)
    rag_system = temp_rag
    print("--- RAG Index Loaded Successfully! Server Ready. ---\n")


@app.route('/api/recommend', methods=['POST'])
def recommend():
    """
    POST Endpoint to handle recommendation requests.
    Expects JSON: { "query": "street level superhero", "k": 5, "user": {}, "blocked_genres": [], "allow_adult": false }
    """
    global rag_system, is_initializing
    if rag_system is None:
        if not is_initializing:
            threading.Thread(target=initialize_rag_bg, daemon=True).start()
        return jsonify({
            "error": "System is currently initializing. Please try again in a minute.",
            "status": "initializing"
        }), 503
        
    data = request.get_json() or {}
    
    query = data.get("query")
    k = min(int(data.get("k", 5)), 50)
    # Always retrieve at least 20 candidates so Gemini has a meaningful pool
    # to re-rank from, regardless of how many final results the client requested.
    retrieve_k = max(k * 4, 20)
    user = data.get("user", None)
    blocked_genres = data.get("blocked_genres", None)

    allow_adult_val = data.get("allow_adult", False)
    if isinstance(allow_adult_val, str):
        allow_adult = allow_adult_val.lower() == 'true'
    else:
        allow_adult = bool(allow_adult_val)

    if not query:
        return jsonify({"error": "Missing required field: 'query'"}), 400

    try:
        retrieved_results = rag_system.retrieve(
            query=query,
            top_k=retrieve_k,
            blocked_genres=blocked_genres,
            allow_adult=allow_adult
        )
        
        if user and retrieved_results:
            ml_candidates = []
            catalog_add_items = []
            candidate_map = {}
            for item in retrieved_results:
                item_data = item['data']
                domain_id = item_data['id']
                prefix, actual_id = domain_id.split('_', 1)
                
                ml_id = f"movie_{actual_id}" if item_data['type'] == 'movie' else f"game_{actual_id}"
                ml_candidates.append({"item_id": ml_id, "title": item_data['title']})
                
                catalog_add_items.append({
                    "item_id": ml_id,
                    "title": item_data.get('title', 'Unknown'),
                    "domain": item_data.get('type', 'game'),
                    "description": item_data.get('narrative', ''),
                    "genres": item_data.get('themes', ''),
                    "tags": ""
                })
                
                candidate_map[ml_id] = item

            ml_api_url = os.getenv("ML_API_URL", "http://localhost:7749")
            
            
            rerank_request = {
                "user": user,
                "candidate_items": ml_candidates
            }
            model_result = {}
            try:
                response = requests.post(f"{ml_api_url}/recommend/rerank", json=rerank_request, timeout=10)
                response.raise_for_status()
                rerank_data = response.json()
                
                reranked_items = []
                for rec in rerank_data.get("recommendations", []):
                    rec_id = rec["item_key"].replace(":", "_")
                    if rec_id in candidate_map:
                        mapped_item = candidate_map[rec_id]
                        mapped_item["score"] = rec["score"]
                        reranked_items.append(mapped_item)
                
                if reranked_items:
                    retrieved_results = reranked_items
            except Exception as e:
                print(f"Warning: ML API reranking failed. Falling back to local RAG scores. Error: {e}")

        llm_prompt = generate_recommendation_prompt(
            user_query=query,
            retrieved_items=retrieved_results,
            user=user,
            blocked_genres=blocked_genres,
            final_k=k
        )
        
        # --- LLM Generation via Google Gemini ---
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        llm_response_text = None
        
        if gemini_api_key:
            try:
                gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_api_key}"
                headers = {
                    "Content-Type": "application/json"
                }
                payload = {
                    "systemInstruction": {
                        "parts": [{"text": "You are a friendly, expert entertainment recommendation engine. Your task is to output a beautifully formatted pitch to the user based on the retrieved items. Speak directly to the user. Do not output internal reasoning."}]
                    },
                    "contents": [{
                        "parts": [{"text": llm_prompt}]
                    }]
                }
                
                print(f"Calling Gemini API ({gemini_model})...")
                r = requests.post(url, headers=headers, json=payload, timeout=60)
                r.raise_for_status()
                response_data = r.json()
                llm_response_text = response_data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as e:
                print(f"Warning: LLM generation failed. Error: {e}")
                llm_response_text = f"Error generating response: {str(e)}"
        else:
            print("Warning: GEMINI_API_KEY is not set. Skipping LLM generation.")
            llm_response_text = "GEMINI_API_KEY not configured on the server."
        
        return jsonify({
            "status": "success",
            "query": query,
            "retrieved_items": retrieved_results,
            "generated_prompt": llm_prompt,
            "llm_response": llm_response_text
        }), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred during processing: {str(e)}"}), 500


if __name__ == "__main__":
    initialize_rag()
    app.run(host="0.0.0.0", port=port, debug=False)