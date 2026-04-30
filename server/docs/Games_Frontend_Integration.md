# Frontend API Integration (Games)

This guide documents the games-related API flows implemented in:

- `GamesController`
- `GameSyncController`
- `GameReviewController`
- `GameInteractionsController`
- `IGameCatalogServices`
- `IGameDetailsService`
- `IGameSyncService`
- `IGameInteractionService`

## Base URL

- Local: `http://localhost:5222`

## Route Map

### Games Controller
- `GET /api/games` - Browse games with filters
- `GET /api/games/recently-added` - Get recently added games
- `GET /api/games/trending` - Get trending games
- `GET /api/games/genres` - Get available genres
- `GET /api/games/{id}` - Get game details by ID
- `GET /api/games/recommended-for-me` - Get personalized recommendations (Auth required)

### Game Sync Controller
- `POST /api/game-sync/{rawgId}` - Sync game from RAWG API

### Game Review Controller
- `GET /api/gamereview/{rawgId}/reviews` - Get game reviews
- `POST /api/gamereview/{rawgId}/add-review` - Create review (Auth required)
- `PUT /api/gamereview/{rawgId}/update-review` - Update review (Auth required)
- `DELETE /api/gamereview/{rawgId}/delete-review` - Delete review (Auth required)

### Game Interactions Controller
- `POST /api/game-interactions/{rawgId}/like` - Toggle like (Auth required)
- `POST /api/game-interactions/{rawgId}/rate` - Set rating (Auth required)
- `POST /api/game-interactions/{rawgId}/wishlist` - Toggle wishlist (Auth required)

## Games Discovery Flow Summary

The games discovery flow allows users to browse, search, and filter games:

1. Frontend calls `GET /api/games/genres` to populate filter options.
2. Frontend calls `GET /api/games` with optional filters (search, genre, rating, platform, etc.).
3. Frontend can call `GET /api/games/{id}` to view full game details.
4. Optional: Frontend calls `GET /api/games/recommended-for-me` for authenticated users to get personalized recommendations.

Important behavior:

- All browse endpoints are **public** (no authentication required).
- Game ID in route is the internal database ID, not RAWG ID.
- RAWG ID (`rawgId`) is used in most payload responses and for interactions/reviews.
- Pagination uses `pageIndex` (1-based) and `pageSize`.
- Default page size is `20`, max `100`.

## Game Interactions Flow Summary

Users can interact with games through likes, ratings, and wishlist:

1. User calls `POST /api/game-interactions/{rawgId}/like` to toggle like status.
2. User calls `POST /api/game-interactions/{rawgId}/rate` with a star rating (1-10).
3. User calls `POST /api/game-interactions/{rawgId}/wishlist` to toggle wishlist status.
4. All interactions return the current `GameInteractionStatusDto` with user's full interaction state.

Important behavior:

- **All interaction endpoints require authentication** (Bearer token).
- Like and wishlist are **toggle operations** (if liked, calling again unlikes).
- Rating **overwrites** the previous rating (no toggle).
- Each interaction endpoint returns the **entire interaction state**, not just the changed field.
- Maximum rating is `10`, minimum is `1`.

## Game Reviews Flow Summary

Users can create, read, update, and delete game reviews:

1. Frontend calls `GET /api/gamereview/{rawgId}/reviews` to fetch all reviews for a game (no auth needed).
2. Authenticated user calls `POST /api/gamereview/{rawgId}/add-review` to create a review.
3. User calls `PUT /api/gamereview/{rawgId}/update-review` to update their review content.
4. User calls `DELETE /api/gamereview/{rawgId}/delete-review` to delete their review.

Important behavior:

- Getting reviews is **public** (no authentication).
- Creating, updating, and deleting reviews **require authentication**.
- A user can have **only one review per game**.
- Attempting to add a second review for the same game returns a `409 Conflict`.
- Only the review author can update or delete their review.
- Review content must be between `10-5000 characters`.

## Game Sync Flow Summary

