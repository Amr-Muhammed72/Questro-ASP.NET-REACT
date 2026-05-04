# Frontend API Integration (Movies Domain)

This guide is for integrating Discovery, Details, and Interactions in the frontend.

- Discovery and details: `/api/movies`
- Interactions: `/api/movie-interactions`
- Reviews: `/api/movie-reviews`
- Explicit sync: `/api/movie-sync`
- Staff: `/api/staff`

## Base URL

- Local: `http://localhost:5222`

## Route Map (Quick Reference)

### Movies routes

- `GET /api/movies`
- `GET /api/movies/trending?take=20`
- `GET /api/movies/recently-added?take=20`
- `GET /api/movies/genres`
- `GET /api/movies/recommended?take=20`
- `GET /api/movies/recommended-for-me?take=20` (auth)
- `GET /api/movies/{tmdbId}`

### Interaction routes (auth required)

- `POST /api/movie-interactions/{tmdbId}/like`
- `POST /api/movie-interactions/{tmdbId}/rate`
- `POST /api/movie-interactions/{tmdbId}/watchlist`
- `POST /api/movie-interactions/{tmdbId}/watched`

### Review routes

- `GET /api/movie-reviews/{tmdbId}?pageIndex=1&pageSize=20`
- `POST /api/movie-reviews/{tmdbId}` (auth)
- `PUT /api/movie-reviews/{tmdbId}` (auth)
- `DELETE /api/movie-reviews/{tmdbId}` (auth)

### Sync and staff routes

- `POST /api/movie-sync/{tmdbId}`
- `GET /api/staff/{tmdbId}`

---

## Critical Frontend Note: `movieId` vs `tmdbId`

Discovery list endpoints are live/TMDB-driven. Some list items are not persisted locally yet.

- `movieId` can be `0`
- `tmdbId` is the stable route identifier for details, interactions, reviews, sync, and staff

Always pass `movie.tmdbId` from cards/lists into route params.

---

### ⚠️ CRITICAL: Search vs. Discover Modes (UI/UX Guidelines)

Because movie and game data is sourced from TMDB and RAWG, there is a strict separation between text search and filter-based discovery. This applies to both `GET /api/movies` and `GET /api/games`.

1) The limitation

- TMDB and RAWG text search endpoints do not honor filters like rating, year, or genre.
- TMDB and RAWG discover endpoints support filters (rating, year, genre, language), but they do not support free-text search.

2) Frontend rule (must follow)

- Do NOT send `search` together with `minRating`, `maxRating`, `genreId`, or `year`.

3) UI/UX recommendation

- Search Mode: a simple text bar only. When the user types, disable all filters.
- Explore/Discover Mode: advanced filter UI (ratings, genres, years) with no free-text search bar.

This separation prevents broken pagination and unexpected empty pages.

---

## Error Envelope (All Features)

On failure, APIs return:

```json
{
  "code": "Movie.InvalidTmdbId",
  "en": "TMDB id must be greater than zero.",
  "Details": null
}
```

`Details` may include validation details.

---

## 1) Discovery

### 1.1 Discover and Search Movies

- Method: `GET`
- URL: `/api/movies`
- Auth: No

Query params (all optional unless noted):

- `search`
- `genreId`
- `language`
- `year`
- `minRating`
- `maxRating`
- `quality`
- `sort`
- `pageIndex` (default 1)
- `pageSize` (default 20)

Example:

```javascript
const params = new URLSearchParams({
  search: "dark",
  pageIndex: "1",
  pageSize: "20",
  sort: "rating"
});

const res = await fetch(`http://localhost:5222/api/movies?${params}`);
const data = await res.json();
const tmdbId = data.data[0].tmdbId;
```

### 1.2 Trending

- Method: `GET`
- URL: `/api/movies/trending?take=20`
- Auth: No

### 1.3 Recently Added

- Method: `GET`
- URL: `/api/movies/recently-added?take=20`
- Auth: No

### 1.4 Genres

- Method: `GET`
- URL: `/api/movies/genres`
- Auth: No

### 1.5 Recommended

- Method: `GET`
- URL: `/api/movies/recommended?take=20`
- Auth: No

### 1.6 Recommended For Me

- Method: `GET`
- URL: `/api/movies/recommended-for-me?take=20`
- Auth: Yes

Current behavior is intentionally temporary: it returns the same generic recommendation strategy as `recommended` until the ML flow is finalized.

---

## 2) Details and Staff

### 2.1 Movie Details

- Method: `GET`
- URL: `/api/movies/{tmdbId}`
- Auth: Optional

If token is provided, `userStatus` is included when local user interaction rows exist.

### 2.2 Staff Details

- Method: `GET`
- URL: `/api/staff/{tmdbId}`
- Auth: No

---

## 3) Interactions

All interaction endpoints require auth and use TMDB id in route.

### 3.1 Toggle Like

- Method: `POST`
- URL: `/api/movie-interactions/{tmdbId}/like`

### 3.2 Set Rating

- Method: `POST`
- URL: `/api/movie-interactions/{tmdbId}/rate`

Payload:

```json
{
  "stars": 4
}
```

### 3.3 Toggle Watchlist

- Method: `POST`
- URL: `/api/movie-interactions/{tmdbId}/watchlist`

### 3.4 Mark Watched

- Method: `POST`
- URL: `/api/movie-interactions/{tmdbId}/watched`

Response shape for all four endpoints: `MovieInteractionStatusDto`.

---

## 4) Reviews

### 4.1 List Reviews

- Method: `GET`
- URL: `/api/movie-reviews/{tmdbId}?pageIndex=1&pageSize=20`
- Auth: No

### 4.2 Add Review

- Method: `POST`
- URL: `/api/movie-reviews/{tmdbId}`
- Auth: Yes

Payload:

```json
{
  "body": "Great pacing and strong performances."
}
```

### 4.3 Update Review

- Method: `PUT`
- URL: `/api/movie-reviews/{tmdbId}`
- Auth: Yes

### 4.4 Delete Review

- Method: `DELETE`
- URL: `/api/movie-reviews/{tmdbId}`
- Auth: Yes

Delete response:

```json
{
  "deleted": true
}
```

---

## 5) Explicit Sync

Use this endpoint when you explicitly want to hydrate/persist a movie from TMDB.

- Method: `POST`
- URL: `/api/movie-sync/{tmdbId}`
- Auth: No

Example:

```bash
curl -X POST "http://localhost:5222/api/movie-sync/155"
```

---

## Quick Integration Checklist

1. Always route by `tmdbId`, not `movieId`, from list cards.
2. Expect `movieId` to be `0` in live discovery results.
3. Send bearer token on all interaction endpoints.
4. Handle standard error envelope (`code`, `en`, `Details`).
5. Treat reviews as one-per-user-per-movie (update existing instead of creating duplicates).
