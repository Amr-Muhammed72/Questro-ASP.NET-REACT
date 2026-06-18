# Questro Recommender API — Integration Guide (improved_8)

> **Engine generation**: `improved_8` (architecture file `cl_epidtn_recommender_improved_8.py`, artifacts dir `artifacts_improved8/`, checkpoint `improved_8epochs.pt`)
> **Runtime `model_version`**: `improved_8` (echoed in every response)
> **Base URL**: `http://<ML_HOST>:7749`
> **Protocol**: REST / JSON (FastAPI)
> **Auth**: None (internal network only)

---

## Quick Start

```bash
# Start the server
uvicorn recommender_api_improved8:app --host 0.0.0.0 --port 7749

# Health check
curl http://localhost:7749/health

# Get recommendations (star ratings)
curl -X POST http://localhost:7749/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "ratings": [
        {"item_id": "game_271590", "title": "Grand Theft Auto V", "stars": 5.0},
        {"item_id": "movie_155", "title": "The Dark Knight", "stars": 4.5}
      ]
    },
    "k": 10,
    "domain": "game",
    "blocked_genres": ["Horror", "War"]
  }'
```

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness + model-loaded status |
| `GET` | `/genres` | List blockable genres/tags (for the parental-controls UI) |
| `POST` | `/recommend` | Personalised recommendations with pagination + genre blocking |
| `POST` | `/recommend/rerank` | Re-rank a RAG-fetched candidate list (RAG tool) |
| `POST` | `/catalog/add` | Hot-add cold-start items at runtime |
| `POST` | `/admin/reload` | Reload artifacts from disk (clears hot-added items) |

---

### 1. `GET /health`

Health check — verify the model is loaded before sending requests.

**Response:**