If a game exists in RAWG API but not in Questro database:

1. Frontend attempts to fetch game details with `GET /api/games/{id}`.
2. If not found, frontend calls `POST /api/game-sync/{rawgId}` to sync the game.
3. Backend fetches data from RAWG API, creates the game in Questro database, and returns `GameDetailsDto`.

Important behavior:

- Sync endpoint uses **RAWG ID**, not internal database ID.
- Sync is typically needed when user discovers a game through external sources.
- After successful sync, frontend can use the returned `gameId` for future API calls.
- Sync is **synchronous** and blocks until completion.

## Token Storage

### Access token

- Returned in the JSON body from `POST /api/Auth/Verify`
- Used for authenticated game endpoints (interactions, creating reviews, recommendations)
- Send it as `Authorization: Bearer <token>` on protected APIs

Example with `fetch`:

```javascript
await fetch("http://localhost:5222/api/game-interactions/12345/like", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${accessToken}`
  }
});
```

Example with `axios`:

```javascript
await axios.post("http://localhost:5222/api/game-interactions/12345/like", {}, {
  headers: {
    "Authorization": `Bearer ${accessToken}`
  }
});
```

## Error Handling

All game endpoints follow a consistent error response format:

```json
{
  "code": "ERROR_CODE",
  "en": "Human-readable error message",
  "details": "Additional details (optional)"
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad request (invalid parameters, validation failed)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not found (game, review, or resource not found)
- `409` - Conflict (e.g., user already has a review for this game)
- `500` - Internal server error

Common error codes:

- `GAME_NOT_FOUND` - Game doesn't exist
- `INVALID_RATING` - Rating not between 1-10
- `INVALID_PAGE_PARAMETERS` - Page index/size out of range
- `REVIEW_NOT_FOUND` - Review doesn't exist
- `DUPLICATE_REVIEW` - User already has a review for this game

## Endpoints

### 1) Get Games (Browse with Filters)

- Method: `GET`
- URL: `/api/games`
- Auth: No

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageIndex` | int | 1 | Page number (1-based) |
| `pageSize` | int | 20 | Items per page (1-100) |
| `search` | string | null | Search by game title |
| `sort` | string | null | Sort by: `rating`, `releaseDate`, `popularity` |
| `genreId` | int | null | Filter by genre ID |
| `platformId` | int | null | Filter by platform ID |
| `minRating` | double | null | Minimum rating (0-10) |
| `maxRating` | double | null | Maximum rating (0-10) |
| `year` | int | null | Release year |

Success response:

- Status: `200 OK`

```json
{
  "items": [
    {
      "gameId": 1,
      "rawgId": 12345,
      "title": "The Witcher 3",
      "rating": 9.2,
      "releaseDate": "2015-05-19T00:00:00Z",
      "posterUrl": "https://...",
      "trailerUrl": "https://...",
      "genres": [
        {
          "id": 1,
          "name": "Action"
        }
      ],
      "platforms": [
        {
          "id": 1,
          "name": "PC"
        }
      ]
    }
  ],
  "pageIndex": 1,
  "pageSize": 20,
  "totalCount": 150
}
```

Failure response:

```json
{
  "code": "INVALID_PAGE_PARAMETERS",
  "en": "Page size exceeds maximum allowed",
  "details": "Max page size is 100"
}
```

Common errors:

- `400` `INVALID_PAGE_PARAMETERS`
- `400` `INVALID_GENRE_FILTER`
- `400` `INVALID_PLATFORM_FILTER`

Frontend notes:

- Use pagination for large result sets to improve performance.
- Cache the genres list for filter options.
- Implement debouncing for search input.

### 2) Get Recently Added Games

- Method: `GET`
- URL: `/api/games/recently-added`
- Auth: No

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `take` | int | 20 | Number of games (max 100) |

Success response:

- Status: `200 OK`

```json
[
  {
    "gameId": 5,
    "rawgId": 54321,
    "title": "Dragon Age: The Veilguard",
    "rating": 8.8,
    "releaseDate": "2024-10-31T00:00:00Z",
    "posterUrl": "https://...",
    "trailerUrl": "https://...",
    "genres": [
      {
        "id": 2,
        "name": "RPG"
      }
    ],
    "platforms": [
      {
        "id": 1,
        "name": "PC"
      }
    ]
  }
]
```

Frontend notes:

- Ideal for "New Releases" section on homepage.
- Cache this list with a TTL of 1-6 hours.

### 3) Get Trending Games

- Method: `GET`
- URL: `/api/games/trending`
- Auth: No

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `take` | int | 30 | Number of games (max 100) |

Success response:

- Status: `200 OK`

```json
[
  {
    "gameId": 2,
    "rawgId": 11111,
    "title": "Palworld",
    "rating": 8.1,
    "releaseDate": "2024-01-18T00:00:00Z",
    "posterUrl": "https://...",
    "trailerUrl": "https://...",
    "genres": [
      {
        "id": 12,
        "name": "Adventure"
      }
    ],
    "platforms": [
      {
        "id": 1,
        "name": "PC"
      }
    ]
  }
]
```

Frontend notes:

- Ideal for "Trending Now" section on homepage.
- Cache this list with a TTL of 2-12 hours.
- Trending is based on user interactions and ratings.

### 4) Get Game Genres

- Method: `GET`
- URL: `/api/games/genres`
- Auth: No

Success response:

- Status: `200 OK`

```json
[
  {
    "id": 1,
    "name": "Action"
  },
  {
    "id": 2,
    "name": "Adventure"
  },
  {
    "id": 3,
    "name": "RPG"
  },
  {
    "id": 4,
    "name": "Strategy"
  }
]
```

Frontend notes:

- Call this once on app bootstrap and cache indefinitely (or until user logs out).
- Use these IDs as `genreId` filter parameter in browse endpoint.
- Display in filter dropdowns or genre selection UI.

### 5) Get Game Details

- Method: `GET`
- URL: `/api/games/{id}`
- Auth: No

Path parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | int |  RAWG ID |

Success response:

- Status: `200 OK`

```json
{
  "gameId": 1,
  "rawgId": 12345,
  "title": "The Witcher 3: Wild Hunt",
  "description": "Geralt of Rivia, a solitary monster hunter...",
  "rating": 9.2,
  "releaseDate": "2015-05-19T00:00:00Z",
  "posterUrl": "https://...",
  "backdropUrl": "https://...",
  "trailerUrl": "https://...",
  "storeUrl": "https://store.playstation.com/...",
  "numberOfImages": 25,
  "screenshots": [
    {
      "imageUrl": "https://...",
      "altText": "Geralt fighting a griffin"
    }
  ],
  "genres": [
    {
      "id": 1,
      "name": "Action"
    }
  ],
  "platforms": [
    {
      "id": 1,
      "name": "PC"
    }
  ],
  "requirements": [
    {
      "platformId": 1,
      "platformName": "PC",
      "minimum": "Intel Core i7...",
      "recommended": "Intel Core i7 Extreme..."
    }
  ],
  "developers": [
    {
      "id": 1,
      "name": "CD Projekt Red",
      "imageUrl": "https://..."
    }
  ],
  "publishers": [
    {
      "id": 1,
      "name": "CD Projekt",
      "imageUrl": "https://..."
    }
  ],
  "similarGames": [
    {
      "gameId": 2,
      "rawgId": 22222,
      "title": "Dragon Age: Inquisition",
      "rating": 8.7,
      "releaseDate": "2014-11-18T00:00:00Z",
      "posterUrl": "https://...",
      "trailerUrl": "https://...",
      "genres": [
        {
          "id": 2,
          "name": "Adventure"
        }
      ],
      "platforms": [
        {
          "id": 1,
          "name": "PC"
        }
      ]
    }
  ]
}
```

Failure response:

```json
{
  "code": "GAME_NOT_FOUND",
  "en": "Game not found",
  "details": "No game with ID 999 exists"
}
```

Common errors:

- `404` Game not found
- `400` Invalid game ID

Frontend notes:

- Use `gameId` from browse results to fetch details.
- Cache game details locally with TTL of 1 hour.
- If game returns 404, try `POST /api/game-sync/{rawgId}` to sync from RAWG.

### 6) Get Recommended Games (Authenticated)

- Method: `GET`
- URL: `/api/games/recommended-for-me`
- Auth: Yes (Bearer token required)

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `take` | int | 20 | Number of games (max 100) |

Success response:

- Status: `200 OK`

```json
[
  {
    "gameId": 10,
    "rawgId": 99999,
    "title": "Baldur's Gate 3",
    "rating": 9.5,
    "releaseDate": "2023-08-03T00:00:00Z",
    "posterUrl": "https://...",
    "trailerUrl": "https://...",
    "genres": [
      {
        "id": 2,
        "name": "Adventure"
      }
    ],
    "platforms": [
      {
        "id": 1,
        "name": "PC"
      }
    ]
  }
]
```

Failure response:

```json
{
  "code": "UNAUTHORIZED",
  "en": "User not authenticated",
  "details": "No valid token provided"
}
```

Common errors:

- `401` Unauthorized (missing or invalid token)
- `400` Invalid parameters

Frontend notes:

- Only available for authenticated users.
- Recommendations are based on user's interaction history and ratings.
- Call this on the dashboard or recommendations page after user logs in.

### 7) Sync Game from RAWG API

- Method: `POST`
- URL: `/api/game-sync/{rawgId}`
- Auth: No

Path parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `rawgId` | int | RAWG API game ID |

Request body:

- No body required

Success response:

- Status: `200 OK`

```json
{
  "gameId": 50,
  "rawgId": 12345,
  "title": "The Witcher 3: Wild Hunt",
  "description": "Geralt of Rivia...",
  "rating": 9.2,
  "releaseDate": "2015-05-19T00:00:00Z",
  "posterUrl": "https://...",
  "backdropUrl": "https://...",
  "trailerUrl": "https://...",
  "storeUrl": "https://...",
  "numberOfImages": 25,
  "screenshots": [...],
  "genres": [...],
  "platforms": [...],
  "requirements": [...],
  "developers": [...],
  "publishers": [...],
  "similarGames": [...]
}
```

Failure response:

```json
{
  "code": "GAME_NOT_FOUND_IN_RAWG",
  "en": "Game not found in RAWG API",
  "details": "RAWG ID 99999 does not exist"
}
```

Common errors:

- `404` Game not found in RAWG
- `400` Invalid RAWG ID
- `500` Sync service error

Frontend notes:

- Use when `GET /api/games/{id}` returns 404.
- Save the returned `gameId` for future API calls.
- Sync is a one-time operation; subsequent calls for the same RAWG ID will use cached data.
- Consider showing a loading indicator as sync may take a few seconds.

### 8) Get Game Reviews

- Method: `GET`
- URL: `/api/gamereview/{rawgId}/reviews`
- Auth: No

Path parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `rawgId` | int | RAWG game ID |

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageIndex` | int | 1 | Page number (1-based) |
| `pageSize` | int | 20 | Reviews per page (1-100) |

Success response:

- Status: `200 OK`

```json
{
  "items": [
    {
      "reviewId": 1,
      "gameId": 1,
      "userId": 123456,
      "content": "This game is absolutely amazing! The storytelling is fantastic.",
      "createdAt": "2024-04-15T10:30:00Z",
      "updatedAt": null
    },
    {
      "reviewId": 2,
      "gameId": 1,
      "userId": 789012,
      "content": "Great game but a bit long.",
      "createdAt": "2024-04-18T14:22:00Z",
      "updatedAt": "2024-04-20T09:15:00Z"
    }
  ],
  "pageIndex": 1,
  "pageSize": 20,
  "totalCount": 45
}
```

Failure response:

```json
{
  "code": "GAME_NOT_FOUND",
  "en": "Game not found",
  "details": ""
}
```

Common errors:

- `404` Game not found
- `400` Invalid pagination parameters

Frontend notes:

- Paginate reviews for better performance.
- Display user ID or username alongside review content.
- Show creation and update dates (if available).

### 9) Create Game Review

- Method: `POST`
- URL: `/api/gamereview/{rawgId}/add-review`
- Auth: Yes (Bearer token required)

Path parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `rawgId` | int | RAWG game ID |

Request body:

```json
{
  "content": "This game exceeded all my expectations. The graphics are stunning and gameplay is smooth."
}
```

Validation rules:

- `content`: required, min `10` characters, max `5000` characters

Success response:

- Status: `200 OK`

```json
{
  "reviewId": 123,
  "gameId": 1,
  "userId": 456789,
  "content": "This game exceeded all my expectations. The graphics are stunning and gameplay is smooth.",
  "createdAt": "2024-04-25T16:45:00Z",
  "updatedAt": null
}
```

Failure response (duplicate review):

```json
{
  "code": "DUPLICATE_REVIEW",
  "en": "You already have a review for this game",
  "details": ""
}
```

Common errors:

- `400` `INVALID_CONTENT` - Content too short or too long
- `401` Unauthorized
- `404` Game not found
- `409` `DUPLICATE_REVIEW` - User already reviewed this game
- `500` Failed to create review

Frontend notes:

- Validate content length before submitting.
- Show character count feedback (10-5000 characters).
- If user already has a review, show error and offer to update instead.
- After success, display the created review immediately.

### 10) Update Game Review

- Method: `PUT`
- URL: `/api/gamereview/{rawgId}/update-review`
- Auth: Yes (Bearer token required, must be review author)

Path parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `rawgId` | int | RAWG game ID |

Request body:

```json
{
  "content": "Updated review content after further gameplay experience."
}
```

Validation rules:

- `content`: required, min `10` characters, max `5000` characters

Success response:

- Status: `200 OK`

```json
{
  "reviewId": 123,
  "gameId": 1,
  "userId": 456789,
  "content": "Updated review content after further gameplay experience.",
  "createdAt": "2024-04-25T16:45:00Z",
  "updatedAt": "2024-04-26T11:20:00Z"
}
```

Failure response:

```json
{
  "code": "REVIEW_NOT_FOUND",
  "en": "Review not found",
  "details": "You don't have a review for this game"
}
```

Common errors:

- `400` `INVALID_CONTENT` - Content too short or too long
- `401` Unauthorized or not review author
- `404` Review not found
- `500` Failed to update review

Frontend notes:

- Only show edit button if user is the review author.
- Validate content length before submitting.
- Update timestamp is automatically set by backend.
- After success, update the review display immediately.

### 11) Delete Game Review

- Method: `DELETE`
- URL: `/api/gamereview/{rawgId}/delete-review`
- Auth: Yes (Bearer token required, must be review author)

Path parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `rawgId` | int | RAWG game ID |

Request body:

- No body required

Success response:

- Status: `200 OK`

```json
{
  "message": "Review deleted successfully",
  "reviewId": 123
}
```

Failure response:

```json
{
  "code": "REVIEW_NOT_FOUND",
  "en": "Review not found",
  "details": "You don't have a review for this game"
}
```

Common errors:

- `401` Unauthorized or not review author
- `404` Review not found
- `500` Failed to delete review

Frontend notes:

- Only show delete button if user is the review author.
- Show confirmation dialog before deleting.
- After deletion, remove review from UI immediately.

### 12) Toggle Like Game

- Method: `POST`
- URL: `/api/game-interactions/{rawgId}/like`
- Auth: Yes (Bearer token required)

Path parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `rawgId` | int | RAWG game ID |

Request body:

- No body required (empty POST)

Success response:

- Status: `200 OK`

```json
{
  "gameId": 1,
  "rawgId": 12345,
  "isLiked": true,
  "rating": 8.5,
  "isInWishlist": false,
  "userRating": null
}
```

Failure response:

```json
{
  "code": "GAME_NOT_FOUND",
  "en": "Game not found",
  "details": ""
}
```

Common errors:

- `401` Unauthorized
- `404` Game not found
- `500` Failed to toggle like

Frontend notes:

- This is a **toggle** operation - call again to unlike.
- Response shows full interaction state after toggle.
- Use `isLiked` field to update UI button state.
- No need to refresh - use the response state immediately.

### 13) Set Game Rating

- Method: `POST`
- URL: `/api/game-interactions/{rawgId}/rate`
- Auth: Yes (Bearer token required)

Path parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `rawgId` | int | RAWG game ID |

Request body:

```json
{
  "stars": 9
}
```

Validation rules:

- `stars`: required, integer between `1` and `10` (inclusive)

Success response:

- Status: `200 OK`

```json
{
  "gameId": 1,
  "rawgId": 12345,
  "isLiked": true,
  "rating": 8.5,
  "isInWishlist": false,
  "userRating": 9
}
```

Failure response:

```json
{
  "code": "INVALID_RATING",
  "en": "Rating must be between 1 and 10",
  "details": "Provided rating: 15"
}
```

Common errors:

- `400` `INVALID_RATING` - Rating not 1-10
- `401` Unauthorized
- `404` Game not found
- `500` Failed to set rating

Frontend notes:

- **Not a toggle** - each call overwrites previous rating.
- Response shows full interaction state after rating is set.
- Use `userRating` field from response to update UI.
- Validate input before submitting (must be 1-10).
- Consider implementing star-based UI for easy input.

### 14) Toggle Wishlist

- Method: `POST`
- URL: `/api/game-interactions/{rawgId}/wishlist`
- Auth: Yes (Bearer token required)

Path parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `rawgId` | int | RAWG game ID |

Request body:

- No body required (empty POST)

Success response:

- Status: `200 OK`

```json
{
  "gameId": 1,
  "rawgId": 12345,
  "isLiked": true,
  "rating": 8.5,
  "isInWishlist": true,
  "userRating": 9
}
```

Failure response:

```json
{
  "code": "GAME_NOT_FOUND",
  "en": "Game not found",
  "details": ""
}
```

Common errors:

- `401` Unauthorized
- `404` Game not found
- `500` Failed to toggle wishlist

Frontend notes:

- This is a **toggle** operation - call again to remove from wishlist.
- Response shows full interaction state after toggle.
- Use `isInWishlist` field to update UI button state.
- No need to refresh - use the response state immediately.
- Consider showing a "Remove from Wishlist" confirmation or simple toggle.

## Usage Examples

### Example 1: Browse Games with Filters (Fetch API)

```javascript
const browseGames = async (filters = {}) => {
  const params = new URLSearchParams({
    pageIndex: filters.pageIndex || 1,
    pageSize: filters.pageSize || 20,
    search: filters.search || '',
    genreId: filters.genreId || '',
    minRating: filters.minRating || '',
  });

  const response = await fetch(
    `http://localhost:5222/api/games?${params}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${error.code}: ${error.en}`);
  }

  return response.json();
};

