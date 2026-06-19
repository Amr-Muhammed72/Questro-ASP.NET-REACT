# Questro Recommender API (improved_8) — Endpoint Reference

CL-EPIDTN personalised recommendation engine with parental-control genre
blocking, pagination, runtime catalog hot-add, and a RAG reranking tool.

- **Base URL:** `https://zeyadgamal00-questro-model-api.hf.space`
- **Interactive docs (auto-generated):** [`/docs`](https://zeyadgamal00-questro-model-api.hf.space/docs) (Swagger UI) · [`/redoc`](https://zeyadgamal00-questro-model-api.hf.space/redoc)
- **Content type:** `application/json`
- **CORS:** all origins allowed (`*`).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness + model-loaded status. |
| GET | `/genres` | List all blockable genres/tags. |
| POST | `/recommend` | Personalised recommendations (paginated). |
| POST | `/recommend/rerank` | Re-rank a RAG-supplied candidate list. |
| POST | `/catalog/add` | Hot-add cold-start items at runtime. |
| POST | `/admin/reload` | Reload artifacts from disk. |

---

## Shared objects

### `UserProfile`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `age` | int | ❌ | 1–120. |
| `gender`, `profession`, `country` | string | ❌ | Survey fields. |
| `movie_genres_fav` / `movie_genres_disliked` | string | ❌ | Pipe-separated, e.g. `"Action\|Comedy"`. |
| `game_genres_fav` / `game_genres_disliked` | string | ❌ | Pipe-separated. |
| `ratings` | `RatingItem[]` | ✅ | **At least 1 item.** Interaction history. |

### `RatingItem`

Provide **one** of `rating` (survey label) or `stars` (numeric), or use `source`.

| Field | Type | Notes |
|-------|------|-------|
| `item_id` | string | `"movie_123"`, `"movie:123"`, `"game_123"`, or `"game:123"`. |
| `title` | string? | Optional, logging only. |
| `type` | `"movie"`\|`"game"`? | Inferred from `item_id` prefix if omitted. |
| `rating` | string? | Survey label: `"5 Stars"`…`"1 Star"`, `"Didn't watch but would watch"`, `"Didn't play but would play"`, `"Didn't watch and wouldn't watch"`, `"Didn't play and wouldn't play"`. |
| `stars` | float? | 1.0–5.0. Alternative to `rating`. |
| `source` | `"rating"`\|`"wishlist"`\|`"ignore"`? | `wishlist` → treated as "would watch/play"; `ignore` → "wouldn't watch/play". |

### `RecommendationItem` (response element)

| Field | Type | Notes |
|-------|------|-------|
| `item_id` | int? | Provider ID — TMDB for movies, RAWG for games (null if unknown). |
| `item_key` | string | Internal key, e.g. `"movie:123"`. |
| `title` | string | |
| `domain` | `"movie"`\|`"game"` | |
| `score` | float | Personalised relevance (higher = better). |

---

## `GET /health`

Verify the model is loaded before sending requests.

**Response `200`**
```json
{
  "status": "ok",
  "model_loaded": true,
  "n_items": 48213,
  "n_genres_tracked": 48213,
  "text_index_loaded": true,
  "model_version": "improved_8",
  "hot_added_count": 0
}
```

---

## `GET /genres`

Returns every unique blockable genre/tag (lowercased, sorted) — use it to
populate a parental-controls UI.

**Response `200`**
```json
{ "genres": ["action", "adventure", "comedy", "horror", "..."] }
```

---

## `POST /recommend`

Personalised, genre-filtered recommendations with pagination. Returns exactly
`k` items (or fewer if exhausted) **after** genre filtering.

### Request

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `user` | `UserProfile` | — | **Required.** |
| `domain` | `"movie"`\|`"game"`? | `null` | Omit for cross-domain. |
| `k` | int | `10` | 1–100. Page size. |
| `offset` | int | `0` | Pagination: page 1 = 0, page 2 = `k`, … |
| `blocked_genres` | string[]? | `null` | Case-insensitive. |

```bash
curl -X POST https://zeyadgamal00-questro-model-api.hf.space/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "age": 25,
      "game_genres_fav": "Action|RPG",
      "ratings": [{"item_id": "game_271590", "stars": 5.0}]
    },
    "domain": "game",
    "k": 10,
    "offset": 0,
    "blocked_genres": ["Horror"]
  }'
```

### Response `200`
```json
{
  "count": 10,
  "total_available": 87,
  "domain": "game",
  "offset": 0,
  "k": 10,
  "recommendations": [
    { "item_id": 271590, "item_key": "game:271590", "title": "Grand Theft Auto V", "domain": "game", "score": 0.9123 }
  ],
  "signals_used": 1,
  "blocked_genres": ["horror"],
  "model_version": "improved_8",
  "has_more": true
}
```

---

## `POST /recommend/rerank`

Score and re-rank a candidate list (e.g. from the RAG vector search) against the
user's profile. Candidates already in the user's history are dropped; hot-added
items outside the trained range are skipped (the caller should fall back to its
own scores for those).

### Request

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `user` | `UserProfile` | — | **Required.** |
| `candidate_items` | `CandidateItem[]` | — | **Required, ≥1.** Each: `{ "item_id": "...", "title": "..."? }`. |
| `blocked_genres` | string[]? | `null` | Case-insensitive. |
| `k` | int? | `null` | Max items to return; null = all candidates ranked. |

```bash
curl -X POST https://zeyadgamal00-questro-model-api.hf.space/recommend/rerank \
  -H "Content-Type: application/json" \
  -d '{
    "user": { "ratings": [{"item_id": "game_271590", "stars": 5.0}] },
    "candidate_items": [
      {"item_id": "game_208650", "title": "Batman: Arkham Knight"},
      {"item_id": "movie_155", "title": "The Dark Knight"}
    ],
    "k": 5
  }'
```

### Response `200`
```json
{
  "count": 2,
  "recommendations": [
    { "item_id": 208650, "item_key": "game:208650", "title": "Batman: Arkham Knight", "domain": "game", "score": 0.88 }
  ],
  "signals_used": 1,
  "candidates_submitted": 2,
  "candidates_matched": 2,
  "blocked_genres": [],
  "model_version": "improved_8"
}
```

---

## `POST /catalog/add`

Register new (cold-start) items at runtime without retraining. Hot-added items
get zero learned embeddings but can rank via text similarity when text
embeddings are loaded. **Runtime-only** — cleared on `/admin/reload` or restart.

### Request

`{ "items": CatalogNewItem[] }` — 1–500 items. Each `CatalogNewItem`:

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `item_id` | string | — | `"movie_123"` / `"game_123"` (or `:`). |
| `title` | string | — | **Required.** |
| `domain` | `"movie"`\|`"game"`? | `null` | Inferred from `item_id` if omitted. |
| `description` | string | `""` | |
| `genres` | string | `""` | Pipe/comma-separated. |
| `tags` | string | `""` | Pipe/comma-separated. |
| `provider_id` | int? | `null` | TMDB (movies) or RAWG (games). |

### Response `200`
```json
{
  "added": ["game:999999"],
  "already_exists": [],
  "failed": {},
  "n_items": 48214,
  "text_index_updated": true
}
```

---

## `POST /admin/reload`

Reload all on-disk artifacts. Runtime hot-added items are intentionally cleared.

**Response `200`**
```json
{ "status": "ok", "n_items": 48213, "text_index_loaded": true, "hot_added_count": 0 }
```

---

## Error responses

| Code | When |
|------|------|
| `422` | Validation error, or none of the supplied items/candidates are in the catalog. |
| `503` | Model not loaded yet (cold start) — retry shortly. |

Errors use FastAPI's standard shape: `{ "detail": "<message>" }`.
