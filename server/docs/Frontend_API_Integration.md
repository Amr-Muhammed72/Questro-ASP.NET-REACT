# Frontend API Integration (Movies Domain)

This guide is for integrating Discovery, Details, and Interactions in the frontend.

## Base URL

- Local: `http://localhost:5222`
- Movies base path: `/api/movies`
---

## Critical Frontend Note: `movieId` vs `tmdbId`

### Live Discovery behavior

Discovery list endpoints are live/TMDB-driven. Some list items are not persisted locally yet.

- `movieId` can be `0`
- `tmdbId` is the stable identifier you should use to navigate

### Details and Interactions behavior

For these routes, `{id}` means TMDB id.

- `GET /api/movies/{id}`
- `POST /api/movies/{id}/like`
- `POST /api/movies/{id}/rate`
- `POST /api/movies/{id}/watchlist`
- `POST /api/movies/{id}/watched`
- `GET|POST|PUT|DELETE /api/movies/{id}/reviews`

Use `movie.tmdbId` from discovery cards when calling details or interaction routes.

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

`Details` can contain validation errors when applicable.

---

## 1) Discovery Feature

### 1.1 Discover/Search Movies

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

Payload required:

- None (query-string only)

Example response:

```json
{
  "data": [
    {
      "movieId": 0,
      "tmdbId": 155,
      "title": "The Dark Knight",
      "posterUrl": "https://image.tmdb.org/t/p/w500/...",
      "backdropUrl": "https://image.tmdb.org/t/p/w780/...",
      "releaseDate": "2008-07-16T00:00:00",
      "language": "en",
      "mpaCertification": null,
      "popularity": 99.32,
      "tmdbRating": 8.5,
      "tmdbVoteCount": 32000,
      "genres": ["Action", "Crime", "Drama"],
      "staffNames": []
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 10000,
  "totalPages": 500
}
```

Fetch example:

```javascript
const params = new URLSearchParams({
  search: "dark",
  pageIndex: "1",
  pageSize: "20",
  sort: "rating"
});

const res = await fetch(`http://localhost:5222/api/movies?${params}`);
const data = await res.json();

// Always use tmdbId for details/interactions navigation
const tmdbId = data.data[0].tmdbId;
```

### 1.2 Trending

- Method: `GET`
- URL: `/api/movies/trending?take=20`
- Auth: No

Payload required:

- None

Returns `MovieListItemDto[]`.

cURL:

```bash
curl "http://localhost:5222/api/movies/trending?take=20"
```

### 1.3 Recently Added

- Method: `GET`
- URL: `/api/movies/recently-added?take=20`
- Auth: No

Payload required:

- None

Returns `MovieListItemDto[]`.

---

## 2) Details Feature

### 2.1 Movie Details

- Method: `GET`
- URL: `/api/movies/{tmdbId}`
- Auth: Optional

Payload required:

- None

If token is provided, `userStatus` is populated when local movie exists.

Example response:

```json
{
  "movieId": 1023,
  "tmdbId": 155,
  "title": "The Dark Knight",
  "overview": "Batman raises the stakes in his war on crime...",
  "runtime": 152,
  "releaseDate": "2008-07-16T00:00:00",
  "language": "en",
  "posterUrl": "https://image.tmdb.org/t/p/w500/...",
  "backdropUrl": "https://image.tmdb.org/t/p/w780/...",
  "popularity": 99.32,
  "tmdbRating": 8.5,
  "tmdbVoteCount": 32000,
  "imdbId": "tt0468569",
  "trailerUrl": "https://www.youtube.com/watch?v=EXeTwQWrcwY",
  "genres": ["Action", "Crime", "Drama"],
  "cast": [
    {
      "staffId": 801,
      "tmdbId": 3894,
      "name": "Christian Bale",
      "department": "Acting",
      "role": "Bruce Wayne",
      "profileUrl": "https://image.tmdb.org/t/p/w185/..."
    }
  ],
  "crew": [
    {
      "staffId": 802,
      "tmdbId": 525,
      "name": "Christopher Nolan",
      "department": "Directing",
      "role": "Director",
      "profileUrl": "https://image.tmdb.org/t/p/w185/..."
    }
  ],
  "similarMovies": [.....],
  "watchProviders": url,
  "ratingSummary": {
    "average": 4.33,
    "count": 12
  },
  "userStatus": {
    "isLiked": true,
    "isInWatchlist": false,
    "userRating": 4
  }
}
```

Fetch example (with auth):

```javascript
const tmdbId = 155;
const token = localStorage.getItem("accessToken");