// Usage
try {
  const games = await browseGames({
    pageIndex: 1,
    pageSize: 20,
    search: 'witcher',
    minRating: 8
  });
  console.log(`Found ${games.totalCount} games`);
} catch (error) {
  console.error('Browse failed:', error);
}
```

### Example 2: Get Trending Games and Display

```javascript
const getTrendingGames = async () => {
  const response = await fetch(
    'http://localhost:5222/api/games/trending?take=10',
    { headers: { 'Accept': 'application/json' } }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch trending games');
  }

  return response.json();
};

// Display trending games
const trendingGames = await getTrendingGames();
const html = trendingGames
  .map(game => `
    <div class="game-card">
      <img src="${game.posterUrl}" alt="${game.title}">
      <h3>${game.title}</h3>
      <p>Rating: ${game.rating}/10</p>
    </div>
  `)
  .join('');

document.getElementById('trending').innerHTML = html;
```

### Example 3: User Reviews a Game (Authenticated)

```javascript
const reviewGame = async (rawgId, content, accessToken) => {
  const response = await fetch(
    `http://localhost:5222/api/gamereview/${rawgId}/add-review`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    }
  );

  if (response.status === 409) {
    // User already has a review - offer to update instead
    const error = await response.json();
    if (error.code === 'DUPLICATE_REVIEW') {
      return { error: 'You already reviewed this game. Update your review instead.' };
    }
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${error.code}: ${error.en}`);
  }

  return response.json();
};

// Usage
const review = await reviewGame(12345, 'Amazing game!', userToken);
```

### Example 4: User Interacts with Game (Axios)

```javascript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5222/api',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Like game
const likeGame = (rawgId) =>
  client.post(`/game-interactions/${rawgId}/like`);

// Rate game
const rateGame = (rawgId, stars) =>
  client.post(`/game-interactions/${rawgId}/rate`, { stars });

// Add to wishlist
const addToWishlist = (rawgId) =>
  client.post(`/game-interactions/${rawgId}/wishlist`);

// Usage
await likeGame(12345);
const ratingResult = await rateGame(12345, 9);
console.log('User rating:', ratingResult.data.userRating);

await addToWishlist(12345);
```

### Example 5: Game Not Found - Sync from RAWG

```javascript
const getGameOrSync = async (gameId, rawgId) => {
  try {
    // Try to get from database
    const response = await fetch(
      `http://localhost:5222/api/games/${gameId}`
    );

    if (response.status === 404) {
      // Not in database, sync from RAWG
      console.log(`Game ${gameId} not found, syncing from RAWG...`);
      const syncResponse = await fetch(
        `http://localhost:5222/api/game-sync/${rawgId}`,
        { method: 'POST' }
      );

      if (!syncResponse.ok) {
        throw new Error('Failed to sync game from RAWG');
      }

      return syncResponse.json();
    }

    if (!response.ok) {
      throw new Error('Failed to fetch game');
    }

    return response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

