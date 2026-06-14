# Home Page Survey - Frontend Integration Guide

This document provides details for the frontend team to integrate the "Home Page Survey" feature. This feature captures the user's country and their top liked/disliked genres for both movies and games, and saves them to the user's profile.

## Endpoint Details

- **URL:** `POST /api/users/survey`
- **Authentication:** **Required** (Bearer Token)
- **Content-Type:** `application/json`

## Request Payload

The endpoint expects a JSON body mapping to the `SubmitSurveyRequestDto` schema. 

### Constraints
- **Required fields:** `likedMovieGenres` and `likedGameGenres` must be provided and contain **at least 1 item**.
- **Genres limit:** Each genre array (`likedMovieGenres`, `dislikedMovieGenres`, `likedGameGenres`, `dislikedGameGenres`) must contain **at most 3 items**.
- Other fields (`country`, `dislikedMovieGenres`, `dislikedGameGenres`) are optional.

### Schema

```ts
interface SubmitSurveyRequestDto {
  country?: string;
  likedMovieGenres?: string[];
  dislikedMovieGenres?: string[];
  likedGameGenres?: string[];
  dislikedGameGenres?: string[];
}
```

### Example Request

```json
{
  "country": "US",
  "likedMovieGenres": ["Action", "Sci-Fi", "Comedy"],
  "dislikedMovieGenres": ["Horror"],
  "likedGameGenres": ["RPG", "FPS"],
  "dislikedGameGenres": ["Puzzle", "Sports"]
}
```

## Responses

### 1. Success (200 OK)
Returns the updated `UserProfileDto` for the current user.

```json
{
  "data": {
    "userId": 123,
    "userName": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    // ... other profile properties
  },
  "isSuccess": true,
  "error": null
}
```

### 2. Validation Error (400 Bad Request)
If the frontend sends more than 3 genres in any of the arrays, the API will return a validation error.

```json
{
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "LikedMovieGenres": [
      "Up to 3 liked movie genres at most are allowed."
    ]
  }
}
```

### 3. Unauthorized (401 Unauthorized)
Returned if the user is not logged in or the bearer token is invalid/expired.

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "traceId": "00-xxxxxxxxxxx-xxxxxxxxxxx-00"
}
```

## Important Notes for Frontend
- Make sure to validate on the client side that the user selects **at least 1 and a maximum of 3 genres** for liked movies and games before enabling the submit button.
- Disliked genres and country remain optional, but also have a max limit of 3 genres.
- The genre names should ideally match the predefined genres provided by the game/movie catalogs.
- Calling this endpoint overwrites the existing arrays for the user in the database. If they submit the survey again, their old genre choices will be completely replaced by the new payload.
