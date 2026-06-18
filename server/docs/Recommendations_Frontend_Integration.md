# Recommendations API - Frontend Integration

This document covers the two personalized recommendation endpoints currently exposed for the frontend:

- `GET /api/Games/recommended-for-me`
- `GET /api/movies/recommended-for-me`

Both endpoints require a logged-in user. The backend reads the user id from the bearer token, then sends profile and interaction signals to the recommender service.

## Shared Rules

| Item | Details |
|---|---|
| Base URL | `{host}` |
| Auth | Required |
| Header | `Authorization: Bearer <token>` |
| Query param | `take`, optional positive integer |
| Default `take` | `20` |
| User id | Never send it from the frontend. It is extracted from the JWT. |

If the user is not authenticated, the API returns `401 Unauthorized`.

Failure responses use this envelope:

```json
{
  "code": "Movie.TrendingUnavailable",
  "en": "Trending movies are currently unavailable.",
  "Details": null
}
```

## 1. Games Recommended For Me

| Item | Details |
|---|---|
| Method | `GET` |
| URL | `/api/Games/recommended-for-me` |
| Auth | Required |
| Query | `take` |
| Response | `PagedResponse<GameListItemDto>` |

Example request:

```http
GET /api/Games/recommended-for-me?take=20
Authorization: Bearer <token>
```

Example response:

```json
{
  "data": [
    {
      "gameId": 12,
      "rawgId": 3498,
      "title": "Grand Theft Auto V",
      "rating": 4.47,
      "releaseDate": "2013-09-17T00:00:00",
      "posterUrl": "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg",
      "trailerUrl": null,
      "genres": [
        { "id": 4, "name": "Action" }
      ],
      "platforms": [
        { "id": 4, "name": "PC" }
      ]
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
}
```

### Game Response Fields

| Field | Type | Notes |
|---|---|---|
| `data` | `GameListItemDto[]` | Recommended game cards. |
| `gameId` | `int` | Local database id. This endpoint returns locally mapped games. |
| `rawgId` | `int?` | Use this for game details navigation. |
| `title` | `string` | Game title. |
| `rating` | `number?` | RAWG rating. |
| `releaseDate` | `string?` | ISO date string. |
| `posterUrl` | `string?` | Game artwork URL. |
| `trailerUrl` | `string?` | Usually null for this endpoint. |
| `genres` | `{ id, name }[]` | Game genres. |
| `platforms` | `{ id, name }[]` | Game platforms. |

### Game Backend Behavior

The backend builds recommendations from:

- User profile fields such as age, gender, profession, country, favorite genres, and disliked genres.
- Recent game ratings.
- Recent game wishlist entries.
- Blocked game genres for child accounts.

If the recommender service fails, returns no items, or returns items that cannot be mapped to local games, the endpoint falls back to trending games.

Frontend note: read game cards from `response.data`, not directly from the root response.

```javascript
async function getGameRecommendations(token, take = 20) {
  const res = await fetch(`${BASE_URL}/api/Games/recommended-for-me?take=${take}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw await res.json();
  }

  const page = await res.json();
  return page.data;
}
```

## 2. Movies Recommended For Me

| Item | Details |
|---|---|
| Method | `GET` |
| URL | `/api/movies/recommended-for-me` |
| Auth | Required |
| Query | `take` |
| Response | `MovieListItemDto[]` |

Example request:

```http
GET /api/movies/recommended-for-me?take=20
Authorization: Bearer <token>
```

Example response:

```json
[
  {
    "movieId": 0,
    "tmdbId": 155,
    "title": "The Dark Knight",
    "posterUrl": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    "backdropUrl": "https://image.tmdb.org/t/p/w780/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    "releaseDate": "2008-07-16T00:00:00",
    "language": "en",
    "mpaCertification": null,
    "popularity": 83.42,
    "tmdbRating": 8.5,
    "tmdbVoteCount": 33000,
    "genres": ["Drama", "Action", "Crime", "Thriller"],
    "staffNames": []
  }
]
```

### Movie Response Fields

| Field | Type | Notes |
|---|---|---|
| `movieId` | `int` | Usually `0` because recommended movie cards are hydrated from TMDB. |
| `tmdbId` | `int?` | Use this for movie details navigation. |
| `title` | `string` | Movie title. |
| `posterUrl` | `string?` | Full TMDB poster URL. |
| `backdropUrl` | `string?` | Full TMDB backdrop URL. |
| `releaseDate` | `string?` | ISO date string. |
| `language` | `string?` | Original language code. |
| `mpaCertification` | `string?` | Currently null from this endpoint. |
| `popularity` | `number?` | TMDB popularity score. |
| `tmdbRating` | `number?` | TMDB vote average. |
| `tmdbVoteCount` | `int?` | TMDB vote count. |
| `genres` | `string[]` | Genre names. |
| `staffNames` | `string[]` | Currently empty from this endpoint. |

### Movie Backend Behavior

The backend builds recommendations from:

- User profile fields such as age, gender, profession, country, favorite genres, and disliked genres.
- Recent movie ratings.
- Recent movie watchlist entries.
- Blocked movie genres for child accounts.

If the recommender service fails, returns no items, or every recommended item fails TMDB hydration, the endpoint falls back to trending movies.

Frontend note: movies returns an array at the root, unlike the games endpoint.

```javascript
async function getMovieRecommendations(token, take = 20) {
  const res = await fetch(`${BASE_URL}/api/movies/recommended-for-me?take=${take}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw await res.json();
  }

  return await res.json();
}
```

## Frontend Integration Checklist

1. Send the bearer token for both endpoints.
2. Use `rawgId` for game details routes.
3. Use `tmdbId` for movie details routes.
4. Parse games as a paged response: `result.data`.
5. Parse movies as a direct array.
6. Pass a positive `take` value. Use `20` unless the UI needs a smaller carousel.
7. Treat an empty array or empty `data` as a valid state and show an empty recommendation section.