```json
{
  "status": "ok",
  "model_loaded": true,
  "n_items": 138541,
  "n_genres_tracked": 138541,
  "text_index_loaded": true,
  "model_version": "improved_8",
  "hot_added_count": 0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Always `"ok"` when the server responds |
| `model_loaded` | `bool` | `false` during startup — wait until `true` |
| `n_items` | `int` | Total items in catalog (movies + games) |
| `n_genres_tracked` | `int` | Items with genre/tag data for blocking |
| `text_index_loaded` | `bool` | Whether text embeddings are available (enhances quality) |
| `model_version` | `string` | Engine version string (`"improved_8"`) |
| `hot_added_count` | `int` | Items added at runtime via `/catalog/add` since the last load |

---

### 2. `POST /recommend`

**The main endpoint.** Send a user profile and get personalised, genre-filtered recommendations with pagination.

#### Request Body

```json
{
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
      {"item_id": "game_271590", "title": "Grand Theft Auto V", "type": "game", "rating": "5 Stars"},
      {"item_id": "movie_155", "title": "The Dark Knight", "stars": 4.5},
      {"item_id": "movie_680", "source": "wishlist"},
      {"item_id": "game_99999", "source": "ignore"}
    ]
  },
  "k": 10,
  "offset": 0,
  "domain": "movie",
  "blocked_genres": ["Horror", "Crime"]
}
```

#### User Profile Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `age` | `int` | No | User's age (1–120) |
| `gender` | `string` | No | Gender |
| `profession` | `string` | No | Profession / occupation |
| `country` | `string` | No | Country |
| `movie_genres_fav` | `string` | No | Pipe-separated favourite movie genres |
| `movie_genres_disliked` | `string` | No | Pipe-separated disliked movie genres |
| `game_genres_fav` | `string` | No | Pipe-separated favourite game genres |
| `game_genres_disliked` | `string` | No | Pipe-separated disliked game genres |
| `ratings` | `RatingItem[]` | ✅ Yes | At least 1 rating (see below) |

#### Rating Item Fields

Each item in `ratings` supports **three input modes** — use whichever is convenient:

| Field | Type | Description |
|-------|------|-------------|
| `item_id` | `string` | **Required.** Format: `"movie_{id}"`, `"movie:{id}"`, `"game_{id}"`, or `"game:{id}"` |
| `title` | `string` | Optional, for logging |
| `type` | `"movie" \| "game"` | Optional domain hint (inferred from `item_id` prefix if omitted) |
| `rating` | `string` | **Mode 1**: Survey label (see table below) |
| `stars` | `float` | **Mode 2**: Numeric rating 1.0–5.0 |
| `source` | `string` | **Mode 3**: `"rating"`, `"wishlist"`, or `"ignore"` |

#### Rating Labels Reference

| Label | Numeric Equivalent | Weight |
|-------|--------------------|--------|
| `"5 Stars"` | 5.0 | +1.0 |
| `"4 Stars"` | 4.0 | +0.5 |
| `"Didn't watch but would watch"` | 3.5 | +0.25 |
| `"Didn't play but would play"` | 3.5 | +0.25 |
| `"3 Stars"` | 3.0 | 0.0 |
| `"2 Stars"` | 2.0 | −0.5 |
| `"Didn't watch and wouldn't watch"` | 1.5 | −0.75 |
| `"Didn't play and wouldn't play"` | 1.5 | −0.75 |
| `"1 Star"` | 1.0 | −1.0 |

> Numeric `stars` are mapped with `weight = clamp((stars − 3) / 2, −1, 1)`. An item with no `rating`, `stars`, or `source` defaults to a mild positive (+0.25).

#### Source Signals

| `source` value | Meaning | Equivalent Label |
|---|---|---|
| `"wishlist"` | User saved / wishlisted the item | "Didn't watch but would watch" (+0.25) |
| `"ignore"` | User blocked / ignored the item | "Didn't watch and wouldn't watch" (−0.75) |
| `"rating"` or `null` | Normal rating — uses `rating` or `stars` field | — |

#### Request Parameters

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `k` | `int` | No | `10` | Results per page (1–100) |
| `offset` | `int` | No | `0` | Pagination offset. Page 1 = 0, page 2 = k, etc. |
| `domain` | `string \| null` | No | `null` | `"movie"`, `"game"`, or `null` for cross-domain |
| `blocked_genres` | `string[] \| null` | No | `null` | Genres/tags to exclude (case-insensitive) |

#### Response Body

```json
{
  "count": 10,
  "total_available": 85,
  "domain": "movie",
  "offset": 0,
  "k": 10,
  "recommendations": [
    {
      "item_id": 157336,
      "item_key": "movie:157336",
      "title": "Interstellar (2014)",
      "domain": "movie",
      "score": 0.872451
    }
  ],
  "signals_used": 3,
  "blocked_genres": ["crime", "horror"],
  "model_version": "improved_8",
  "has_more": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `count` | `int` | Items in this page |
| `total_available` | `int` | Total results available (after genre filtering) |
| `domain` | `string \| null` | Echoes the requested domain filter |
| `offset` | `int` | Current offset |
| `k` | `int` | Requested page size |
| `has_more` | `bool` | `true` if more pages exist beyond this one |
| `recommendations[].item_id` | `int \| null` | **Backend provider ID: TMDB ID for movies, RAWG ID for games.** `null` if the catalog row has no provider ID. |
| `recommendations[].item_key` | `string` | Internal key: `movie:{id}` or `game:{id}` |
| `recommendations[].title` | `string` | Human-readable title |
| `recommendations[].domain` | `string` | `"movie"` or `"game"` |
| `recommendations[].score` | `float` | Relevance score, rounded to 6 dp (higher = better) |
| `signals_used` | `int` | How many submitted ratings mapped to the catalog |
| `blocked_genres` | `string[]` | Genres that were blocked (lowercased) |
| `model_version` | `string` | `"improved_8"` |

> **Resolve display data from `item_id`** (the TMDB/RAWG provider ID) against your own Movies/Games tables. Use `item_key` only when you need the model's internal identifier.

> **Pagination example:**
> - Page 1: `{"k": 10, "offset": 0}` → items 1–10
> - Page 2: `{"k": 10, "offset": 10}` → items 11–20
> - Stop when `has_more` is `false`

---

### 3. `POST /recommend/rerank` — RAG Tool

**Re-rank a pre-fetched candidate list** using the recommender model. Use this as a tool in your RAG pipeline.

#### Workflow

```
1. RAG retrieves a broad list of candidate items (e.g. "top 50 sci-fi games")
2. POST them to /recommend/rerank with the user's profile
3. The recommender scores each candidate against the user's taste
4. Items are returned ranked by personalised relevance
5. Blocked genres are filtered out; the user's own history items are removed
```

#### Request Body

```json
{
  "user": {
    "ratings": [
      {"item_id": "game_271590", "stars": 5.0},
      {"item_id": "movie_155", "stars": 4.0}
    ]
  },
  "candidate_items": [
    {"item_id": "game_1091500", "title": "Cyberpunk 2077"},
    {"item_id": "game_292030", "title": "The Witcher 3"},
    {"item_id": "game_374320", "title": "Dark Souls III"},
    {"item_id": "movie_27205", "title": "Inception"}
  ],
  "blocked_genres": ["Horror"],
  "k": 3
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `user` | `UserProfile` | ✅ Yes | — | Same user profile as `/recommend` |
| `candidate_items` | `CandidateItem[]` | ✅ Yes | — | Items to score (at least 1) |
| `candidate_items[].item_id` | `string` | ✅ Yes | — | `"movie_{id}"` / `"movie:{id}"` / `"game_{id}"` / `"game:{id}"` |
| `candidate_items[].title` | `string` | No | — | Optional title |
| `blocked_genres` | `string[] \| null` | No | `null` | Genres/tags to block |
| `k` | `int \| null` | No | `null` | Max results. `null` = return all ranked |

#### Response Body

```json
{
  "count": 3,
  "recommendations": [
    {"item_id": 1091500, "item_key": "game:1091500", "title": "Cyberpunk 2077", "domain": "game", "score": 0.91},
    {"item_id": 292030, "item_key": "game:292030", "title": "The Witcher 3", "domain": "game", "score": 0.87},
    {"item_id": 27205, "item_key": "movie:27205", "title": "Inception", "domain": "movie", "score": 0.83}
  ],
  "signals_used": 2,
  "candidates_submitted": 4,
  "candidates_matched": 4,
  "blocked_genres": ["horror"],
  "model_version": "improved_8"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `count` | `int` | Final results after filtering |
| `recommendations[]` | `object[]` | Same shape as `/recommend` (`item_id`, `item_key`, `title`, `domain`, `score`) |
| `signals_used` | `int` | User ratings that mapped to the catalog |
| `candidates_submitted` | `int` | How many candidates you sent |
| `candidates_matched` | `int` | How many were found in the model catalog |
| `blocked_genres` | `string[]` | Genres that were blocked (lowercased) |
| `model_version` | `string` | `"improved_8"` |

> **Graceful FAISS fallback.** If none of the candidates can be scored by the model — e.g. they are all hot-added items whose indices fall outside the trained embedding range, or a transient CUDA error occurs during scoring — the endpoint returns `count: 0` with an empty `recommendations` list **instead of erroring**. The RAG pipeline should treat an empty rerank result as "fall back to the original FAISS similarity order."

---

### 4. `POST /catalog/add` — Hot-Add Items

**Register new items into the running catalog dynamically**, so the recommender can score items it has never been trained on. Ideal for newly released titles or dynamic RAG pipelines.

#### Workflow

```
1. RAG retrieves items from an external DB the ML model wasn't trained on
2. POST the missing items to /catalog/add with metadata/text
3. The server expands its tensors and (if sentence-transformers is installed and a
   text index is loaded) computes text embeddings so the items can be scored (0-shot)
4. The items can now be returned by /recommend or /recommend/rerank
```

#### Request Body

```json
{
  "items": [
    {
      "item_id": "game_1091500",
      "title": "Cyberpunk 2077",
      "domain": "game",
      "description": "An open-world, action-adventure story set in Night City...",
      "genres": "Action|RPG",
      "tags": "sci-fi|open world|cyberpunk",
      "provider_id": 1091500
    }
  ]
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `items` | `CatalogNewItem[]` | ✅ Yes | — | 1–500 items per request |
| `items[].item_id` | `string` | ✅ Yes | — | `"movie_{id}"` / `"movie:{id}"` / `"game_{id}"` / `"game:{id}"` |
| `items[].title` | `string` | ✅ Yes | — | Human-readable title |
| `items[].domain` | `"movie" \| "game" \| null` | No | inferred from `item_id` | Optional domain override |
| `items[].description` | `string` | No | `""` | Synopsis (used for text embedding) |
| `items[].genres` | `string` | No | `""` | Pipe- or comma-separated genres, e.g. `"Action\|RPG"` |
| `items[].tags` | `string` | No | `""` | Pipe- or comma-separated tags |
| `items[].provider_id` | `int \| null` | No | `null` | TMDB ID for movies, RAWG ID for games — surfaced as `item_id` in later responses |

#### Response Body

```json
{
  "added": ["game:1091500"],
  "already_exists": [],
  "failed": {},
  "n_items": 138542,
  "text_index_updated": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `added` | `string[]` | Internal keys (`domain:id`) that were registered this call |
| `already_exists` | `string[]` | Keys that were already in the catalog (skipped) |
| `failed` | `object` | Map of `item_id` → error reason for items that could not be added |
| `n_items` | `int` | Total catalog size after the operation |
| `text_index_updated` | `bool` | `true` if text embeddings were computed and written for the new items |

> **Notes.** Hot-added items are **runtime-only** — they are cleared on `/admin/reload` or a server restart. They start with zero *learned* collaborative embeddings and rank primarily through text similarity, which requires `sentence-transformers` to be installed and a text index to be loaded; otherwise `text_index_updated` is `false`. Items whose new index exceeds the model's trained embedding bounds are kept in the catalog (and still visible to FAISS/RAG) but are skipped by the model's scoring path in `/recommend/rerank`.

---

### 5. `GET /genres`

List all genres/tags available for blocking. Use this to populate the parental-controls UI.

**Response:**

```json
{
  "genres": ["action", "adventure", "animation", "comedy", "crime", "documentary", "drama", "fantasy", "horror", "indie", "mystery", "rpg", "racing", "romance", "sci-fi", "shooter", "simulation", "sports", "strategy", "thriller", "war", "western"]
}
```

> All genres are **lowercased** and limited to tokens longer than 2 characters. When sending `blocked_genres`, any casing works — the API normalises everything to lowercase.

---

### 6. `POST /admin/reload`

Reload all on-disk artifacts (model, indices, metadata). **Runtime hot-added items are intentionally cleared** so the server returns to the persisted artifact state.

**Response:**

```json
{
  "status": "ok",
  "n_items": 138541,
  "text_index_loaded": true,
  "hot_added_count": 0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | `"ok"` on success |
| `n_items` | `int` | Catalog size after reload |
| `text_index_loaded` | `bool` | Whether text embeddings were reloaded |
| `hot_added_count` | `int` | Reset to `0` after reload |

---

## How Recommendations Are Scored

A few behaviours are worth knowing when integrating:

- **Over-fetch before filtering.** When `blocked_genres` is set, the engine fetches `OVERFETCH_MULTIPLIER` × more candidates (default **5×**) before applying genre filtering, so a full page of `k` results is still returned after blocked items are removed.
- **Title-family franchise boost.** For profiles seeded with a clear franchise (e.g. *Grand Theft Auto V*), the engine adds extra same-franchise candidates and applies a score boost (`TITLE_FAMILY_BOOST`, default **0.40**) so obvious franchise neighbours rank ahead of generic genre matches. Version/edition words ("Remastered", "GOTY", roman numerals, …) are stripped so sequels still match.
- **History exclusion.** In `/recommend/rerank`, candidates already present in the user's rating history are dropped before scoring.
- **Cold-start text scoring.** Hot-added items are embedded with a lightweight sentence encoder (`all-MiniLM-L6-v2`) so they can be scored by content similarity even though they have no learned collaborative vector.

---

## Integration Guide

### Mapping Your IDs to the API

| Your Database | API `item_id` format | Example |
|---|---|---|
| Movie (TMDB ID) | `"movie_{TMDB_Id}"` | `"movie_155"` |
| Movie (MovieLens ID) | `"movie_{movieId}"` | `"movie_1199"` |
| Game (Steam App ID) | `"game_{app_id}"` | `"game_271590"` |

> Responses return the provider ID in the `item_id` field — **TMDB ID for movies, RAWG ID for games** — alongside the internal `item_key`.

### Converting Your Signals to API Ratings

| User Action in Your App | API Rating |
|---|---|
| Rated 1–5 stars | `{"item_id": "...", "stars": 4.0}` |
| Liked | `{"item_id": "...", "stars": 4.0}` |
| Watched / Played | `{"item_id": "...", "stars": 4.0}` |
| Wishlisted / Saved | `{"item_id": "...", "source": "wishlist"}` |
| Ignored / Blocked | `{"item_id": "...", "source": "ignore"}` |
| Disliked | `{"item_id": "...", "stars": 1.0}` |

### Parental Controls

Send `blocked_genres` with every request for child accounts. Populate the picker from `GET /genres`.

| Restriction Level | `blocked_genres` |
|---|---|
| Child-safe | `["horror", "crime", "war", "thriller"]` |
| Teen-safe | `["horror"]` |
| No restrictions | `null` or `[]` |

The API guarantees:
- **No item with a blocked genre/tag will appear** in results.
- The **requested `k` items are returned** after filtering (the model over-fetches internally).
- **Case-insensitive** matching: `"Horror"`, `"HORROR"`, `"horror"` are all equivalent.

### Typical Backend Flow

```
1. User opens "For You" page
2. Backend queries its own DB for user's ratings/likes/watches/wishlists/ignores
3. Backend maps each item to {item_id, stars/source}
4. Backend reads the user's parental control settings → blocked_genres
5. Backend POSTs to /recommend with offset=0, k=20
6. Backend receives item_id values (TMDB/RAWG provider IDs)
7. Backend looks up those IDs in its own Movies/Games table
8. Backend returns rich item data (posters, descriptions) to frontend
9. On scroll / "Load More", backend POSTs again with offset=20
```

### RAG Tool Integration

```
1. User asks chatbot: "Recommend me games like Skyrim"
2. RAG retrieves top 50 RPG games from your vector DB
3. (Optional) RAG hot-adds any items missing from the model via /catalog/add
4. RAG calls POST /recommend/rerank with the user profile + 50 candidates
5. API returns the items re-ranked by the user's personal taste
   (empty list ⇒ fall back to the original FAISS order)
6. RAG picks top 5 and formats the response
```

---

## C# Backend Integration Example

```csharp
public class RecommenderClient
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;

    public RecommenderClient(string baseUrl)
    {
        _baseUrl = baseUrl.TrimEnd('/');
        _http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    public async Task<RecommendResponse?> GetRecommendationsAsync(
        UserProfile user,
        int k = 10,
        int offset = 0,
        string? domain = null,
        List<string>? blockedGenres = null)
    {
        var request = new
        {
            user,
            k,
            offset,
            domain,
            blocked_genres = blockedGenres
        };

        var json = JsonSerializer.Serialize(request,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

        var response = await _http.PostAsync(
            $"{_baseUrl}/recommend",
            new StringContent(json, Encoding.UTF8, "application/json"));

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<RecommendResponse>();
    }

    public async Task<RerankResponse?> RerankAsync(
        UserProfile user,
        List<CandidateItem> candidates,
        int? k = null,
        List<string>? blockedGenres = null)
    {
        var request = new
        {
            user,
            candidate_items = candidates,
            k,
            blocked_genres = blockedGenres
        };

        var json = JsonSerializer.Serialize(request,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });

        var response = await _http.PostAsync(
            $"{_baseUrl}/recommend/rerank",
            new StringContent(json, Encoding.UTF8, "application/json"));

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<RerankResponse>();
    }
}

// Each recommendation exposes item_id (TMDB/RAWG provider id), item_key, title, domain, score.
// Usage — recommendations with pagination:
var user = BuildUserProfile(userId);  // your helper
var page1 = await _recommender.GetRecommendationsAsync(
    user, k: 20, offset: 0,
    domain: "movie",
    blockedGenres: userSettings.BlockedGenres);

// Show page1.Recommendations to user...

if (page1.HasMore)
{
    var page2 = await _recommender.GetRecommendationsAsync(
        user, k: 20, offset: 20,
        domain: "movie",
        blockedGenres: userSettings.BlockedGenres);
}

// Usage — RAG reranking:
var ragResults = await _vectorDb.SearchAsync("sci-fi games", top: 50);
var candidates = ragResults.Select(r => new CandidateItem
{
    ItemId = $"game_{r.SteamAppId}",
    Title = r.Title
}).ToList();

var reranked = await _recommender.RerankAsync(
    user, candidates, k: 5,
    blockedGenres: userSettings.BlockedGenres);
```

---

## Error Responses

| Code | When |
|------|------|
| `422` | No ratings provided, all items unmapped, all candidates already in history, invalid rating label, stars out of range |
| `503` | Model / catalog still loading (check `/health` first) |

> Note: an all-unscoreable `/recommend/rerank` request is **not** an error — it returns `200` with `count: 0` so the caller can fall back to FAISS scores.

---

## Deployment Notes

| Item | Value |
|------|-------|
| **Server start** | `uvicorn recommender_api_improved8:app --host 0.0.0.0 --port 7749` |
| **Required files** | `recommender_api_improved8.py`, `cl_epidtn_recommender_improved_8.py` |
| **Artifacts dir** | `./artifacts_improved8/` containing: `improved_8epochs.pt`, `item_index.pt`, `item_to_idx.pkl`, `item_meta.pkl`, `title_lookup.pkl`, `improved_item_text_embeddings.pt` |
| **Dependencies** | `pip install torch fastapi uvicorn pydantic pandas` (plus `sentence-transformers` for cold-start text scoring) |
| **Text encoder** | `sentence-transformers/all-MiniLM-L6-v2` (cold-start hot-add embeddings) |
| **Swagger docs** | `http://<HOST>:7749/docs` (auto-generated) |
| **Cold start time** | ~15–30 seconds (model + text embeddings loading) |
| **Avg response time** | ~50–150ms per request |

### Configurable Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `ARTIFACTS_DIR` | `artifacts_improved8` | Base directory for artifacts |
| `MODEL_CHECKPOINT` | `<dir>/improved_8epochs.pt` | Trained model checkpoint |
| `TEXT_EMBEDDINGS_PATH` | `<dir>/improved_item_text_embeddings.pt` | Optional content embeddings |
| `TEXT_ENCODER_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | Cold-start text encoder |
| `MAX_RECS` | `100` | Hard cap on internal fetch size |
| `OVERFETCH_MULTIPLIER` | `5` | Extra candidates fetched before genre filtering |
| `TITLE_FAMILY_BOOST` | `0.40` | Score boost for same-franchise neighbours |
| `TITLE_FAMILY_EXTRA_CANDIDATES` | `50` | Max extra franchise candidates injected |

---

## FAQ

**Q: What if a user has no ratings yet?**
A: The API requires at least 1 rating. For new users, show popular/trending items until they interact with something, then call `/recommend`.

**Q: What if a submitted item_id isn't in the model catalog?**
A: It's silently skipped. Check `signals_used` in the response — if it's 0, none of the items were found (the endpoint returns `422`).

**Q: Can I mix stars and survey labels in the same request?**
A: Yes. Each rating item is independent. You can use `stars` for some, `rating` labels for others, and `source: "wishlist"/"ignore"` for others.

**Q: How does pagination work?**
A: Set `offset` and `k`. Page 1 = `offset: 0, k: 20`, page 2 = `offset: 20, k: 20`. The `has_more` field tells you if another page exists. `total_available` gives the total count after filtering.

**Q: Are blocked genres guaranteed to be excluded?**
A: Yes. The API over-fetches internally and filters BEFORE paginating, so you always get `k` results (or fewer only if the entire filtered catalog is exhausted).

**Q: Why does `/recommend/rerank` sometimes return an empty list?**
A: When none of the candidates can be scored by the model (all hot-added/out-of-range, or a transient CUDA error). This is intentional — treat it as a signal to keep the RAG's original FAISS ordering.

**Q: Is the API stateless?**
A: User data is stateless — no per-user data is stored server-side. The **catalog** is mutable, though: `/catalog/add` mutates in-memory state until `/admin/reload` or a restart.

**Q: What's the rerank endpoint for?**
A: It's designed as a tool for your RAG/chatbot pipeline. Your RAG retrieves a broad candidate list (e.g. "top 50 RPG games"), and the recommender personalises the ranking for the specific user.
