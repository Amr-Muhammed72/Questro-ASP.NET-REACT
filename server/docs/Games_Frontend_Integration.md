# 🎮 Questro Games API — Frontend Integration Guide

> **Generated from source**: Controllers, Services, DTOs, and Error definitions in `Questro.API`, `Questro.Service`, and `Questro.Shared`.

---

## Table of Contents

1. [Conventions & Authentication](#conventions--authentication)
2. [Shared Response Schemas](#shared-response-schemas)
3. [Error Reference](#error-reference)
4. [Game Catalog Endpoints](#1-game-catalog--gamescontroller)
5. [Game Interactions Endpoints](#2-game-interactions--gameinteractionscontroller)
6. [Game Reviews Endpoints](#3-game-reviews--gamereviewcontroller)
7. [Game Sync Endpoints](#4-game-sync--gamesynccontroller)

---

## Conventions & Authentication

| Item | Details |
|---|---|
| **Base URL** | `{host}/api` |
| **Auth Scheme** | Bearer JWT token via `Authorization: Bearer <token>` header |
| **Content-Type** | `application/json` for all request/response bodies |
| **User ID** | Extracted server-side from the JWT `NameIdentifier` / `sub` claim — never sent by the frontend |

> [!IMPORTANT]
> Endpoints marked with 🔒 require a valid JWT. Sending no token or an expired token returns **401 Unauthorized**.

---

## Shared Response Schemas

### `PagedResponse<T>`

All paginated endpoints wrap results in this envelope:

```json
{
  "data": [ /* array of T */ ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 142,
  "totalPages": 8
}
```

### `GameListItemDto`

```json
{
  "gameId": 0,
  "rawgId": 3498,
  "title": "Grand Theft Auto V",
  "rating": 4.47,
  "releaseDate": "2013-09-17T00:00:00",
  "posterUrl": "https://media.rawg.io/...",
  "trailerUrl": null,
  "genres": [{ "id": 4, "name": "Action" }],
  "platforms": [{ "id": 4, "name": "PC" }]
}
```

### `GameDetailsDto`

```json
{
  "gameId": 12,
  "rawgId": 3498,
  "title": "Grand Theft Auto V",
  "description": "<p>HTML description from RAWG</p>",
  "rating": 4.47,
  "releaseDate": "2013-09-17T00:00:00",
  "posterUrl": "https://media.rawg.io/...",
  "backdropUrl": "https://media.rawg.io/...",
  "trailerUrl": "https://steamcdn.../movie_max.mp4",
  "storeUrl": "https://store.steampowered.com/...",
  "numberOfImages": 10,
  "screenshots": [
    { "id": 1, "imageUrl": "https://...", "width": 1920, "height": 1080 }
  ],
  "genres": [{ "id": 4, "name": "Action" }],
  "tags": [{ "id": 31, "name": "Singleplayer" }],
  "platforms": [{ "id": 4, "name": "PC" }],
  "developers": [{ "id": 10, "name": "Rockstar North", "imageUrl": "https://..." }],
  "publishers": [{ "id": 11, "name": "Rockstar Games", "imageUrl": "https://..." }],
  "similarGames": [ /* array of GameListItemDto */ ]
}
```

### `GameInteractionStatusDto`

```json
{
  "gameId": 12,
  "rawgId": 3498,
  "isLiked": true,
  "rating": 4.47,
  "isInWishlist": false,
  "userRating": 5
}
```

### `GameReviewDto`

```json
{
  "reviewId": 1,
  "gameId": 12,
  "userId": 42,
  "content": "Amazing open-world experience...",
  "createdAt": "2026-04-20T10:30:00Z",
  "updatedAt": "2026-04-21T08:15:00Z"
}
```

---

## Error Reference

All errors follow this shape:

```json
{
  "code": "Game.NotFound",
  "message": "No games found.",
  "details": null
}
```

| Code | Message | HTTP Status |
|---|---|---|
| `Game.NotFound` | No games found. | 404 |
| `Game.InvalidRawgId` | RAWG id must be greater than zero. | 400 |
| `Game.GenresNotFound` | No game genres found. | 404 |
| `Game.TagsNotFound` | No game tags found. | 404 |
| `Game.TrendingUnavailable` | Trending games are currently unavailable. | 503 |
| `Game.RecentlyAddedUnavailable` | Recently added games are currently unavailable. | 503 |
| `Game.InvalidRating` | Rating must be between 1 and 5. | 400 |
| `Game.UnauthorizedInteraction` | You must be signed in to perform this action. | 401 |
| `Game.ReviewNotFound` | Game review was not found. | 404 |
| `Game.ReviewAlreadyExists` | You have already submitted a review for this game. | 409 |
| `Game.ReviewBodyInvalid` | Review text is required. | 400 |
| `Game.ReviewBodyTooLong` | Review text is too long. | 400 |

---

## 1. Game Catalog — `GamesController`

**Route prefix**: `/api/Games`

---

### 1.1 `GET /api/Games` — Browse / Search Games

| | |
|---|---|
| **Auth** | None (public) |
| **Description** | Paginated game listing with optional search, genre/platform filtering, rating range, and year filters. When `search` is provided the backend uses RAWG search API; otherwise it uses discover. |

#### Query Parameters

| Param | Type | Required | Default | Notes |
|---|---|---|---|---|
| `pageIndex` | `int` | No | `1` | Clamped to ≥ 1 server-side |
| `pageSize` | `int` | No | `20` | Clamped to ≥ 1 server-side |
| `search` | `string` | No | `null` | Free-text search; switches backend to search mode |
| `sort` | `string` | No | `null` | Sort key passed to RAWG (e.g. `"latest"`, `"popularity"`) |
| `genreId` | `int` | No | `null` | RAWG genre ID |
| `platformId` | `int` | No | `null` | RAWG platform ID |
| `minRating` | `double` | No | `null` | Minimum rating filter (0-5 scale) |
| `maxRating` | `double` | No | `null` | Maximum rating filter |
| `year` | `int` | No | `null` | Release year filter |

#### Responses

**200 OK** — `PagedResponse<GameListItemDto>`

```json
{
  "data": [
    {
      "gameId": 0,
      "rawgId": 3498,
      "title": "Grand Theft Auto V",
      "rating": 4.47,
      "releaseDate": "2013-09-17T00:00:00",
      "posterUrl": "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg",
      "trailerUrl": null,
      "genres": [
        { "id": 4, "name": "Action" },
        { "id": 3, "name": "Adventure" }
      ],
      "platforms": [
        { "id": 4, "name": "PC" },
        { "id": 187, "name": "PlayStation 5" }
      ]
    },
    {
      "gameId": 0,
      "rawgId": 4200,
      "title": "Portal 2",
      "rating": 4.62,
      "releaseDate": "2011-04-19T00:00:00",
      "posterUrl": "https://media.rawg.io/media/games/328/3283617cb7d75d67257fc58339188a09.jpg",
      "trailerUrl": null,
      "genres": [
        { "id": 2, "name": "Shooter" },
        { "id": 7, "name": "Puzzle" }
      ],
      "platforms": [
        { "id": 4, "name": "PC" },
        { "id": 1, "name": "Xbox One" }
      ]
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 500,
  "totalPages": 25
}
```

**5xx** — upstream RAWG failure

```json
{
  "code": "Game.NotFound",
  "message": "No games found.",
  "details": null
}
```

> [!NOTE]
> - `gameId` will be `0` for games not yet synced to the local DB. Use `rawgId` as the primary identifier for navigation.
> - An empty result set still returns 200 with an empty `data` array, not 404.

---

### 1.2 `GET /api/Games/recently-added` — Recently Added Games

| | |
|---|---|
| **Auth** | None (public) |
| **Description** | Returns games released within the last 30 days, sorted by release date. Falls back to latest games if none match the 30-day window. |

#### Query Parameters

| Param | Type | Required | Default |
|---|---|---|---|
| `take` | `int` | No | `20` |

#### Response — **200 OK** — `PagedResponse<GameListItemDto>`

```json
{
  "data": [
    {
      "gameId": 0,
      "rawgId": 58550,
      "title": "Star Wars Outlaws",
      "rating": 3.85,
      "releaseDate": "2026-04-15T00:00:00",
      "posterUrl": "https://media.rawg.io/media/games/example-recently-added.jpg",
      "trailerUrl": null,
      "genres": [{ "id": 4, "name": "Action" }],
      "platforms": [{ "id": 4, "name": "PC" }, { "id": 187, "name": "PlayStation 5" }]
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 8,
  "totalPages": 1
}
```

> [!TIP]
> `totalPages` is always `1` — this is a single-page curated list, not a traditional paginated endpoint.

---

### 1.3 `GET /api/Games/trending` — Trending Games

| | |
|---|---|
| **Auth** | None (public) |
| **Description** | Returns top-rated, most-reviewed games. Sorted by rating (desc) then ratings count (desc). |

#### Query Parameters

| Param | Type | Required | Default |
|---|---|---|---|
| `take` | `int` | No | `30` |

#### Response — **200 OK** — `PagedResponse<GameListItemDto>`

```json
{
  "data": [
    {
      "gameId": 0,
      "rawgId": 3498,
      "title": "Grand Theft Auto V",
      "rating": 4.47,
      "releaseDate": "2013-09-17T00:00:00",
      "posterUrl": "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg",
      "trailerUrl": null,
      "genres": [{ "id": 4, "name": "Action" }],
      "platforms": [{ "id": 4, "name": "PC" }]
    },
    {
      "gameId": 0,
      "rawgId": 3328,
      "title": "The Witcher 3: Wild Hunt",
      "rating": 4.66,
      "releaseDate": "2015-05-18T00:00:00",
      "posterUrl": "https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6f1f5c.jpg",
      "trailerUrl": null,
      "genres": [{ "id": 5, "name": "RPG" }, { "id": 4, "name": "Action" }],
      "platforms": [{ "id": 4, "name": "PC" }, { "id": 187, "name": "PlayStation 5" }]
    }
  ],
  "pageNumber": 1,
  "pageSize": 30,
  "totalCount": 15,
  "totalPages": 1
}
```

---

### 1.4 `GET /api/Games/genres` — All Game Genres

| | |
|---|---|
| **Auth** | None (public) |
| **Description** | Returns a flat list of all available genres (sourced from RAWG), sorted alphabetically. Use the `id` values for the `genreId` filter on the browse endpoint. |

#### Response

**200 OK** — `GameGenreDto[]`
```json
[
  { "id": 4, "name": "Action" },
  { "id": 51, "name": "Indie" },
  { "id": 3, "name": "RPG" }
]
```

**404** — `Game.GenresNotFound` (RAWG returned no results)

---



### 1.6 `GET /api/Games/{id}` — Game Details

| | |
|---|---|
| **Auth** | None (public) |
| **Description** | Full detail view for a single game. Includes screenshots, trailers, tags, developers, publishers, store links, and similar games. If the game is not in the local DB, it is auto-synced from RAWG on first access. |

#### Path Parameters

| Param | Type | Required | Notes |
|---|---|---|---|
| `id` | `int` | Yes | The **RAWG ID** of the game. Must be > 0. |

#### Responses

**200 OK** — `GameDetailsDto`

```json
{
  "gameId": 12,
  "rawgId": 3498,
  "title": "Grand Theft Auto V",
  "description": "<p>Rockstar Games went bigger, extract from RAWG...</p>",
  "rating": 4.47,
  "releaseDate": "2013-09-17T00:00:00",
  "posterUrl": "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg",
  "backdropUrl": "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612002.jpg",
  "trailerUrl": "https://steamcdn-a.akamaihd.net/steam/apps/256757115/movie_max.mp4",
  "storeUrl": "https://store.steampowered.com/app/271590",
  "numberOfImages": 10,
  "screenshots": [
    { "id": 1827221, "imageUrl": "https://media.rawg.io/media/screenshots/a7c/a7c.jpg", "width": 1920, "height": 1080 },
    { "id": 1827222, "imageUrl": "https://media.rawg.io/media/screenshots/cf4/cf4.jpg", "width": 1920, "height": 1080 }
  ],
  "genres": [
    { "id": 4, "name": "Action" },
    { "id": 3, "name": "Adventure" }
  ],
  "tags": [
    { "id": 31, "name": "Singleplayer" },
    { "id": 40847, "name": "Steam Achievements" }
  ],
  "platforms": [
    { "id": 4, "name": "PC" },
    { "id": 187, "name": "PlayStation 5" },
    { "id": 1, "name": "Xbox One" }
  ],
  "developers": [
    { "id": 3524, "name": "Rockstar North", "imageUrl": "https://media.rawg.io/media/..." }
  ],
  "publishers": [
    { "id": 2155, "name": "Rockstar Games", "imageUrl": "https://media.rawg.io/media/..." }
  ],
  "similarGames": [
    {
      "gameId": 0,
      "rawgId": 32,
      "title": "Destiny 2",
      "rating": 3.55,
      "releaseDate": "2017-09-06T00:00:00",
      "posterUrl": "https://media.rawg.io/media/games/34b/34b1f1850a1c06fd971bc6ab3ac0ce0e.jpg",
      "trailerUrl": null,
      "genres": [{ "id": 4, "name": "Action" }, { "id": 2, "name": "Shooter" }],
      "platforms": [{ "id": 4, "name": "PC" }]
    }
  ]
}
```

**400** — `Game.InvalidRawgId`

```json
{
  "code": "Game.InvalidRawgId",
  "message": "RAWG id must be greater than zero.",
  "details": null
}
```

**404** — `Game.NotFound` (both RAWG and local DB have no data)

```json
{
  "code": "Game.NotFound",
  "message": "No games found.",
  "details": null
}
```

> [!NOTE]
> - The `description` field contains **raw HTML** from RAWG. Sanitize before rendering (e.g. DOMPurify).
> - `similarGames` may be empty if RAWG has no data and genre-based fallback also fails.
> - The first request for an unseen game will be slower due to background sync.

---

### 1.7 🔒 `GET /api/Games/recommended-for-me` — Personalized Recommendations

| | |
|---|---|
| **Auth** | 🔒 Required |
| **Description** | Returns personalized game recommendations for the authenticated user. |

#### Responses

**500 Internal Server Error**

```json
{
  "code": "General.NotImplemented",
  "message": "The method or operation is not implemented.",
  "details": "Questro.Service.Services.Games.GameCatalogServices.GetRecommendedForMeAsync"
}
```

> [!CAUTION]
> This endpoint is **not yet implemented** on the backend (`NotImplementedException`). Calling it will return a **500 Internal Server Error**. Do not integrate until the backend team confirms readiness.

---

## 2. Game Interactions — `GameInteractionsController`

**Route prefix**: `/api/game-interactions`

**Auth**: 🔒 **All endpoints require authentication**

---

### 2.1 🔒 `POST /api/game-interactions/{rawgId}/like` — Toggle Like

| | |
|---|---|
| **Description** | Toggles the like status for a game. If already liked, removes like. If not liked, adds like. |

#### Path Parameters

| Param | Type | Required | Notes |
|---|---|---|---|
| `rawgId` | `int` | Yes | RAWG game ID. Must be > 0. |

#### Request Body — None

#### Responses

**200 OK** — `GameInteractionStatusDto`
```json
{
  "gameId": 12,
  "rawgId": 3498,
  "isLiked": true,
  "rating": null,
  "isInWishlist": false,
  "userRating": null
}
```

**400** — `Game.InvalidRawgId`

```json
{
  "code": "Game.InvalidRawgId",
  "message": "RAWG id must be greater than zero.",
  "details": null
}
```

**401** — `Game.UnauthorizedInteraction`

```json
{
  "code": "Game.UnauthorizedInteraction",
  "message": "You must be signed in to perform this action.",
  "details": null
}
```

**404** — `Game.NotFound`

```json
{
  "code": "Game.NotFound",
  "message": "No games found.",
  "details": null
}
```

> [!NOTE]
> If the game does not exist locally, the backend auto-syncs it from RAWG before processing. This may add latency on first interaction.

---

### 2.2 🔒 `POST /api/game-interactions/{rawgId}/rate` — Set Rating

| | |
|---|---|
| **Description** | Sets or updates the user's star rating for a game. Creates a new rating if none exists, or overwrites the previous one. |

#### Path Parameters

| Param | Type | Required |
|---|---|---|
| `rawgId` | `int` | Yes |

#### Request Body

```json
{ "stars": 4 }
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `stars` | `int` | Yes | Must be `1–5` inclusive |

#### Responses

**200 OK** — `GameInteractionStatusDto`

```json
{
  "gameId": 12,
  "rawgId": 3498,
  "isLiked": false,
  "rating": 4.47,
  "isInWishlist": false,
  "userRating": 4
}
```

**400** — `Game.InvalidRating`

```json
{
  "code": "Game.InvalidRating",
  "message": "Rating must be between 1 and 5.",
  "details": null
}
```

**400** — `Game.InvalidRawgId`  
**401** — Unauthorized

> [!IMPORTANT]
> **Side effect**: Rating a game **automatically removes it from the user's wishlist** if present. Update the wishlist UI state after a successful rating call.

---

### 2.3 🔒 `POST /api/game-interactions/{rawgId}/wishlist` — Toggle Wishlist

| | |
|---|---|
| **Description** | Toggles wishlist status. If in wishlist, removes. If not, adds. |

#### Path Parameters

| Param | Type | Required |
|---|---|---|
| `rawgId` | `int` | Yes |

#### Request Body — None

#### Responses

**200 OK** — `GameInteractionStatusDto`

```json
{
  "gameId": 12,
  "rawgId": 3498,
  "isLiked": true,
  "rating": null,
  "isInWishlist": true,
  "userRating": null
}
```

**400** — `Game.InvalidRawgId`

```json
{
  "code": "Game.InvalidRawgId",
  "message": "RAWG id must be greater than zero.",
  "details": null
}
```

**401** — Unauthorized

```json
{
  "code": "Game.UnauthorizedInteraction",
  "message": "You must be signed in to perform this action.",
  "details": null
}
```

---

## 3. Game Reviews — `GameReviewController`

**Route prefix**: `/api/GameReview`

**Auth**: 🔒 All endpoints except Get Reviews

---

### 3.1 `GET /api/GameReview/{rawgId}/reviews` — Get Game Reviews

| | |
|---|---|
| **Auth** | None (public — `[AllowAnonymous]`) |
| **Description** | Paginated list of user reviews for a specific game. |

#### Path Parameters

| Param | Type | Required |
|---|---|---|
| `rawgId` | `int` | Yes |

#### Query Parameters

| Param | Type | Required | Default | Notes |
|---|---|---|---|---|
| `pageIndex` | `int` | No | `1` | Clamped to ≥ 1 |
| `pageSize` | `int` | No | `20` | Clamped ≥ 1, **max 50** |

#### Responses

**200 OK** — `PagedResponse<GameReviewDto>`

```json
{
  "data": [
    {
      "reviewId": 7,
      "gameId": 12,
      "userId": 42,
      "content": "One of the best open-world games I have ever played.",
      "createdAt": "2026-04-20T10:30:00Z",
      "updatedAt": "2026-04-20T10:30:00Z"
    },
    {
      "reviewId": 15,
      "gameId": 12,
      "userId": 99,
      "content": "Great multiplayer, but the story could be longer.",
      "createdAt": "2026-04-22T14:15:00Z",
      "updatedAt": "2026-04-23T09:00:00Z"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 2,
  "totalPages": 1
}
```

**400** — `Game.InvalidRawgId`

```json
{
  "code": "Game.InvalidRawgId",
  "message": "RAWG id must be greater than zero.",
  "details": null
}
```

> [!NOTE]
> If the game has never been synced locally, this returns an empty paged response (not 404). `pageSize` is silently capped at **50** server-side.

---

### 3.2 🔒 `POST /api/GameReview/{rawgId}/add-review` — Add Review

| | |
|---|---|
| **Description** | Creates a new review. Each user can only have **one review per game**. |

#### Path Parameters

| Param | Type | Required |
|---|---|---|
| `rawgId` | `int` | Yes |

#### Request Body

```json
{ "content": "This game blew me away with its open-world design..." }
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `content` | `string` | Yes | Non-empty after trim; **max 4000 characters** |

#### Responses

**200 OK** — `GameReviewDto` (the created review)

```json
{
  "reviewId": 23,
  "gameId": 12,
  "userId": 42,
  "content": "This game blew me away with its open-world design...",
  "createdAt": "2026-04-30T14:00:00Z",
  "updatedAt": "2026-04-30T14:00:00Z"
}
```

**409** — `Game.ReviewAlreadyExists`

```json
{
  "code": "Game.ReviewAlreadyExists",
  "message": "You have already submitted a review for this game.",
  "details": null
}
```

**400** — `Game.InvalidRawgId`, `Game.ReviewBodyInvalid`, or `Game.ReviewBodyTooLong`  
**401** — Unauthorized

> [!IMPORTANT]
> - **One review per user per game**. A second attempt returns 409.
> - **Side effect**: Adding a review **removes the game from the wishlist** if present.

---

### 3.3 🔒 `PUT /api/GameReview/{rawgId}/update-review` — Update Review

| | |
|---|---|
| **Description** | Updates the authenticated user's existing review. |

#### Path Parameters

| Param | Type | Required |
|---|---|---|
| `rawgId` | `int` | Yes |

#### Request Body

```json
{ "content": "Updated: After 100 more hours, still a masterpiece..." }
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `content` | `string` | Yes | Non-empty; **max 4000 chars** |

#### Responses

**200 OK** — `GameReviewDto` (the updated review)

```json
{
  "reviewId": 23,
  "gameId": 12,
  "userId": 42,
  "content": "Updated: After 100 more hours, still a masterpiece...",
  "createdAt": "2026-04-30T14:00:00Z",
  "updatedAt": "2026-04-30T16:45:00Z"
}
```

**404** — `Game.ReviewNotFound`

```json
{
  "code": "Game.ReviewNotFound",
  "message": "Game review was not found.",
  "details": null
}
```

**400** — `Game.InvalidRawgId`, `Game.ReviewBodyInvalid`, `Game.ReviewBodyTooLong`  
**401** — Unauthorized

> [!NOTE]
> **Side effect**: Updating a review also **removes the game from the wishlist** if present.

---

### 3.4 🔒 `DELETE /api/GameReview/{rawgId}/delete-review` — Delete Review

| | |
|---|---|
| **Description** | Deletes the authenticated user's review. Users can only delete their own reviews. |

#### Path Parameters

| Param | Type | Required |
|---|---|---|
| `rawgId` | `int` | Yes |

#### Request Body — None

#### Responses

**200 OK**

```json
true
```

**404** — `Game.ReviewNotFound`

```json
{
  "code": "Game.ReviewNotFound",
  "message": "Game review was not found.",
  "details": null
}
```

**400** — `Game.InvalidRawgId`  
**401** — Unauthorized  
**404** — `Game.NotFound`

---

## 4. Game Sync — `GameSyncController`

**Route prefix**: `/api/game-sync`

---

### 4.1 `POST /api/game-sync/{rawgId}` — Sync Game from RAWG

| | |
|---|---|
| **Auth** | None (public) |
| **Description** | Fetches a game's full details from RAWG and saves/updates it in the local database including genres, platforms, and screenshots. |

#### Path Parameters

| Param | Type | Required | Notes |
|---|---|---|---|
| `rawgId` | `int` | Yes | Must be > 0 |

#### Request Body — None

#### Responses

**200 OK** — `GameListItemDto` (the synced game)

```json
{
  "gameId": 12,
  "rawgId": 3498,
  "title": "Grand Theft Auto V",
  "rating": 4.47,
  "releaseDate": "2013-09-17T00:00:00",
  "posterUrl": "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg",
  "trailerUrl": null,
  "genres": [
    { "id": 4, "name": "Action" },
    { "id": 3, "name": "Adventure" }
  ],
  "platforms": [
    { "id": 4, "name": "PC" },
    { "id": 187, "name": "PlayStation 5" }
  ]
}
```

**400** — `Game.InvalidRawgId`

```json
{
  "code": "Game.InvalidRawgId",
  "message": "RAWG id must be greater than zero.",
  "details": null
}
```

**404** — `Game.NotFound`

```json
{
  "code": "Game.NotFound",
  "message": "No games found.",
  "details": null
}
```

> [!WARNING]
> This triggers external RAWG API calls. Repeated calls re-fetch and update. Consider debouncing on the frontend.

---

## Quick Reference Table

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| 1.1 | `GET` | `/api/Games` | Public | Browse/search games |
| 1.2 | `GET` | `/api/Games/recently-added` | Public | Last 30 days releases |
| 1.3 | `GET` | `/api/Games/trending` | Public | Top-rated games |
| 1.4 | `GET` | `/api/Games/genres` | Public | All genre options |
| 1.5 | `GET` | `/api/Games/{id}` | Public | Full game details |
| 1.6 | `GET` | `/api/Games/recommended-for-me` | 🔒 | ⚠️ NOT IMPLEMENTED |
| 2.1 | `POST` | `/api/game-interactions/{rawgId}/like` | 🔒 | Toggle like |
| 2.2 | `POST` | `/api/game-interactions/{rawgId}/rate` | 🔒 | Set 1-5 star rating |
| 2.3 | `POST` | `/api/game-interactions/{rawgId}/wishlist` | 🔒 | Toggle wishlist |
| 3.1 | `GET` | `/api/GameReview/{rawgId}/reviews` | Public | List reviews |
| 3.2 | `POST` | `/api/GameReview/{rawgId}/add-review` | 🔒 | Create review |
| 3.3 | `PUT` | `/api/GameReview/{rawgId}/update-review` | 🔒 | Edit own review |
| 3.4 | `DELETE` | `/api/GameReview/{rawgId}/delete-review` | 🔒 | Remove own review |
| 4.1 | `POST` | `/api/game-sync/{rawgId}` | Public | Sync game from RAWG |

---

## Key Frontend Notes

> [!IMPORTANT]
> ### Wishlist Auto-Removal
> The backend automatically removes a game from the user's wishlist when the user **rates**, **adds a review**, or **updates a review** for that game. After these actions, refresh any wishlist UI state.

> [!TIP]
> ### Auto-Sync Behavior
> Game interaction endpoints (like, rate, wishlist, review) will **automatically sync the game from RAWG** if it does not exist locally. This means first interactions with a new game may have extra latency.

> [!NOTE]
> ### Identifier Strategy
> - Use **`rawgId`** as the primary identifier for all API calls and URL routing.
> - **`gameId`** (local DB ID) will be `0` for games returned from catalog/search that have not been synced yet.
> - After any interaction, `gameId` will be populated since the game is synced as a side-effect.

> [!NOTE]
> ### HTML Content
> The `description` field in `GameDetailsDto` contains **raw HTML** from RAWG. Use a sanitizer (e.g., DOMPurify) before rendering to prevent XSS.
