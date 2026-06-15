# Questro RAG API — Integration Guide

> **API Role**: Cross-Domain Retrieval-Augmented Generation
> **Base URL**: `http://<RAG_HOST>:5000`
> **Protocol**: REST / JSON
> **Auth**: None (internal network only)

This directory contains the Retrieval-Augmented Generation (RAG) vector search engine for Questro. It retrieves highly relevant video games and movies based on natural language queries, handles explicit adult content and genre filtering, and orchestrates personalization via the central Machine Learning API.

---

## Quick Start

```bash
# 1. Build the FAISS Index & Metadata SQLite DB
python src/pipeline/build_index.py

# 2. Start the server
python app.py

# Wait for "--- RAG Index Loaded Successfully! Server Ready. ---"

# 3. Test the endpoint
curl -X POST http://localhost:5000/api/recommend  -H "Content-Type: application/json" -d '{
    "query": "street level superhero detective game",
    "k": 5,
    "user": {
      "age": 25,
      "game_genres_fav": "Action|RPG"
    },
    "blocked_genres": ["Horror"],
    "allow_adult": false
  }'
```

---

## Endpoints

### 1. `POST /api/recommend`

**The main RAG endpoint.** Send a natural language query along with user context, and receive a customized LLM prompt containing semantically relevant, highly-personalized items.

#### Workflow
1. RAG retrieves an over-fetched pool of candidates matching the natural language `query`.
2. Candidates are filtered locally against `blocked_genres` and `allow_adult` rules.
3. RAG dynamically registers any missing candidates into the ML catalog via `POST /catalog/add` (Hot-Add).
4. RAG calls the Machine Learning API (`POST /recommend/rerank`) to score and re-order candidates based on the `user` profile.
5. RAG formats the top `k` candidates and the user profile into a dense LLM generation prompt for Google Gemini.

#### Request Body

```json
{
  "query": "street level superhero",
  "k": 5,
  "allow_adult": false,
  "blocked_genres": ["Horror", "Crime"],
  "user": {
    "age": 21,
    "gender": "Male",
    "profession": "Student",
    "country": "Egypt",
    "movie_genres_fav": "Action|Adventure|Comedy",
    "movie_genres_disliked": "Horror|War",
    "game_genres_fav": "Action|RPG|Shooter",
    "game_genres_disliked": "Card|Educational",
    "ratings": [
      {"item_id": "game_271590", "stars": 5.0}
    ]
  }
}
```

#### Request Parameters

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | `string` | ✅ Yes | — | The natural language search term |
| `k` | `int` | No | `5` | Results to return (max 50) |
| `allow_adult` | `bool` | No | `false` | If true, permits items explicitly flagged as adult content. |
| `blocked_genres` | `string[] \| null` | No | `null` | Genres/tags to exclude before ranking. |
| `user` | `UserProfile` | No | `null` | Standard Questro ML User Profile (powers the personalized reranking) |

#### Response Body

```json
{
  "status": "success",
  "query": "street level superhero",
  "retrieved_items": [
    {
      "score": 0.872451,
      "data": {
        "id": "steam_208650",
        "title": "Batman: Arkham Knight",
        "type": "game",
        "themes": "Action, Open World",
        "narrative": "..."
      }
    }
  ],
  "generated_prompt": "You are an expert cross-domain entertainment recommendation engine...\n\nUser Background & Preferences:\n- Age: 21\n\nCurrent Request: \"street level superhero\"\n\nHere are the most semantically relevant items...",
  "llm_response": "Based on your interest in action and superhero themes, I highly recommend..."
}
```

---

## Architecture & Design Decisions

To ensure production-grade stability and fast server boot times, the system architecture uses a decoupled data layer with strict memory mapping:

0. **Data Cleansing & Preprocessing (`src/pipeline/preprocess.py`):** Before building the index, the pipeline automatically cleanses the raw datasets. It removes low-quality entries (e.g., games with < 5 reviews), drops noise (e.g., itch.io self-published prototypes), and computes an enhanced `is_adult` flag using regex across descriptions and themes to catch mislabeled explicit content.
1. **Vector Storage (`faiss_index.bin`):** Uses FAISS Memory Mapping (`faiss.IO_FLAG_MMAP`) to allow the cleansed vector embeddings to stream directly from the SSD rather than loading into RAM.
2. **Metadata Storage (`metadata.db`):** Uses SQLite to store the large text payloads indexed by FAISS IDs. Performs $O(1)$ disk lookups to retrieve item data without holding massive JSON arrays in RAM.
3. **ML Integration:** RAG acts as the orchestrator. It executes the vector search, filters out unwanted content *locally*, and maps its internal domain IDs (`steam_123`, `tmdb_456`) to the ML API formats (`game_123`, `movie_456`). It dynamically expands the ML model's tensors by injecting unknown items via `POST /catalog/add`, then fetches personalized scores from the ML microservice (`http://<ML_HOST>:7749/recommend/rerank`).

---

## Deployment Notes

| Item | Value |
|------|-------|
| **Server start** | `waitress-serve --listen=0.0.0.0:5000 app:app` (Windows) or `gunicorn --bind 0.0.0.0:$PORT --timeout 120 app:app` (Linux) |
| **Environment Variables** | `ML_API_URL` (default: `http://localhost:8000`), `PORT` (default: `5000`), `CLIENT_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL` |
| **Artifacts dir** | `./vector_store/` containing: `faiss_index.bin`, `metadata.db` |
| **Dependencies** | `pip install -r requirements.txt` (requires downloading FAISS, sentence-transformers, spacy) |
| **RAM Requirements** | Serving: ~1GB RAM. Building Index: Minimum 8GB RAM + Optional CUDA GPU. |
| **Run tests** | `python src/tests/run_retrieval.py ; python src/tests/evaluate_metrics.py ; python src/tests/plot_results.py` |

---

## Testing & Evaluation

The RAG pipeline comes with an automated testing suite that evaluates 100 realistic queries across multiple criteria:
- **Format Adherence**: Ensuring the results strictly match requested media types (e.g. "games only" vs "movies only").
- **Domain Diversity**: Checking that mixed queries retrieve a balanced mix of games and movies.
- **Thematic Lexical Overlap**: A proxy for relevance that scores the match between query terms and retrieved item keywords.

Running the test suite generates raw results and renders evaluation charts inside the `evaluation/` directory, including:
- `100_realistic_tests.txt`: Human-readable retrieval results.
- `evaluation_report.json`: Aggregated metrics.
- Output visualizations (histograms and pie charts).

---

## FAQ

**Q: What happens if the ML API is offline?**
A: The RAG API handles this gracefully. It will catch the connection error, print a warning, and fall back to using the raw semantic distances generated by FAISS, ensuring the LLM still gets context.

**Q: Why do we filter `blocked_genres` locally instead of letting the ML API do it?**
A: Vector databases over-fetch. If we asked FAISS for 5 items, and all 5 were "Horror" games, sending them to the ML API would result in 0 items returning to the user. By filtering locally in `rag.py`, we can keep pulling from the index until we hit `k` safe items, guaranteeing a populated prompt.

**Q: How does `allow_adult` work?**
A: It relies on hard metadata flags (`is_adult`) created during the ETL pipeline (`src/pipeline/preprocess.py`). It explicitly checks native adult tags (like ESRB/Steam mature ratings) **AND** performs regex-based scanning across narratives and themes to identify explicit keywords (e.g., sex, hentai, nsfw). This dual-check prevents semantic search from surfacing explicit content if the user hasn't allowed it, even if the source dataset (like TMDB) failed to flag it.