const res = await fetch(`http://localhost:5222/api/movies/${tmdbId}`, {
  headers: token ? { Authorization: `Bearer ${token}` } : {}
});

const details = await res.json();
```

---

## 3) Interactions Feature

All interaction endpoints require auth and use TMDB id in route.

### 3.1 Toggle Like

- Method: `POST`
- URL: `/api/movies/{tmdbId}/like`
- Auth: Yes

Payload required:

- None

Response example (`MovieInteractionStatusDto`):

```json
{
  "movieId": 1023,
  "tmdbId": 155,
  "isLiked": true,
  "isInWatchlist": false,
  "userRating": 4
}
```

cURL:

```bash
curl -X POST "http://localhost:5222/api/movies/155/like" \
  -H "Authorization: Bearer <accessToken>"
```

### 3.2 Set Rating

- Method: `POST`
- URL: `/api/movies/{tmdbId}/rate`
- Auth: Yes

Payload required:

```json
{
  "stars": 4
}
```

Response shape: `MovieInteractionStatusDto`.

Fetch:

```javascript
await fetch("http://localhost:5222/api/movies/155/rate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({ stars: 4 })
});
```

### 3.3 Toggle Watchlist

- Method: `POST`
- URL: `/api/movies/{tmdbId}/watchlist`
- Auth: Yes

Payload required:

- None

Response shape: `MovieInteractionStatusDto`.

### 3.4 Mark Watched

- Method: `POST`
- URL: `/api/movies/{tmdbId}/watched`
- Auth: Yes

Payload required:

- None

Response shape: `MovieInteractionStatusDto`.

### 3.5 Reviews (Current User Scoped)

#### List Reviews

- Method: `GET`
- URL: `/api/movies/{tmdbId}/reviews?pageIndex=1&pageSize=20`
- Auth: No

Payload required:

- None

Response example (`PagedResponse<MovieReviewDto>`):

```json
{
  "data": [
    {
      "reviewId": 3,
      "movieId": 1023,
      "tmdbId": 155,
      "userId": 42,
      "userName": "amr_user",
      "body": "Updated review body from frontend.",
      "sentiment": null,
      "timestamp": "2026-04-17T19:41:12.713Z"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
}
```

#### Add Review

- Method: `POST`
- URL: `/api/movies/{tmdbId}/reviews`
- Auth: Yes

Payload required:

```json
{
  "body": "Great pacing and strong performances."
}
```

Response shape: `MovieReviewDto`.

#### Update Review

- Method: `PUT`
- URL: `/api/movies/{tmdbId}/reviews`
- Auth: Yes

Payload required:

```json
{
  "body": "Updated review after rewatch."
}
```

Response shape: `MovieReviewDto`.

#### Delete Review

- Method: `DELETE`
- URL: `/api/movies/{tmdbId}/reviews`
- Auth: Yes

Payload required:

- None

Response example:

```json
{
  "deleted": true
}
```

Review fetch example:

```javascript
const tmdbId = 155;

const createRes = await fetch(`http://localhost:5222/api/movies/${tmdbId}/reviews`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({ body: "Great pacing and strong performances." })
});

const created = await createRes.json();
```

---

## Quick Integration Checklist

1. Always route by `tmdbId`, not `movieId`, from list cards.
2. Expect `movieId` to be `0` in live discovery results.
3. Send bearer token on all interaction endpoints.
4. Handle standard error envelope (`code`, `en`, `Details`).
5. Treat reviews as one-per-user-per-movie (update existing instead of creating duplicates).
