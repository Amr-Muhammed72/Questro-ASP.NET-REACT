# Backend Architecture Flow (Movies Domain)

This document explains how data moves through the Movies domain and why the current architecture was chosen.

## 1) Data Sync Lifecycle

## Goals

- Keep discovery endpoints fast.
- Avoid N+1 local database queries in list scenarios.
- Persist complete movie metadata only when needed.

## Lifecycle Overview

```mermaid
flowchart TD
  A[Client: Discovery GET /api/movies] --> B[MovieService.GetMoviesAsync]
  B --> C[TMDB Discover/Search API]
  B --> D[BuildLocalMovieIdMapAsync]
  D --> E[Single batched local query by tmdb ids]
  B --> F[MapLiveMovie summary DTOs]
  F --> G[Return paged list]

  H[Client: Details GET /api/movies/{tmdbId}] --> I[MovieService.GetMovieDetailsAsync]
  I --> J[EnsureLocalMovieAsync(syncCredits: true)]
  J --> K{Local movie exists?}
  K -- Yes --> L[Read local movie + local relations]
  K -- No --> M[Fetch TMDB details]
  M --> N[Persist movie + genres]
  N --> O[Fetch credits and sync staff links]
  O --> L
  L --> P[Merge TMDB live details + local status]
  P --> Q[Return details DTO]

  R[Client: Explicit sync POST /api/movies/fetch/{tmdbId}] --> S[FetchAndSaveMovieByTmdbIdAsync]
  S --> T[Fetch TMDB details + credits]
  T --> U[Persist/update movie + staff links]
  U --> V[Return list-item DTO]
```

## N+1 Avoidance Strategy

List endpoints avoid per-item local lookups.

- `GetMoviesAsync` fetches TMDB results once.
- `BuildLocalMovieIdMapAsync` performs one batched local query for all TMDB ids in the page.
- Mapping (`MapLiveMovie`) uses this map to enrich each item without extra database round-trips.

Result: no local per-row query loop for list response construction.

## When full details are fetched and persisted

- Explicit sync command:
  - `POST /api/movies/fetch/{tmdbId}`
  - Forces details + credits fetch and local persistence/update.
- Details flow:
  - `GET /api/movies/{tmdbId}` calls `EnsureLocalMovieAsync(syncCredits: true)`.
  - On cache miss, local movie/genre/staff persistence can happen.

---

## 2) CQRS and GET Endpoints

## Architectural rule (target)

`GET` endpoints are read-only and should never perform writes or call `_unitOfWork.CompleteAsync()`.

This keeps query paths predictable, scalable, and side-effect free.

## Known current deviation

Current implementation includes one practical exception:

- `GetMovieDetailsAsync` invokes `EnsureLocalMovieAsync(syncCredits: true)`.
- If the movie is not yet in local storage, that path may persist movie/genre/staff and commit via `_unitOfWork.CompleteAsync()`.

This is documented as an implementation deviation from strict CQRS-read semantics and should be treated as technical debt for future refactor if strict separation is required.

---

## 3) Core Patterns Used

## Specification Pattern

The domain uses explicit specifications for query criteria, includes, sorting, and paging.

- Core contracts:
  - `ISpecification<T>`
  - `BaseSpecification<T>`
- Evaluator:
  - `SpecificationEvaluator<T>` applies criteria/includes/order/paging to EF queries.
- Example specs:
  - `MovieDetailsByTmdbIdSpecification`
  - `UserMovieReviewsByMovieIdSpecification` (newest-first + paging)
  - `UserMovieReviewByUserAndMovieSpecification` (ownership filter)
  - `UserMovieWatchedByUserAndMovieSpecification` (idempotency check)

Benefits:

- Reusable query definitions.
- Consistent read behavior across service methods.
- Centralized control of eager loading and paging.

## Generic Repository

All data access goes through `IGenericRepository<T>`:

- `ListAsync(spec)`
- `GetEntityWithSpecAsync(spec)`
- `CountAsync(spec)`
- `AddAsync`, `Update`, `Remove`

This standardizes persistence boundaries and keeps services focused on domain logic.

## Unit of Work

All writes are committed through `IUnitOfWork.CompleteAsync()`.

- Repositories stage changes.
- Unit of Work flushes them in one save boundary.

Benefits:

- Predictable transaction points.
- Reduced accidental partial writes.
- Explicit mutation boundaries in service methods.

## Manual Mapping (No third-party mapper)

The service maps entities/TMDB contracts to DTOs manually.

Examples:

- `MapLiveMovie` for live TMDB summary mapping.
- `MapLocalMovieToListItem` for local entity mapping.
- Inline DTO construction in reviews/details/interaction methods.

Rationale:

- Clear and explicit transformation logic.
- Easier debugging and maintenance of API shapes.
- No hidden mapping conventions.

---

## 4) Command vs Query Snapshot

## Query-oriented paths

- `GET /api/movies`
- `GET /api/movies/trending`
- `GET /api/movies/recently-added`
- `GET /api/movies/genres`
- `GET /api/movies/recommended`
- `GET /api/movies/recommended-for-me`
- `GET /api/movies/{tmdbId}/reviews`

## Command-oriented paths

- `POST /api/movies/fetch/{tmdbId}`
- `POST /api/movies/{tmdbId}/like`
- `POST /api/movies/{tmdbId}/rate`
- `POST /api/movies/{tmdbId}/watchlist`
- `POST /api/movies/{tmdbId}/watched`
- `POST /api/movies/{tmdbId}/reviews`
- `PUT /api/movies/{tmdbId}/reviews`
- `DELETE /api/movies/{tmdbId}/reviews`

---

## 5) Practical Notes for Backend Contributors

1. Treat `{id}` on movie routes as TMDB id, not local `MovieId`.
2. Keep list endpoints lightweight and avoid eager loading heavy graphs unnecessarily.
3. For any new mutation path, ensure all commits happen through `IUnitOfWork`.
4. For any new query path, prefer adding a dedicated specification over ad-hoc LINQ in services.
5. If strict CQRS is enforced later, move details cache-warm persistence into explicit command paths.
