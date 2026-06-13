# Cross-Domain Entertainment RAG API

This directory contains the Retrieval-Augmented Generation (RAG) vector search engine for Questro. It acts as the semantic knowledge base, retrieving highly relevant video games (Steam, RAWG) and movies (TMDB) based on natural language queries and user profiles.

This service is designed as an independent microservice. It exposes a fast, stateless REST API consumed by our central .NET API Gateway, which subsequently feeds this contextual data to a local model for final recommendation generation.

## 🏗️ Architecture & Design Decisions

To ensure production-grade stability and fast server boot times, the system architecture uses a decoupled data layer with strict memory mapping:

1. **Vector Storage (`faiss_index.bin`):** Uses FAISS Memory Mapping (`faiss.IO_FLAG_MMAP`) to allow the 2.1+ million vector embeddings to stream directly from the SSD rather than loading into RAM. This effectively eliminates OOM crashes.
2. **Metadata Storage (`metadata.db`):** Uses SQLite to store the large text payloads (Narratives, Themes, Titles) indexed by FAISS IDs. This performs $O(1)$ disk lookups to retrieve item data without holding massive JSON arrays in RAM.
3. **Real-Time Serving (`app.py`):** A lightweight Flask API that loads the pre-built artifacts. It serves incoming queries with minimal memory footprint, preventing platform timeouts.

## ⚙️ Prerequisites

* Python 3.8 or higher
* Internet connection (first-time setup only, to download models and datasets)
* **RAM Requirements:**
  * **Serving the API:** ~1GB RAM (thanks to FAISS memory-mapping and SQLite disk-lookups).
  * **Building the Index:** Minimum 8GB RAM (temporarily required by pandas for processing massive datasets).
* Optional: NVIDIA GPU (CUDA) for significantly faster index building

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
Before running the API, you must generate the FAISS index and the SQLite metadata DB.
```bash
python src/pipeline/build_index.py
```
*   **Input:** Fetches Steam, TMDB, and RAWG datasets from Hugging Face.
*   **Output:** Generates `./vector_store/faiss_index.bin` and `./vector_store/metadata.db`.

### 2. Start the Recommendation API

#### Development
```bash
python app.py
```

#### Production (Recommended)
Use a production WSGI server for better performance and reliability:

**On Linux (Gunicorn):**
```bash
gunicorn --bind 0.0.0.0:$PORT --timeout 120 app:app
```

**On Windows (Waitress):**
```bash
waitress-serve --listen=0.0.0.0:5000 app:app
```

The server will initialize the `CrossDomainRAGIndex`, map the artifacts into memory, and listen for requests.

### 3. Run Realistic Tests & Visualization
You can generate 100 realistic test queries and plot their cosine similarity distributions:
```bash
python src/tests/generate_100_tests.py
python src/tests/plot_test_data.py
```

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

| Path | Description |
| :--- | :--- |
| `app.py` | Flask entry point; handles API routing and server startup. |
| `src/core/rag.py` | Core class for FAISS indexing, embedding generation, and retrieval logic using SQLite mapping. |
| `src/core/util.py` | Text normalization (spaCy) and prompt engineering utilities. |
| `src/pipeline/build_index.py` | The main ETL pipeline script to build the vector index and database from scratch. |
| `src/pipeline/dataset_downloader.py` | Utilities for downloading and caching Hugging Face datasets. |
| `src/pipeline/preprocess.py` | Schema unification logic for Steam, TMDB, and RAWG data. |
| `src/pipeline/validate_dataset.py` | Validation scripts to ensure data integrity during ETL. |
| `src/tests/generate_100_tests.py` | Generates 100 nuanced testing queries and evaluates them against the index. |
| `src/tests/plot_test_data.py` | Parses the test results and generates data visualizations. |
| `requirements.txt` | List of Python dependencies and the spaCy model. |

## 🧪 Advanced Configuration

*   **Port:** Default is `5000`. Can be changed via the `PORT` environment variable.
*   **CORS:** Configurable via `CLIENT_URL` (default: `http://localhost:3000`).
*   **Device:** The system automatically detects CUDA-capable GPUs for faster embedding generation; otherwise, it defaults to CPU.