## Best Practices

1. **Caching**
   - Cache genres indefinitely (or until app restart)
   - Cache game details with 1-hour TTL
   - Cache trending/recently-added with 6-12 hour TTL

2. **Error Handling**
   - Always check response status code
   - Read error `code` field for specific error handling
   - Show user-friendly error messages

3. **Pagination**
   - Use reasonable page sizes (10-50 for lists, 20 for reviews)
   - Implement "Load More" or pagination controls for large result sets
   - Store pagination state in component

4. **Performance**
   - Debounce search input (300-500ms delay)
   - Lazy load images
   - Consider infinite scroll for better mobile UX

5. **Authentication**
   - Always include `Authorization: Bearer {token}` header for protected endpoints
   - Handle 401 errors by redirecting to login
   - Refresh token on 401 if possible

6. **User Experience**
   - Show loading states while fetching
   - Show confirmation dialogs before destructive actions (delete)
   - Provide character count feedback for reviews (10-5000)
   - Disable like/rate buttons during request

## Troubleshooting

**Q: Getting 404 when fetching game details**
A: The game might not be synced yet. Use `POST /api/game-sync/{rawgId}` to sync from RAWG API.

**Q: Getting 401 Unauthorized on interactions**
A: Ensure access token is included in `Authorization: Bearer {token}` header and is still valid.

**Q: User can't add review - getting 409**
A: User already has a review for this game. Offer to update the existing review instead.

**Q: Rating validation fails**
A: Ensure `stars` is between 1-10 (inclusive) and is an integer.

**Q: Like/Wishlist toggle not working**
A: Ensure you're sending an empty POST (no body required), not a GET request.
