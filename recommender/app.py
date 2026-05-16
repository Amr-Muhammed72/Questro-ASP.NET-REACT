from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from rag import CrossDomainRAGIndex
from util import generate_recommendation_prompt

app = Flask(__name__)

client_url = os.getenv('CLIENT_URL', 'http://localhost:3000')
port = int(os.getenv('PORT', 5000))

CORS(app, origins=[client_url])

INDEX_FILE = "./data_cache/faiss_index.bin"
META_FILE = "./data_cache/metadata.json"

rag_system = None

def initialize_rag():
    """Initializes and loads the RAG system into memory once at startup."""
    global rag_system
    if not os.path.exists(INDEX_FILE) or not os.path.exists(META_FILE):
        raise FileNotFoundError(
            "FAISS index or metadata file missing! Run main.py first to build the index."
        )
    
    print("\n--- Loading CrossDomainRAGIndex into Server Memory ---")
    rag_system = CrossDomainRAGIndex()
    rag_system.load(INDEX_FILE, META_FILE)
    print("--- RAG Index Loaded Successfully! Server Ready. ---\n")


@app.route('/api/recommend', methods=['POST'])
def recommend():
    """
    POST Endpoint to handle recommendation requests.
    Expects JSON: { "query": "street level superhero", "top_k": 5, "user_profile": {} }
    """
    data = request.get_json() or {}
    
    query = data.get("query")
    top_k = data.get("top_k", 5)
    user_profile = data.get("user_profile", None)

    if not query:
        return jsonify({"error": "Missing required field: 'query'"}), 400

    try:
        retrieved_results = rag_system.retrieve(query, top_k=top_k)
        
        llm_prompt = generate_recommendation_prompt(
            user_query=query, 
            retrieved_items=retrieved_results, 
            user_profile=user_profile
        )
        
        return jsonify({
            "status": "success",
            "query": query,
            "retrieved_items": retrieved_results,
            "generated_prompt": llm_prompt
        }), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred during processing: {str(e)}"}), 500


with app.app_context():
    initialize_rag()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port, debug=False)