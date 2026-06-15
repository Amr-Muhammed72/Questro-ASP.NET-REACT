# Frontend API Integration

This guide covers all backend endpoints the frontend needs to integrate against. It is organized by domain and includes request/response shapes, authentication requirements, error codes, and frontend-specific guidelines.

## Table of Contents

- [Base URL](#base-url)
- [Error Envelope](#error-envelope)
- [Route Map (Quick Reference)](#route-map-quick-reference)
- [Part A — Movies Domain](#part-a--movies-domain)
- [Part B — User Profile](#part-b--user-profile)
- [Part C — User Libraries (Movies & Games)](#part-c--user-libraries-movies--games)
- [Part D — Social Network (Follow System)](#part-d--social-network-follow-system)
- [Part E — Notifications](#part-e--notifications)
- [Part F — Family Management & Parental Controls (Blacklist)](#part-f--family-management--parental-controls-blacklist)
- [Consolidated Frontend Guidelines](#consolidated-frontend-guidelines)

---

## Base URL

- Local: `http://localhost:5222`
- Static files (profile pictures, uploads): `http://localhost:5222/uploads/...`

---

## Error Envelope (All Features)

Every failing endpoint returns the same envelope:

```json
{
  "code": "Movie.InvalidTmdbId",
  "en": "TMDB id must be greater than zero.",
  "Details": null
}
```

| Field | Type | Description |
|---|---|---|
| `code` | `string` | Machine-readable error code (e.g. `Social.AlreadyFollowing`) |
| `en` | `string` | English human-readable message |
| `Details` | `string[]?` | Optional validation details array |

Frontend should switch on `code` for conditional UI and display `en` as the user-facing message.

---

## Paginated Response Envelope

All paginated endpoints return a `PagedResponse<T>`:

```json
{
  "data": [],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 142,
  "totalPages": 8
}
```

---

## Route Map (Quick Reference)

### Movies routes

- `GET /api/movies`
- `GET /api/movies/trending?take=20`
- `GET /api/movies/recently-added?take=20`
- `GET /api/movies/genres`
- `GET /api/movies/recommended?take=20`
- `GET /api/movies/recommended-for-me?take=20` (auth)
- `GET /api/movies/{tmdbId}`

### Games routes

- `GET /api/Games`
- `GET /api/Games/trending?take=30`
- `GET /api/Games/recently-added?take=20`
- `GET /api/Games/genres`
- `GET /api/Games/tags` (returns one non-paginated array)
- `GET /api/Games/platforms`
- `GET /api/Games/recommended-for-me?take=20` (auth)
- `GET /api/Games/{rawgId}`

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

### Profile routes

- `GET /api/users/{userId}/profile`
- `PUT /api/users/profile` (auth)
- `POST /api/users/profile/picture` (auth)

### User library routes

- `GET /api/users/{userId}/movies/watchlist`
- `GET /api/users/{userId}/movies/liked`
- `GET /api/users/{userId}/movies/rated`
- `GET /api/users/{userId}/movies/watched`
- `GET /api/users/{userId}/games/wishlist`
- `GET /api/users/{userId}/games/liked`
- `GET /api/users/{userId}/games/rated`

### Social network routes

- `POST /api/users/{userId}/follow` (auth)
- `DELETE /api/users/{userId}/follow` (auth)
- `GET /api/users/{userId}/followers`
- `GET /api/users/{userId}/following`
- `GET /api/users/{userId}/follow-stats`

### Notification routes (all auth required)

- `GET /api/notifications?pageIndex=1&pageSize=20`
- `POST /api/notifications/{notificationId}/read`
- `POST /api/notifications/read-all`
- `GET /api/notifications/unread-count`

### Family management routes (auth required)

- `POST /api/family/children` (create child account)
- `GET /api/family/children` (list parent's children)
- `PUT /api/family/children/{childId}/restrictions` (update child restrictions)
- `GET /api/users/me/restrictions` (get current user's own restrictions)

---

# Part A — Movies Domain

## Critical Frontend Note: `movieId` vs `tmdbId`

Discovery list endpoints are live/TMDB-driven. Some list items are not persisted locally yet.

- `movieId` can be `0`
- `tmdbId` is the stable route identifier for details, interactions, reviews, sync, and staff

Always pass `movie.tmdbId` from cards/lists into route params.

---

### ⚠️ CRITICAL: Search vs. Discover Modes (UI/UX Guidelines)

Because movie and game data is sourced from TMDB and RAWG, there is a strict separation between text search and filter-based discovery. This applies to both `GET /api/movies` and `GET /api/games`.

1) The limitation

- TMDB and RAWG text search endpoints do not honor filters like rating, year, genre, or tags.
- TMDB and RAWG discover endpoints support filters (rating, year, genre, tags, language), but they do not support free-text search.

2) Frontend rule (must follow)

- Do NOT send `search` together with `minRating`, `maxRating`, `genreId`, `tags`, or `year`.

3) UI/UX recommendation

- Search Mode: a simple text bar only. When the user types, disable all filters.
- Explore/Discover Mode: advanced filter UI (ratings, genres, years) with no free-text search bar.

This separation prevents broken pagination and unexpected empty pages.

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

# Part B — User Profile

Profile endpoints manage a user's public profile data, privacy settings, and profile picture.

- Profile read: `/api/users/{userId}/profile`
- Profile update: `/api/users/profile`
- Picture upload: `/api/users/profile/picture`

## 6) Get User Profile

- Method: `GET`
- URL: `/api/users/{userId}/profile`
- Auth: Optional (if token is provided, `isFollowedByCurrentUser` is populated)

Response — `UserProfileDto`:

```json
{
  "userId": 42,
  "userName": "amr_m",
  "firstName": "Amr",
  "lastName": "Muhammed",
  "bio": "Movie buff and RPG addict.",
  "gender": "Male",
  "profilePicUrl": "/uploads/profile-pictures/a1b2c3d4.jpg",
  "joinDate": "2026-01-15T00:00:00Z",
  "primaryInterest": "Mixed",
  "isHistoryPublic": true,
  "followersCount": 128,
  "followingCount": 53,
  "isFollowedByCurrentUser": false
}
```

| Field | Type | Notes |
|---|---|---|
| `userId` | `long` | Unique user identifier |
| `userName` | `string` | Display name |
| `profilePicUrl` | `string?` | Relative URL — prepend base URL to construct full path |
| `primaryInterest` | `string` | One of: `"Mixed"`, `"Movies"`, `"Games"` |
| `isHistoryPublic` | `bool` | `true` = library endpoints are accessible by others |
| `isFollowedByCurrentUser` | `bool` | Only meaningful if a bearer token is sent |

**Frontend note:** To display the profile picture, construct the full URL:

```javascript
const fullPicUrl = profilePicUrl
  ? `${BASE_URL}${profilePicUrl}`
  : DEFAULT_AVATAR;
```

---

## 7) Update Profile

- Method: `PUT`
- URL: `/api/users/profile`
- Auth: Yes

All fields are optional. Only send what needs to change.

Request — `UpdateProfileRequestDto`:

```json
{
  "firstName": "Amr",
  "lastName": "Muhammed",
  "bio": "Updated bio.",
  "gender": "Male",
  "birthDate": "1998-06-15T00:00:00Z",
  "primaryInterest": 0,
  "isHistoryPublic": false
}
```

| Field | Type | Notes |
|---|---|---|
| `firstName` | `string?` | |
| `lastName` | `string?` | |
| `bio` | `string?` | |
| `gender` | `string?` | |
| `birthDate` | `DateTime?` | ISO 8601 |
| `primaryInterest` | `int?` | `0` = Mixed, `1` = Movies, `2` = Games |
| `isHistoryPublic` | `bool?` | Controls library privacy |

Response: Returns the updated `UserProfileDto` (same shape as GET).

---

## 8) Upload Profile Picture

- Method: `POST`
- URL: `/api/users/profile/picture`
- Auth: Yes
- Content-Type: `multipart/form-data`
- Max file size: **5 MB**
- Allowed extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

Response: Returns the new relative URL as a string:

```json
"/uploads/profile-pictures/e4f5a6b7.png"
```

### cURL Example

```bash
curl -X POST "http://localhost:5222/api/users/profile/picture" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/photo.jpg"
```

### JavaScript Fetch Example

```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const res = await fetch(`${BASE_URL}/api/users/profile/picture`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData
  // NOTE: Do NOT set Content-Type header manually — the browser sets it with the boundary
});

const newUrl = await res.json();
```

### Error Codes

| Code | Status | Meaning |
|---|---|---|
| `File.Empty` | 400 | No file was attached |
| `File.TooLarge` | 400 | File exceeds 5 MB |
| `User.NotFound` | 404 | Invalid token / user does not exist |

---

# Part C — User Libraries (Movies & Games)

These endpoints retrieve a specific user's interaction history: their watchlist, liked items, rated items, and watched/played history.

### ⚠️ Privacy Rule

If User A requests User B's library and User B has set `isHistoryPublic: false`, the API returns **403 Forbidden** with error code `Social.HistoryIsPrivate`. A user can always access their own library regardless of this setting.

**Frontend guideline:** On a profile page, check `isHistoryPublic` from the profile response. If `false` and the profile does not belong to the current user, hide the library tabs and show a "This user's history is private" message instead of making the API call.

---

## 9) Movie Library

Base URL: `/api/users/{userId}/movies`

All endpoints share these properties:

- Method: `GET`
- Auth: Optional (token used to determine if requester is the owner)
- Pagination: `?pageIndex=1&pageSize=20`

| Endpoint | URL |
|---|---|
| Watchlist | `GET /api/users/{userId}/movies/watchlist` |
| Liked | `GET /api/users/{userId}/movies/liked` |
| Rated | `GET /api/users/{userId}/movies/rated` |
| Watched | `GET /api/users/{userId}/movies/watched` |

Response — `PagedResponse<UserLibraryMovieItemDto>`:

```json
{
  "data": [
    {
      "tmdbId": 550,
      "title": "Fight Club",
      "posterUrl": "https://image.tmdb.org/t/p/w500/poster.jpg",
      "timestamp": "2026-05-10T14:22:00Z",
      "rating": null
    },
    {
      "tmdbId": 155,
      "title": "The Dark Knight",
      "posterUrl": "https://image.tmdb.org/t/p/w500/poster2.jpg",
      "timestamp": "2026-05-08T09:15:00Z",
      "rating": 5
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 47,
  "totalPages": 3
}
```

| Field | Type | Notes |
|---|---|---|
| `tmdbId` | `int` | Use this for routing to movie details |
| `title` | `string` | Movie title |
| `posterUrl` | `string?` | Full TMDB poster URL |
| `timestamp` | `DateTime` | When the interaction occurred |
| `rating` | `int?` | Only populated for the `/rated` endpoint (1–5 stars) |

### Frontend Example

```javascript
const res = await fetch(
  `${BASE_URL}/api/users/${userId}/movies/watchlist?pageIndex=1&pageSize=20`,
  { headers: { Authorization: `Bearer ${token}` } }
);

if (res.status === 403) {
  // User's history is private — show privacy notice
  showPrivateHistoryMessage();
} else {
  const data = await res.json();
  renderMovieGrid(data.data);
}
```

---

## 10) Game Library

Base URL: `/api/users/{userId}/games`

Same authentication and pagination as movie library.

| Endpoint | URL |
|---|---|
| Wishlist | `GET /api/users/{userId}/games/wishlist` |
| Liked | `GET /api/users/{userId}/games/liked` |
| Rated | `GET /api/users/{userId}/games/rated` |

Response — `PagedResponse<UserLibraryGameItemDto>`:

```json
{
  "data": [
    {
      "rawgId": 3498,
      "name": "Grand Theft Auto V",
      "backgroundImage": "https://media.rawg.io/media/games/bg.jpg",
      "timestamp": "2026-04-20T11:30:00Z",
      "rating": null
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 12,
  "totalPages": 1
}
```

| Field | Type | Notes |
|---|---|---|
| `rawgId` | `int` | Use this for routing to game details |
| `name` | `string` | Game name |
| `backgroundImage` | `string?` | RAWG background image URL |
| `timestamp` | `DateTime` | When the interaction occurred |
| `rating` | `int?` | Only populated for the `/rated` endpoint |

### Library Error Codes

| Code | Status | Meaning |
|---|---|---|
| `Social.HistoryIsPrivate` | 403 | Target user's library is private |
| `User.NotFound` | 404 | Target user does not exist |

---

# Part D — Social Network (Follow System)

The follow system uses the existing `UserFollow` entity. The `userId` in the route always refers to the **target user** (the user being followed/unfollowed/viewed).

## 11) Follow a User

- Method: `POST`
- URL: `/api/users/{userId}/follow`
- Auth: Yes
- Body: None

Response on success:

```json
true
```

### Error Codes

| Code | Status | Meaning |
|---|---|---|
| `Social.CannotFollowSelf` | 400 | User tried to follow themselves |
| `Social.UserNotFound` | 404 | Target user does not exist |
| `Social.AlreadyFollowing` | 409 | Already following this user |

---

## 12) Unfollow a User

- Method: `DELETE`
- URL: `/api/users/{userId}/follow`
- Auth: Yes
- Body: None

Response on success:

```json
true
```

### Error Codes

| Code | Status | Meaning |
|---|---|---|
| `Social.CannotFollowSelf` | 400 | User tried to unfollow themselves |
| `Social.NotFollowing` | 404 | Not currently following this user |

---

## 13) Get Followers

- Method: `GET`
- URL: `/api/users/{userId}/followers?pageIndex=1&pageSize=20`
- Auth: No

Response — `PagedResponse<UserFollowDto>`:

```json
{
  "data": [
    {
      "userId": 7,
      "userName": "sarah_k",
      "profilePicUrl": "/uploads/profile-pictures/abc123.jpg",
      "followedAt": "2026-04-10T18:30:00Z"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 128,
  "totalPages": 7
}
```

---

## 14) Get Following

- Method: `GET`
- URL: `/api/users/{userId}/following?pageIndex=1&pageSize=20`
- Auth: No

Response: Same `PagedResponse<UserFollowDto>` shape as followers.

---

## 15) Get Follow Stats

- Method: `GET`
- URL: `/api/users/{userId}/follow-stats`
- Auth: Optional (if token is sent, `isFollowedByCurrentUser` is populated)

Response — `FollowStatsDto`:

```json
{
  "followersCount": 128,
  "followingCount": 53,
  "isFollowedByCurrentUser": true
}
```

**Frontend guideline:** Use this endpoint to render the Follow/Unfollow button state on a user's profile card. If `isFollowedByCurrentUser` is `true`, render "Unfollow"; otherwise render "Follow".

### Follow/Unfollow Frontend Pattern

```javascript
// Toggle follow state
async function toggleFollow(targetUserId, isCurrentlyFollowing) {
  const method = isCurrentlyFollowing ? "DELETE" : "POST";

  const res = await fetch(`${BASE_URL}/api/users/${targetUserId}/follow`, {
    method,
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json();
    showToast(err.en);
    return;
  }

  // Optimistically update button state
  setFollowing(!isCurrentlyFollowing);
}
```

---

# Part E — Notifications

All notification endpoints require authentication. Notifications are generated by a daily background job (Hangfire) that checks for newly added movies and games in the last 24 hours and broadcasts alerts to all users.

## 16) Get My Notifications

- Method: `GET`
- URL: `/api/notifications?pageIndex=1&pageSize=20`
- Auth: Yes

Response — `PagedResponse<NotificationDto>`:

```json
{
  "data": [
    {
      "id": 12,
      "title": "New Movies Available!",
      "body": "5 new movie(s) have been added to the catalog. Check them out!",
      "type": "NewMovie",
      "referenceId": null,
      "isRead": false,
      "createdAt": "2026-05-14T00:00:00Z",
      "readAt": null
    },
    {
      "id": 8,
      "title": "New Games Available!",
      "body": "2 new game(s) have been added to the catalog. Check them out!",
      "type": "NewGame",
      "referenceId": null,
      "isRead": true,
      "createdAt": "2026-05-13T00:00:00Z",
      "readAt": "2026-05-13T10:30:00Z"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 2,
  "totalPages": 1
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | `int` | UserNotification ID — use this for `mark-as-read` |
| `title` | `string` | Notification headline |
| `body` | `string` | Notification description |
| `type` | `string` | One of: `"NewMovie"`, `"NewGame"`, `"General"` |
| `referenceId` | `int?` | Optional content ID for deep-linking (reserved for future use) |
| `isRead` | `bool` | Whether the user has read this notification |
| `createdAt` | `DateTime` | When the notification was created |
| `readAt` | `DateTime?` | When the notification was read (null if unread) |

---

## 17) Mark Notification as Read

- Method: `POST`
- URL: `/api/notifications/{notificationId}/read`
- Auth: Yes
- Body: None

Response on success:

```json
true
```

| Error Code | Status | Meaning |
|---|---|---|
| `Notification.NotFound` | 404 | Notification does not exist or belongs to another user |

---

## 18) Mark All Notifications as Read

- Method: `POST`
- URL: `/api/notifications/read-all`
- Auth: Yes
- Body: None

Response on success:

```json
true
```

---

## 19) Get Unread Notification Count

- Method: `GET`
- URL: `/api/notifications/unread-count`
- Auth: Yes

Response:

```json
5
```

**Frontend guideline:** Poll this endpoint (or call it on page load / focus) to render a notification badge. A simple pattern:

```javascript
async function updateBadge() {
  const res = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const count = await res.json();
  setBadgeCount(count);
}

// Call on app mount and periodically
updateBadge();
setInterval(updateBadge, 60_000); // Poll every 60 seconds
```

---

# Part F — Family Management & Parental Controls (Blacklist)

The family management system uses a **Blacklist** architecture: parents select genres to **block** (hide from their child). Everything not in the blocklist is allowed.

---

## 20) Create Child Account

- Method: `POST`
- URL: `/api/family/children`
- Auth: Yes (parent only)

Request — `CreateChildAccountRequestDto`:

```json
{
  "userName": "ali_jr",
  "email": "parent+ali@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "Ali",
  "lastName": "Hassan",
  "birthDate": "2015-03-20T00:00:00Z",
  "blockedMovieGenreIds": [27, 53],
  "blockedGameGenreIds": [59],
  "maxContentRating": "PG-13",
  "maxMetacriticRating": 3
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `userName` | `string` | ✅ | Unique username for the child |
| `email` | `string` | ✅ | Email address (can be a `parent+alias@domain.com` alias) |
| `password` | `string` | ✅ | Must satisfy Identity password rules |
| `confirmPassword` | `string` | ✅ | Must match `password` |
| `firstName` | `string?` | ❌ | Child's first name |
| `lastName` | `string?` | ❌ | Child's last name |
| `birthDate` | `DateTime?` | ❌ | Child's date of birth |
| `blockedMovieGenreIds` | `int[]?` | ❌ | TMDB genre IDs to **block** (e.g., `27` = Horror, `53` = Thriller) |
| `blockedGameGenreIds` | `int[]?` | ❌ | RAWG genre IDs to **block** (e.g., `59` = Massively Multiplayer) |
| `maxContentRating` | `string?` | ❌ | Maximum TMDB certification allowed (e.g., `"G"`, `"PG"`, `"PG-13"`, `"R"`) |
| `maxMetacriticRating` | `int?` | ❌ | Maximum RAWG rating cap (0–5 scale) |

> **Tip:** If the parent doesn't have a real email for the child, use a plus-alias pattern: `parentemail+childname@gmail.com`.

Response on success — `ChildAccountResponseDto`:

```json
{
  "userId": 42,
  "userName": "ali_jr",
  "firstName": "Ali",
  "lastName": "Hassan",
  "birthDate": "2015-03-20T00:00:00Z",
  "restrictions": {
    "blockedMovieGenreIds": [27, 53],
    "blockedGameGenreIds": [59],
    "maxContentRating": "PG-13",
    "maxMetacriticRating": 3
  }
}
```

### Error Codes

| Code | Status | Meaning |
|---|---|---|
| `Family.ChildCannotHaveChildren` | 403 | Caller is a child account, not a parent |
| `User.UserNameAlreadyExists` | 409 | Username already taken |
| `User.EmailAlreadyExists` | 409 | Email already registered |
| `Family.CreateChildFailed` | 500 | Unexpected Identity error (check `Details`) |

---

## 21) List Children

- Method: `GET`
- URL: `/api/family/children`
- Auth: Yes (parent only)

Response — `ChildAccountResponseDto[]`:

```json
[
  {
    "userId": 42,
    "userName": "ali_jr",
    "firstName": "Ali",
    "lastName": "Hassan",
    "birthDate": "2015-03-20T00:00:00Z",
    "restrictions": {
      "blockedMovieGenreIds": [27, 53],
      "blockedGameGenreIds": [59],
      "maxContentRating": "PG-13",
      "maxMetacriticRating": 3
    }
  }
]
```

> **Note:** Each child object includes their full `restrictions` sub-object. If a child has no restrictions configured, `restrictions` will be `null`.

---

## 22) Update Child Restrictions

- Method: `PUT`
- URL: `/api/family/children/{childId}/restrictions`
- Auth: Yes (parent only)
- Path param: `childId` — the `userId` of the child to update

Request — `ChildRestrictionDto`:

```json
{
  "blockedMovieGenreIds": [27, 53, 80],
  "blockedGameGenreIds": [59, 2],
  "maxContentRating": "PG",
  "maxMetacriticRating": 2
}
```

| Field | Type | Description |
|---|---|---|
| `blockedMovieGenreIds` | `int[]` | Complete list of TMDB genre IDs to block (**replaces** previous list) |
| `blockedGameGenreIds` | `int[]` | Complete list of RAWG genre IDs to block (**replaces** previous list) |
| `maxContentRating` | `string?` | TMDB certification cap (e.g., `"PG-13"`) |
| `maxMetacriticRating` | `int?` | RAWG rating cap (0–5 scale) |

> **⚠️ This is a full replacement, not a partial patch.** Always send the complete restriction object. Sending `blockedMovieGenreIds: []` will **clear** all movie genre restrictions.

Response on success — the updated `ChildRestrictionDto` (same shape as request).

### Error Codes

| Code | Status | Meaning |
|---|---|---|
| `Family.ChildNotFound` | 404 | No user with this `childId` exists |
| `Family.ChildNotOwned` | 403 | This child doesn't belong to the authenticated parent |

---

## 23) Get Current User's Restrictions

- Method: `GET`
- URL: `/api/users/me/restrictions`
- Auth: Yes

This endpoint tells the frontend whether the logged-in user is a child account and what restrictions apply.

Response when the user is an **adult** (not a child account):

```json
null
```

Response when the user is a **child** account:

```json
{
  "blockedMovieGenreIds": [27, 53],
  "blockedGameGenreIds": [59],
  "maxContentRating": "PG-13",
  "maxMetacriticRating": 3
}
```

### Frontend UI Rules — The Blacklist Approach

On app startup or login, the React client should:

1. **Call `GET /api/users/me/restrictions`** and store the result in global state (e.g., React Context, Zustand, Redux).
2. **If the response is `null`** → the user is an adult. Render the full UI with no restrictions.
3. **If the response contains a `ChildRestrictionDto`** → the user is a child. Apply these UI rules:

**Genre Dropdowns & Filters:**

```javascript
// Filter out blocked genres from a movie genre selector
const visibleGenres = allGenres.filter(
  genre => !restrictions.blockedMovieGenreIds.includes(genre.id)
);
```

Remove blocked genre IDs from all genre dropdowns, filter chips, and sidebar navigation for both Movies and Games.

**Rating Filters:** If `maxContentRating` is set (e.g., `"PG-13"`), hide the rating filter or limit its range. Same applies to `maxMetacriticRating` for game rating filters.

---

## 24) Safe Discovery — Transparent to Frontend

**No frontend changes are required for safe content discovery.** The backend handles all filtering automatically.

When a child account is logged in and calls any standard content endpoint, the backend automatically applies the **Blacklist filter** server-side. The child only receives results that do **not** contain any of their blocked genres.

### Affected Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/movies` | Discover & Search movies |
| `GET /api/movies/trending` | Trending movies |
| `GET /api/movies/recently-added` | Recently added movies |
| `GET /api/movies/recommended` | Recommended movies |
| `GET /api/games` | Discover & Search games |
| `GET /api/games/trending` | Trending games |
| `GET /api/games/recently-added` | Recently added games |

### Key Points

- **No new query parameters** are needed. Existing endpoints work exactly as before.
- **Authentication is optional** on these endpoints. If no token is sent, standard unfiltered results are returned. If a child's token is sent, results are automatically filtered.
- **Pagination works normally.** The `totalCount` and `totalPages` values in the response reflect the **filtered** totals.
- **Cache behavior:** Filtered results are cached server-side for **30 minutes** per child. The cache automatically invalidates when a parent updates the child's restrictions. The child does **not** need to log out and back in.

---

## 25) Privacy Bypass for Parents

When a parent requests their child's movie or game library, the backend **automatically bypasses** the child's privacy settings — even if `isHistoryPublic` is `false`.

| Scenario | `isHistoryPublic` | Result |
|---|---|---|
| Random user requests child's library | `false` | ❌ 403 Forbidden |
| Random user requests child's library | `true` | ✅ Allowed |
| **Parent** requests their **own child's** library | `false` | ✅ **Allowed (bypass)** |
| **Parent** requests their **own child's** library | `true` | ✅ Allowed |

Affected endpoints:

- `GET /api/users/{childId}/movies/watchlist`
- `GET /api/users/{childId}/movies/liked`
- `GET /api/users/{childId}/movies/rated`
- `GET /api/users/{childId}/movies/watched`
- `GET /api/users/{childId}/games/wishlist`
- `GET /api/users/{childId}/games/liked`
- `GET /api/users/{childId}/games/rated`

**Frontend note:** When the parent navigates to a child's profile from the Parent Dashboard, simply pass the child's `userId` in the URL. No special headers or flags are needed.

```javascript
// Parent viewing their child's movie watchlist
const res = await fetch(`${BASE_URL}/api/users/${child.userId}/movies/watchlist`, {
  headers: { Authorization: `Bearer ${parentToken}` }
});
// Works even if child.isHistoryPublic === false
```

---

## 26) Change Child Password

- Method: `PUT`
- URL: `/api/family/children/{childId}/password`
- Auth: Yes (parent only)

Request — `ChangeChildPasswordRequestDto`:

```json
{
  "newPassword": "NewSecurePass123!",
  "confirmNewPassword": "NewSecurePass123!"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `newPassword` | `string` | ✅ | Must satisfy Identity password rules |
| `confirmNewPassword` | `string` | ✅ | Must match `newPassword` |

Response on success: HTTP 200 OK

### Error Codes

| Code | Status | Meaning |
|---|---|---|
| `Family.ChildNotFound` | 404 | No user with this `childId` exists |
| `Family.ChildNotOwned` | 403 | This child doesn't belong to the authenticated parent |
| `Family.ChangePasswordFailed` | 500 | Identity failed to change password (check `Details`) |

---

## 27) Delete Child Account

- Method: `DELETE`
- URL: `/api/family/children/{childId}`
- Auth: Yes (parent only)

Response on success: HTTP 200 OK

### Error Codes

| Code | Status | Meaning |
|---|---|---|
| `Family.ChildNotFound` | 404 | No user with this `childId` exists |
| `Family.ChildNotOwned` | 403 | This child doesn't belong to the authenticated parent |
| `Family.DeleteChildFailed` | 500 | Identity failed to delete account (check `Details`) |

---

# Consolidated Frontend Guidelines

## Authentication

All endpoints marked with "Auth: Yes" require a bearer token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Endpoints marked "Auth: Optional" will function without a token but return additional context (like `isFollowedByCurrentUser` or `userStatus`) when one is provided.

## Complete Error Code Reference (Phase 2)

### Profile Errors

| Code | Status | Description |
|---|---|---|
| `User.NotFound` | 404 | User does not exist |
| `File.Empty` | 400 | No file attached to upload |
| `File.TooLarge` | 400 | File exceeds 5 MB limit |

### Social Errors

| Code | Status | Description |
|---|---|---|
| `Social.AlreadyFollowing` | 409 | Already following this user |
| `Social.CannotFollowSelf` | 400 | Cannot follow yourself |
| `Social.NotFollowing` | 404 | Not currently following this user |
| `Social.UserNotFound` | 404 | Target user does not exist |
| `Social.HistoryIsPrivate` | 403 | User's library is private |

### Notification Errors

| Code | Status | Description |
|---|---|---|
| `Notification.NotFound` | 404 | Notification does not exist or does not belong to the user |
| `Notification.Unauthorized` | 403 | Not authorized to access this notification |

### Family Errors

| Code | Status | Description |
|---|---|---|
| `Family.NotAParent` | 403 | Only parent accounts can manage children |
| `Family.ChildNotFound` | 404 | Child account not found |
| `Family.ChildNotOwned` | 403 | This child does not belong to your account |
| `Family.ChildCannotHaveChildren` | 403 | Child accounts cannot create sub-accounts |
| `Family.CreateChildFailed` | 500 | Unexpected error during child creation (check `Details`) |
| `Family.ChangePasswordFailed` | 500 | Unexpected error during password change (check `Details`) |
| `Family.DeleteChildFailed` | 500 | Unexpected error during child deletion (check `Details`) |
| `Family.RestrictionsNotFound` | 404 | Restrictions record not found for this child |

## Profile Picture Handling

Profile pictures are stored at the server and served as static files. The `profilePicUrl` returned by the API is a **relative path** (e.g. `/uploads/profile-pictures/guid.jpg`). Always prepend the base URL:

```javascript
function getProfilePicUrl(relativePath) {
  if (!relativePath) return "/default-avatar.png";
  return `${BASE_URL}${relativePath}`;
}
```

## Privacy-Aware UI Pattern

When rendering another user's profile page:

```javascript
function renderProfilePage(profile, isOwnProfile) {
  // Always show: name, bio, avatar, follower counts, follow button
  renderProfileHeader(profile);

  if (isOwnProfile || profile.isHistoryPublic) {
    // Show library tabs (Watchlist, Liked, Rated, Watched)
    renderLibraryTabs(profile.userId);
  } else {
    // Show privacy notice instead of library
    showMessage("This user's history is private.");
  }
}
```

## Quick Integration Checklist

1. Always route by `tmdbId` (movies) or `rawgId` (games), not internal IDs, from list cards.
2. Expect `movieId` to be `0` in live discovery results.
3. Send bearer token on all interaction, profile update, follow, and notification endpoints.
4. Handle the standard error envelope (`code`, `en`, `Details`) — switch on `code` for business logic.
5. Treat reviews as one-per-user-per-movie (update existing instead of creating duplicates).
6. Prepend base URL to all `profilePicUrl` values before rendering.
7. Check `isHistoryPublic` before calling library endpoints for other users.
8. Use `DELETE` (not `POST`) for the unfollow action.
9. Use `multipart/form-data` for picture upload — do not set `Content-Type` header manually.
10. Poll `/api/notifications/unread-count` on app mount and periodically for the notification badge.
11. Call `GET /api/users/me/restrictions` on login and store in global state to detect child accounts.
12. Hide blocked genres from all genre dropdowns and filter UIs when restrictions are active.
13. Content endpoints auto-filter for child accounts — no extra query params needed.
