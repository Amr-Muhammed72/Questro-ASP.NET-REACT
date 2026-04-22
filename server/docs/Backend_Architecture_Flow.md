# Backend Architecture Flow (Movies Domain)

This document describes the current service split and request flow for the Movies domain.

## 1) Service Decomposition

The previous monolithic movie service is split into focused services:

- `IMovieCatalogService`: discovery and recommendation reads
- `IMovieDetailsService`: movie details and staff details reads
- `IMovieInteractionService`: likes, rating, watchlist, watched, and reviews
- `IMovieSyncService`: explicit TMDB hydration/persistence

Controllers are aligned to those boundaries:

- `MoviesController` -> `/api/movies`
- `MovieInteractionsController` -> `/api/movie-interactions`
- `MovieReviewsController` -> `/api/movie-reviews`
- `MovieSyncController` -> `/api/movie-sync`
- `StaffController` -> `/api/staff`

---

## 2) Data and Sync Lifecycle

### Goals

- Keep list endpoints fast and live-first.
- Avoid N+1 database lookups in collection responses.
- Persist full local graph only when needed.

### Lifecycle Overview

```mermaid
flowchart TD
  A[Client: GET /api/movies] --> B[MovieCatalogService.GetMoviesAsync]
  B --> C[TMDB Discover/Search]
  B --> D[MapLiveMovie]
  D --> E[Return paged DTOs]

  F[Client: GET /api/movies/{tmdbId}] --> G[MovieDetailsService.GetMovieDetailsAsync]
  G --> H{Local movie exists?}
  H -- No --> I[MovieSyncService.FetchAndSaveMovieByTmdbIdAsync]
  I --> J[Persist movie, genres, staff, links]
  H -- Yes --> K[Use local graph]
  J --> K
  K --> L[Merge TMDB live details + local status]
  L --> M[Return details DTO]

  N[Client: POST /api/movie-sync/{tmdbId}] --> O[MovieSyncService.FetchAndSaveMovieByTmdbIdAsync]
  O --> P[Fetch TMDB details and credits]
  P --> Q[Upsert local entities and relations]
  Q --> R[Return MovieListItemDto]
```

### N+1 Avoidance

List reads in `MovieCatalogService` do not perform per-item local graph loading. Responses are constructed from TMDB summaries with local genre mapping only.

---

## 3) CQRS Notes

### Target rule

`GET` endpoints should be read-only and side-effect free.

### Current deviation

`GET /api/movies/{tmdbId}` can trigger local persistence on cache miss via `IMovieSyncService`.

This is an intentional practical deviation and should be treated as known technical debt if strict CQRS is enforced later.

---

## 4) Core Patterns

### Specification pattern

Query logic is encapsulated in specs (`ISpecification<T>`, `BaseSpecification<T>`) and applied through `SpecificationEvaluator`.

Examples:

- `MovieByTmdbIdSpecification`
- `MovieDetailsByTmdbIdSpecification`
- `UserMovieReviewByUserAndMovieSpecification`
- `UserMovieReviewsByMovieIdSpecification`

### Generic repository + unit of work

All writes are staged through repositories and committed via `IUnitOfWork.CompleteAsync()`.

### Manual mapping

Entity/TMDB contract to DTO mapping is explicit and in code (no AutoMapper/Mapster).

---

## 5) Command vs Query Snapshot

### Query endpoints

- `GET /api/movies`
- `GET /api/movies/trending`
- `GET /api/movies/recently-added`
- `GET /api/movies/genres`
- `GET /api/movies/recommended`
- `GET /api/movies/recommended-for-me`
- `GET /api/movies/{tmdbId}`
- `GET /api/movie-reviews/{tmdbId}`
- `GET /api/staff/{tmdbId}`

### Command endpoints

- `POST /api/movie-sync/{tmdbId}`
- `POST /api/movie-interactions/{tmdbId}/like`
- `POST /api/movie-interactions/{tmdbId}/rate`
- `POST /api/movie-interactions/{tmdbId}/watchlist`
- `POST /api/movie-interactions/{tmdbId}/watched`
- `POST /api/movie-reviews/{tmdbId}`
- `PUT /api/movie-reviews/{tmdbId}`
- `DELETE /api/movie-reviews/{tmdbId}`

---

## 6) Contributor Notes

1. Treat route id as `tmdbId` across movie-facing APIs.
2. Keep discovery endpoints live-first and lightweight.
3. Keep writes explicit through interaction/sync paths and `IUnitOfWork` boundaries.
4. Use new service boundaries when adding features; do not reintroduce a god-object service.
