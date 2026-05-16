# Cross-Domain Entertainment RAG API

This directory contains the Retrieval-Augmented Generation (RAG) vector search engine for Questro. It acts as the semantic knowledge base, retrieving highly relevant video games (Steam, RAWG) and movies (TMDB) based on natural language queries and user profiles.

This service is designed as an independent microservice. It exposes a fast, stateless REST API consumed by our central .NET API Gateway, which subsequently feeds this contextual data to a local model for final recommendation generation.

## 🏗️ Architecture & Design Decisions

To ensure production-grade stability and fast server boot times, the system architecture is strictly decoupled into two distinct phases:

1. **Offline Indexing (`build_index.py`):** An intensive ETL pipeline that downloads massive datasets from Hugging Face, unifies disparate schemas, normalizes text using `spaCy`, generates embeddings via `sentence-transformers`, and builds a highly optimized `FAISS` vector index. It cleans up temporary files to save disk space and outputs production-ready `.bin` and `.json` artifacts.

2. **Real-Time Serving (`app.py`):** A lightweight Flask API that loads the pre-built FAISS index into RAM in $O(1)$ time. It strictly serves incoming queries without any heavy data-processing overhead, preventing platform timeouts and out-of-memory (OOM) crashes.

## ⚙️ Prerequisites

* Python 3.8 or higher
* Minimum 4GB RAM (required to hold the embedding model and FAISS index in memory)
* Internet connection (first-time setup only, to download models and datasets)

## 🚀 Installation & Setup

1. **Navigate to the recommender directory:**
   ```bash
   cd recommender
   ```

2. **Create and activate a virtual environment (recommended):**
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install the dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## 🛠️ Usage

### 1. Build the Vector Index
Before running the API, you must generate the FAISS index and metadata. This script handles data downloading, cleaning, and embedding.
```bash
python build_index.py
```
*   **Input:** Fetches Steam, TMDB, and RAWG datasets from Hugging Face.
*   **Output:** Generates `./data_cache/faiss_index.bin` and `./data_cache/metadata.json`.
*   **Cleanup:** Automatically removes raw parquet files and Hugging Face cache to save disk space after completion.

### 2. Start the Recommendation API

#### Development
```bash
python app.py
```

#### Production (Recommended)
Use Gunicorn for better performance and reliability in production:
```bash
gunicorn --bind 0.0.0.0:$PORT --timeout 120 app:app
```
The server will initialize the `CrossDomainRAGIndex`, load the artifacts into memory, and listen for requests.

## 🔌 API Reference

### POST `/api/recommend`
Retrieves semantically relevant items and generates a prompt for an LLM.

**Request Body:**
```json
{
  "query": "street level superhero",
  "top_k": 5,
  "user_profile": {
    "preferred_genres": ["Action", "Noir"],
    "platform": "PC"
  }
}
```

**Successful Response (200 OK):**
```json
{
  "status": "success",
  "query": "street level superhero",
  "retrieved_items": [
    {
      "score": 0.45,
      "data": {
        "title": "Batman: Arkham Knight",
        "type": "game",
        "themes": "Action, Open World",
        "narrative": "..."
      }
    }
  ],
  "generated_prompt": "..."
}
```

## 📂 Project Structure

| File | Description |
| :--- | :--- |
| `app.py` | Flask entry point; handles API routing and server startup. |
| `build_index.py` | The main ETL pipeline script to build the vector index from scratch. |
| `rag.py` | Core class for FAISS indexing, embedding generation, and retrieval logic. |
| `preprocess.py` | Schema unification logic for Steam, TMDB, and RAWG data. |
| `dataset_downloader.py` | Utilities for downloading and caching Hugging Face datasets. |
| `util.py` | Text normalization (spaCy), prompt engineering, and disk maintenance. |
| `requirements.txt` | List of Python dependencies and the spaCy model. |

## 🧪 Advanced Configuration

*   **Port:** Default is `5000`. Can be changed via the `PORT` environment variable.
*   **CORS:** Configurable via `CLIENT_URL` (default: `http://localhost:3000`).
*   **Device:** The system automatically detects CUDA-capable GPUs for faster embedding generation; otherwise, it defaults to CPU.