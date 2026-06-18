# Questro RAG — Endpoint Reference

Base URL (local): `http://localhost:5000`
Base URL (HF Space): `https://bluocaroot-questro-rag.hf.space`

The service exposes a **single endpoint**.

---

## `POST /api/recommend`

Runs a natural-language query through vector search, applies content/genre
filters, optionally re-ranks with the external ML API, builds an LLM prompt,
and (if a Gemini key is configured) returns a generated recommendation.

### Request

`Content-Type: application/json`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | ✅ | — | Natural-language search term. |
| `k` | int | ❌ | `5` | Number of results to return (capped at `50`). |
| `allow_adult` | bool | ❌ | `false` | If `false`, items flagged `is_adult` are filtered out. Accepts `true`/`false` or the strings `"true"`/`"false"`. |
| `blocked_genres` | string[] \| null | ❌ | `null` | Genres/themes to exclude (case-insensitive). |
| `user` | object \| null | ❌ | `null` | User profile. When present, triggers ML re-ranking. See below. |

**`user` object** (all fields optional; passed to the ML rerank API):

| Field | Type | Example |
|-------|------|---------|
| `age` | int | `25` |
| `gender` | string | `"Male"` |
| `profession` | string | `"Student"` |
| `country` | string | `"Egypt"` |
| `movie_genres_fav` / `movie_genres_disliked` | string | `"Action\|Comedy"` |
| `game_genres_fav` / `game_genres_disliked` | string | `"Action\|RPG"` |
| `ratings` | array | `[{"item_id": "game_271590", "stars": 5.0}]` |

#### Example

```bash
curl -X POST https://bluocaroot-questro-rag.hf.space/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "query": "street level superhero detective game",
    "k": 5,
    "allow_adult": false,
    "blocked_genres": ["Horror"],
    "user": { "age": 25, "game_genres_fav": "Action|RPG" }
  }'
```

### Response `200 OK`

```json
{
  "status": "success",
  "query": "street level superhero detective game",
  "retrieved_items": [
    {
      "score": 0.8724,
      "data": {
        "id": "steam_208650",
        "title": "Batman: Arkham Knight",
        "type": "game",
        "themes": "Action, Open World",
        "narrative": "..."
      }
    }
  ],
  "generated_prompt": "You are an expert ... recommendation engine ...",
  "llm_response": "Based on your interest in action and superhero themes ..."
}
```

| Field | Description |
|-------|-------------|
| `status` | `"success"`. |
| `query` | Echo of the request query. |
| `retrieved_items` | Ranked list of `{ score, data }`. `score` is the FAISS distance, or the ML rerank score when a `user` was provided. |
| `generated_prompt` | The full prompt built for the LLM. |
| `llm_response` | Gemini's generated text. If `GEMINI_API_KEY` is unset, this is a placeholder string instead. |

### Status codes

| Code | Body | Meaning |
|------|------|---------|
| `200` | success payload | Request handled. |
| `400` | `{"error": "Missing required field: 'query'"}` | `query` was missing/empty. |
| `503` | `{"status": "initializing", "error": "..."}` | Index still loading (cold start). Retry after a few seconds. |
| `500` | `{"error": "An error occurred during processing: ..."}` | Unexpected server error. |

### Behavior notes

- **Cold start:** the first request after boot may return `503` while the index
  loads in a background thread. Subsequent requests succeed once ready.
- **ML API fallback:** if the rerank call (`ML_API_URL`) fails or is unset, the
  service falls back to raw FAISS scores — the request still succeeds.
- **Gemini optional:** without `GEMINI_API_KEY`, `retrieved_items` and
  `generated_prompt` are still returned; only `llm_response` is a placeholder.
- **CORS:** browser calls are restricted to the origin in `CLIENT_URL`
  (default `http://localhost:3000`). Non-browser clients (curl, server-to-server)
  are unaffected.
