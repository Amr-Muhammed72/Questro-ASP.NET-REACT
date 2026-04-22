# Business Rules and Triggers (Movies Domain)

This document captures current business behavior, security constraints, and ML/gamification placeholders after the controller/service split.

## 1) Auto-Watch Rule

### Rule definition

When a user rates, reviews, or explicitly marks watched, the movie is ensured as watched.

Side effects:

1. Ensure one `UserMovieWatched` row exists for `(UserId, MovieId)`.
2. Remove the same movie from `UserMovieWatchlist` if present.

### Execution point

`MovieInteractionService` uses `EnsureWatchedAndCleanupWatchlistAsync(userId, movieId, ct)` in:

- `SetRatingAsync`
- `AddReviewAsync`
- `UpdateReviewAsync`
- `MarkWatchedAsync`

### Idempotency

- The helper checks existing watched record before insert.
- Repeated actions do not duplicate watched rows.

---

## 2) Review Ownership Constraint and IDOR Protection

### Core rule

Reviews are owned by `(UserId, MovieId)`.

- One review per user per movie.
- No review-id based update/delete route.
- User can update/delete only their own review.

### API shape

- `GET /api/movie-reviews/{tmdbId}`
- `POST /api/movie-reviews/{tmdbId}` (auth)
- `PUT /api/movie-reviews/{tmdbId}` (auth)
- `DELETE /api/movie-reviews/{tmdbId}` (auth)

### Security mechanism

1. Controller resolves current `userId` from auth claims.
2. Service queries with `UserMovieReviewByUserAndMovieSpecification(userId, movieId)`.
3. Missing owned review returns `ReviewNotFound`.

Ownership is enforced server-side in query criteria, preventing IDOR by route/body tampering.

---

## 3) Trigger and Validation Summary

### Rating trigger

- Validates stars in range 1..5.
- Upserts `UserMovieRate`.
- Applies auto-watch rule.
- Commits via unit of work.
- Calls gamification hook placeholder.

### Review create/update trigger

- Validates review body (required, max length).
- Create rejects duplicate review (`ReviewAlreadyExists`).
- Update requires owned existing review.
- Applies auto-watch rule.
- Commits via unit of work.
- Calls gamification hook placeholder.

### Explicit watched trigger

- Applies auto-watch rule directly.
- Commits via unit of work.
- Calls gamification hook placeholder.

---

## 4) Recommendation and ML Placeholder

### `recommended-for-me` temporary behavior

Endpoint:

- `GET /api/movies/recommended-for-me` (auth)

Current behavior is intentionally temporary:

- `GetRecommendedForMeAsync(userId, take)` delegates to generic recommendation (`GetRecommendedAsync(take)`).
- `userId` is currently ignored in ranking.
- No personalization model is applied yet.

This keeps contract stability while waiting for the ML team design.

### Review sentiment placeholder

`UserMovieReview.Sentiment` remains nullable and currently stays `null` on create/update.

Future options:

1. Async sentiment processing after write.
2. Batch sentiment jobs on historical reviews.
3. Use sentiment as a recommendation feature.

### Gamification placeholder

`TriggerGamificationCheckAsync(userId)` is still a no-op hook called from rating/review/watched flows.

---

## 5) Integration Contract for Upcoming ML Work

1. Keep interaction writes low-latency; run heavy ML work asynchronously.
2. Preserve current response contracts while enriching recommendation internals.
3. Continue using `tmdbId` as API route identity and local `MovieId` as persistence key.
4. Reuse existing hooks (`recommended-for-me`, review sentiment field, gamification trigger) before adding new side-effect routes.
