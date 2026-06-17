using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;
using Questro.Core.Entities.Movies;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Specifications.Family;
using Questro.Core.Specifications.Movies;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.ExternalServices.Tmdb.Contracts;
using Questro.Service.Abstractions.Movies;
using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.Contracts.Recommender;
using Questro.Shared.ErrorHandle.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Services.Movies;

public sealed class MovieCatalogService : IMovieCatalogService
{
    private const int DefaultTake = 20;
    private const int SafeDiscoveryPages = 5;
    private static readonly TimeSpan SafeCacheExpiration = TimeSpan.FromMinutes(30);

    private readonly ITmdbService _tmdbService;
    private readonly IGenericRepository<MovieGenre> _movieGenreRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IGenericRepository<ChildRestriction> _restrictionRepo;
    private readonly IMemoryCache _memoryCache;
    private readonly IRecommenderService _recommenderService;
    private readonly IGenericRepository<UserMovieRate> _movieRateRepo;
    private readonly IGenericRepository<UserMovieWatchlist> _movieWatchlistRepo;

    public MovieCatalogService(
        ITmdbService tmdbService,
        IGenericRepository<MovieGenre> movieGenreRepository,
        UserManager<ApplicationUser> userManager,
        IGenericRepository<ChildRestriction> restrictionRepo,
        IMemoryCache memoryCache,
        IRecommenderService recommenderService,
        IGenericRepository<UserMovieRate> movieRateRepo,
        IGenericRepository<UserMovieWatchlist> movieWatchlistRepo)
    {
        _tmdbService = tmdbService;
        _movieGenreRepository = movieGenreRepository;
        _userManager = userManager;
        _restrictionRepo = restrictionRepo;
        _memoryCache = memoryCache;
        _recommenderService = recommenderService;
        _movieRateRepo = movieRateRepo;
        _movieWatchlistRepo = movieWatchlistRepo;
    }

    // ── Discover / Search ───────────────────────────────────────────────────

    public async Task<Result<PagedResponse<MovieListItemDto>>> GetMoviesAsync(
        MovieSpecParams specParams, long? userId = null, CancellationToken cancellationToken = default)
    {
        var parameters = specParams ?? new MovieSpecParams();
        var safePageIndex = parameters.PageIndex < 1 ? 1 : parameters.PageIndex;
        var safePageSize = parameters.PageSize < 1 ? DefaultTake : parameters.PageSize;

        var restriction = await GetChildRestrictionAsync(userId, cancellationToken);
        if (restriction is not null && HasActiveMovieRestrictions(restriction))
        {
            return await GetDiscoverSafeAsync(parameters, restriction, userId!.Value, safePageIndex, safePageSize, cancellationToken);
        }

        var genreMap = await GetLocalGenreMapAsync(cancellationToken);

        TmdbPagedMovieResponse? tmdbResponse = string.IsNullOrWhiteSpace(parameters.Search)
            ? await _tmdbService.DiscoverMoviesAsync(parameters, isChildAccount: restriction != null, cancellationToken)
            : await _tmdbService.SearchMoviesAsync(parameters, isChildAccount: restriction != null, cancellationToken);

        if (tmdbResponse?.Results is null || tmdbResponse.Results.Count == 0)
        {
            return Result.Success(EmptyPagedResponse<MovieListItemDto>(safePageIndex, safePageSize));
        }

        // TMDB's /search/movie endpoint ignores with_genres and vote_average params.
        // Apply genre and rating post-filters locally when the caller specifies them on a search.
        var results = tmdbResponse.Results.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            if (parameters.GenreId.HasValue)
                results = results.Where(m => m.GenreIds.Contains(parameters.GenreId.Value));
            if (parameters.MinRating.HasValue)
                results = results.Where(m => (m.VoteAverage ?? 0) >= parameters.MinRating.Value);
            if (parameters.MaxRating.HasValue)
                results = results.Where(m => (m.VoteAverage ?? 0) <= parameters.MaxRating.Value);
        }

        var filtered = results
            .Take(safePageSize)
            .Select(x => MapLiveMovie(x, genreMap))
            .ToList();

        return Result.Success(new PagedResponse<MovieListItemDto>
        {
            Data = filtered,
            PageNumber = safePageIndex,
            PageSize = safePageSize,
            TotalCount = tmdbResponse.TotalResults,
            TotalPages = tmdbResponse.TotalPages
        });
    }

    // ── Recently Added ──────────────────────────────────────────────────────

    public async Task<Result<IEnumerable<MovieListItemDto>>> GetRecentlyAddedAsync(
        int take = DefaultTake, long? userId = null, CancellationToken cancellationToken = default)
    {
        var safeTake = take < 1 ? DefaultTake : take;

        var restriction = await GetChildRestrictionAsync(userId, cancellationToken);
        if (restriction is not null && HasActiveMovieRestrictions(restriction))
        {
            return await GetRecentlyAddedSafeAsync(restriction, userId!.Value, safeTake, cancellationToken);
        }

        var genreMap = await GetLocalGenreMapAsync(cancellationToken);
        var poolSize = Math.Max(100, safeTake);
        var tmdbMovies = await CollectMoviesAsync(_tmdbService.GetNowPlayingMoviesAsync, poolSize, cancellationToken);
        if (tmdbMovies.Count == 0)
        {
            return Result.Failure<IEnumerable<MovieListItemDto>>(MovieError.RecentlyAddedUnavailable);
        }

        var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-30);
        var recentOnly = tmdbMovies
            .Where(x => ParseDate(x.ReleaseDate) is DateTime releaseDate && releaseDate.Date >= thirtyDaysAgo)
            .ToList();

        var filtered = recentOnly.Count == 0 ? tmdbMovies : recentOnly;

        var mapped = filtered
            .Take(safeTake)
            .Select(x => MapLiveMovie(x, genreMap))
            .ToList();

        return Result.Success<IEnumerable<MovieListItemDto>>(mapped);
    }

    // ── Trending ────────────────────────────────────────────────────────────

    public async Task<Result<IEnumerable<MovieListItemDto>>> GetTrendingAsync(
        int take = DefaultTake, long? userId = null, CancellationToken cancellationToken = default)
    {
        var safeTake = take < 1 ? DefaultTake : take;

        var restriction = await GetChildRestrictionAsync(userId, cancellationToken);
        if (restriction is not null && HasActiveMovieRestrictions(restriction))
        {
            return await GetTrendingSafeAsync(restriction, userId!.Value, safeTake, cancellationToken);
        }

        var genreMap = await GetLocalGenreMapAsync(cancellationToken);
        var tmdbMovies = await CollectMoviesAsync(_tmdbService.GetTrendingMoviesWeekAsync, safeTake, cancellationToken);
        if (tmdbMovies.Count == 0)
        {
            return Result.Failure<IEnumerable<MovieListItemDto>>(MovieError.TrendingUnavailable);
        }

        var mapped = tmdbMovies
            .Select(x => MapLiveMovie(x, genreMap))
            .ToList();

        return Result.Success<IEnumerable<MovieListItemDto>>(mapped);
    }

    // ── Genres ───────────────────────────────────────────────────────────────

    public async Task<Result<IEnumerable<MovieGenreDto>>> GetGenresAsync(long? userId = null, CancellationToken cancellationToken = default)
    {
        IEnumerable<MovieGenreDto> resultGenres;
        var genreMap = await GetLocalGenreMapAsync(cancellationToken);
        if (genreMap.Count > 0)
        {
            resultGenres = genreMap
                .OrderBy(x => x.Value)
                .Select(x => new MovieGenreDto(x.Key, x.Value))
                .ToList();
        }
        else
        {
            var tmdbGenres = await _tmdbService.GetMovieGenresAsync(cancellationToken);
            if (tmdbGenres?.Genres is null || tmdbGenres.Genres.Count == 0)
            {
                return Result.Failure<IEnumerable<MovieGenreDto>>(MovieError.GenresNotFound);
            }

            resultGenres = tmdbGenres.Genres
                .Where(x => !string.IsNullOrWhiteSpace(x.Name))
                .OrderBy(x => x.Name)
                .Select(x => new MovieGenreDto(x.Id, x.Name))
                .ToList();
        }

        var restriction = await GetChildRestrictionAsync(userId, cancellationToken);
        if (restriction is not null && restriction.BlockedMovieGenreIds.Any())
        {
            resultGenres = resultGenres.Where(g => !restriction.BlockedMovieGenreIds.Contains(g.GenreId)).ToList();
        }

        return Result.Success(resultGenres);
    }

    // ── Recommended ─────────────────────────────────────────────────────────

    public async Task<Result<IEnumerable<MovieListItemDto>>> GetRecommendedAsync(
        int take = DefaultTake, long? userId = null, CancellationToken cancellationToken = default)
    {
        var safeTake = take < 1 ? DefaultTake : take;

        // Recommended reuses the trending safe path — same data source, just re-ranked
        var restriction = await GetChildRestrictionAsync(userId, cancellationToken);
        if (restriction is not null && HasActiveMovieRestrictions(restriction))
        {
            return await GetTrendingSafeAsync(restriction, userId!.Value, safeTake, cancellationToken);
        }

        var genreMap = await GetLocalGenreMapAsync(cancellationToken);
        var tmdbMovies = await CollectMoviesAsync(_tmdbService.GetTrendingMoviesWeekAsync, safeTake * 2, cancellationToken);
        if (tmdbMovies.Count == 0)
        {
            return Result.Failure<IEnumerable<MovieListItemDto>>(MovieError.TrendingUnavailable);
        }

        var mapped = tmdbMovies
            .OrderByDescending(x => x.VoteAverage ?? 0)
            .ThenByDescending(x => x.Popularity ?? 0)
            .Take(safeTake)
            .Select(x => MapLiveMovie(x, genreMap))
            .ToList();

        return Result.Success<IEnumerable<MovieListItemDto>>(mapped);
    }

    public async Task<Result<IEnumerable<MovieListItemDto>>> GetRecommendedForMeAsync(long userId, int take = 20, CancellationToken cancellationToken = default)
    {
        var safeTake = take < 1 ? DefaultTake : take;

        // 1. Load User Profile
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return await GetRecommendedAsync(safeTake, userId, cancellationToken);
        }

        // 2. Load Blocked Genres (if child)
        var blockedGenres = new List<string>();
        var restriction = await GetChildRestrictionAsync(userId, cancellationToken);
        var genreMap = await GetLocalGenreMapAsync(cancellationToken);
        if (restriction is not null && restriction.BlockedMovieGenreIds.Any())
        {
            blockedGenres = restriction.BlockedMovieGenreIds
                .Where(genreMap.ContainsKey)
                .Select(id => genreMap[id])
                .ToList();
        }

        // 3. Load User Signals (Rates and Watchlists)
        var signals = new List<RecommenderRatingSignal>();
        
        var rateSpec = new UserMovieRatesByUserSpecification(userId, 1, 50);
        var recentRates = await _movieRateRepo.ListReadOnlyAsync(rateSpec, cancellationToken);
        foreach (var rate in recentRates)
        {
            signals.Add(new RecommenderRatingSignal
            {
                ItemId = $"movie_{rate.Movie.TMDB_Id}",
                Title = rate.Movie.Title,
                Type = "movie",
                Stars = rate.Stars,
                Source = "rating"
            });
        }

        var watchlistSpec = new UserMovieWatchlistByUserSpecification(userId, 1, 50);
        var recentWatchlist = await _movieWatchlistRepo.ListReadOnlyAsync(watchlistSpec, cancellationToken);
        foreach (var w in recentWatchlist)
        {
            signals.Add(new RecommenderRatingSignal
            {
                ItemId = $"movie_{w.Movie.TMDB_Id}",
                Title = w.Movie.Title,
                Type = "movie",
                Source = "wishlist"
            });
        }

        var recommenderReq = new RecommenderRequest
        {
            Domain = "movie",
            K = safeTake,
            Offset = 0,
            BlockedGenres = blockedGenres,
            User = new RecommenderUserProfile
            {
                Age = user.Age,
                Gender = user.Gender,
                Profession = user.Profession,
                Country = user.Country,
                MovieGenresFav = user.MovieGenresFav.Any() ? string.Join("|", user.MovieGenresFav) : null,
                MovieGenresDisliked = user.MovieGenresDisliked.Any() ? string.Join("|", user.MovieGenresDisliked) : null,
                GameGenresFav = user.GameGenresFav.Any() ? string.Join("|", user.GameGenresFav) : null,
                GameGenresDisliked = user.GameGenresDisliked.Any() ? string.Join("|", user.GameGenresDisliked) : null,
                Ratings = signals
            }
        };

        // 4. Call Recommender Service
        var recommenderResponse = await _recommenderService.GetRecommendationsAsync(recommenderReq, cancellationToken);
        
        // Fallback if Recommender fails or returns no items
        if (recommenderResponse?.Recommendations is null || recommenderResponse.Recommendations.Count == 0)
        {
            return await GetRecommendedAsync(safeTake, userId, cancellationToken);
        }

        // 5. Map Recommender Items to MovieListItemDto
        var resultList = new List<MovieListItemDto>();
        foreach (var item in recommenderResponse.Recommendations)
        {
            if (item.ExternalId <= 0) continue;

            // Optional: Parallelize these calls to TMDB
            var details = await _tmdbService.GetMovieDetailsAsync(item.ExternalId, cancellationToken);
            if (details is null) continue;

            var movieDto = new MovieListItemDto(
                MovieId: 0, 
                TmdbId: details.Id,
                Title: details.Title ?? string.Empty,
                PosterUrl: BuildImageUrl(details.PosterPath, "w500"),
                BackdropUrl: BuildImageUrl(details.BackdropPath, "w780"),
                ReleaseDate: ParseDate(details.ReleaseDate),
                Language: details.OriginalLanguage,
                MpaCertification: null,
                Popularity: details.Popularity,
                TmdbRating: details.VoteAverage,
                TmdbVoteCount: details.VoteCount,
                Genres: details.Genres.Select(g => g.Name).Where(n => !string.IsNullOrEmpty(n)).Cast<string>(),
                StaffNames: Enumerable.Empty<string>()
            );

            resultList.Add(movieDto);
        }

        if (resultList.Count == 0)
        {
            return await GetRecommendedAsync(safeTake, userId, cancellationToken);
        }

        return Result.Success<IEnumerable<MovieListItemDto>>(resultList);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SAFE METHODS (Child Accounts — Blacklist Filtering)
    // ═══════════════════════════════════════════════════════════════════════

    private async Task<Result<PagedResponse<MovieListItemDto>>> GetDiscoverSafeAsync(
        MovieSpecParams parameters,
        ChildRestriction restriction,
        long userId,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var isSearch = !string.IsNullOrWhiteSpace(parameters.Search);
        // Include every SpecParam that affects the fetched result set in the cache key
        // so that ?GenreId=16 and ?GenreId=28 never collide in cache.
        var paramsFingerprint = BuildSpecParamsFingerprint(parameters);
        var cacheKey = isSearch
            ? BuildSafeCacheKey($"SafeSearch_Movies_{parameters.Search}_{paramsFingerprint}", userId, restriction)
            : BuildSafeCacheKey($"SafeDiscover_Movies_{paramsFingerprint}", userId, restriction);

        if (!_memoryCache.TryGetValue(cacheKey, out List<TmdbMovieSummaryDto>? cachedMovies) || cachedMovies is null)
        {
            var tasks = new List<Task<TmdbPagedMovieResponse?>>(SafeDiscoveryPages);
            for (var page = 1; page <= SafeDiscoveryPages; page++)
            {
                var fetchParams = new MovieSpecParams
                {
                    Search = parameters.Search,
                    Sort = parameters.Sort,
                    Language = parameters.Language,
                    Year = parameters.Year,
                    MinRating = parameters.MinRating,
                    MaxRating = parameters.MaxRating,
                    GenreId = parameters.GenreId,
                    PageIndex = page,
                    PageSize = parameters.PageSize
                };

                tasks.Add(isSearch
                    ? _tmdbService.SearchMoviesAsync(fetchParams, isChildAccount: true, cancellationToken)
                    : _tmdbService.DiscoverMoviesAsync(fetchParams, isChildAccount: true, cancellationToken));
            }

            var responses = await Task.WhenAll(tasks);
            cachedMovies = FilterMoviesByBlacklist(responses, restriction);
            _memoryCache.Set(cacheKey, cachedMovies, SafeCacheExpiration);
        }

        return await PaginateFromCache(cachedMovies, pageIndex, pageSize, cancellationToken);
    }

    private async Task<Result<IEnumerable<MovieListItemDto>>> GetTrendingSafeAsync(
        ChildRestriction restriction,
        long userId,
        int take,
        CancellationToken cancellationToken)
    {
        var cacheKey = BuildSafeCacheKey("SafeTrending_Movies", userId, restriction);

        if (!_memoryCache.TryGetValue(cacheKey, out List<TmdbMovieSummaryDto>? cachedMovies) || cachedMovies is null)
        {
            var tasks = Enumerable.Range(1, SafeDiscoveryPages)
                .Select(page => _tmdbService.GetTrendingMoviesWeekAsync(page, cancellationToken))
                .ToList();

            var responses = await Task.WhenAll(tasks);
            cachedMovies = FilterMoviesByBlacklist(responses, restriction);
            _memoryCache.Set(cacheKey, cachedMovies, SafeCacheExpiration);
        }

        var genreMap = await GetLocalGenreMapAsync(cancellationToken);
        var mapped = cachedMovies.Take(take).Select(x => MapLiveMovie(x, genreMap)).ToList();
        return Result.Success<IEnumerable<MovieListItemDto>>(mapped);
    }

    private async Task<Result<IEnumerable<MovieListItemDto>>> GetRecentlyAddedSafeAsync(
        ChildRestriction restriction,
        long userId,
        int take,
        CancellationToken cancellationToken)
    {
        var cacheKey = BuildSafeCacheKey("SafeRecentlyAdded_Movies", userId, restriction);

        if (!_memoryCache.TryGetValue(cacheKey, out List<TmdbMovieSummaryDto>? cachedMovies) || cachedMovies is null)
        {
            var tasks = Enumerable.Range(1, SafeDiscoveryPages)
                .Select(page => _tmdbService.GetNowPlayingMoviesAsync(page, cancellationToken))
                .ToList();

            var responses = await Task.WhenAll(tasks);

            // Apply blacklist filter + 30-day recency window
            var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-30);
            var blockedSet = new HashSet<int>(restriction.BlockedMovieGenreIds);

            cachedMovies = responses
                .Where(r => r?.Results is not null)
                .SelectMany(r => r!.Results)
                .Where(m => !m.GenreIds.Any(g => blockedSet.Contains(g)))
                .Where(m => ParseDate(m.ReleaseDate) is DateTime rd && rd.Date >= thirtyDaysAgo)
                .ToList();

            _memoryCache.Set(cacheKey, cachedMovies, SafeCacheExpiration);
        }

        var genreMap = await GetLocalGenreMapAsync(cancellationToken);
        var mapped = cachedMovies.Take(take).Select(x => MapLiveMovie(x, genreMap)).ToList();
        return Result.Success<IEnumerable<MovieListItemDto>>(mapped);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SHARED HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Core blacklist filter: a movie is safe ONLY IF it does NOT contain ANY blocked genres.
    /// </summary>
    private static List<TmdbMovieSummaryDto> FilterMoviesByBlacklist(
        TmdbPagedMovieResponse?[] responses, ChildRestriction restriction)
    {
        var blockedSet = new HashSet<int>(restriction.BlockedMovieGenreIds);

        return responses
            .Where(r => r?.Results is not null)
            .SelectMany(r => r!.Results)
            .Where(m => !m.GenreIds.Any(g => blockedSet.Contains(g)))
            .ToList();
    }

    private async Task<Result<PagedResponse<MovieListItemDto>>> PaginateFromCache(
        List<TmdbMovieSummaryDto> cachedMovies,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var totalCount = cachedMovies.Count;
        var skip = (pageIndex - 1) * pageSize;
        var pageSlice = cachedMovies.Skip(skip).Take(pageSize).ToList();

        var genreMap = await GetLocalGenreMapAsync(cancellationToken);
        var mapped = pageSlice.Select(x => MapLiveMovie(x, genreMap)).ToList();

        return Result.Success(new PagedResponse<MovieListItemDto>
        {
            Data = mapped,
            PageNumber = pageIndex,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    private static bool HasActiveMovieRestrictions(ChildRestriction r) =>
        r.BlockedMovieGenreIds.Count > 0;

    private async Task<ChildRestriction?> GetChildRestrictionAsync(long? userId, CancellationToken cancellationToken)
    {
        if (!userId.HasValue)
            return null;

        var user = await _userManager.FindByIdAsync(userId.Value.ToString());
        if (user is null || !user.IsChildAccount)
            return null;

        var spec = new ChildRestrictionByUserIdSpecification(userId.Value);
        return await _restrictionRepo.GetEntityWithSpecAsync(spec, cancellationToken);
    }

    private static string BuildSafeCacheKey(string prefix, long userId, ChildRestriction restriction)
    {
        var genreHash = restriction.BlockedMovieGenreIds.Count > 0 
            ? string.Join(",", restriction.BlockedMovieGenreIds) 
            : "none";
        
        return $"{prefix}_{userId}_{genreHash}";
    }

    /// <summary>
    /// Builds a deterministic fingerprint from the caller's SpecParams so that
    /// different filter combinations never share the same safe-discovery cache slot.
    /// </summary>
    private static string BuildSpecParamsFingerprint(MovieSpecParams p) =>
        $"g{p.GenreId}_y{p.Year}_min{p.MinRating}_max{p.MaxRating}_s{p.Sort}_l{p.Language}";

    private async Task<Dictionary<int, string>> GetLocalGenreMapAsync(CancellationToken cancellationToken)
    {
        var localGenres = await _movieGenreRepository.ListAllAsync(cancellationToken);
        return localGenres
            .Where(x => x.TMDB_Id.HasValue)
            .GroupBy(x => x.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First().Name);
    }

    private async Task<List<TmdbMovieSummaryDto>> CollectMoviesAsync(
        Func<int, CancellationToken, Task<TmdbPagedMovieResponse?>> pageFetcher,
        int take,
        CancellationToken cancellationToken)
    {
        if (take <= 0)
        {
            return new List<TmdbMovieSummaryDto>();
        }

        var pagesNeeded = (int)Math.Ceiling(take / 20.0);
        var tasks = new List<Task<TmdbPagedMovieResponse?>>(pagesNeeded);

        for (var page = 1; page <= pagesNeeded; page++)
        {
            tasks.Add(pageFetcher(page, cancellationToken));
        }

        var responses = await Task.WhenAll(tasks);
        var results = new List<TmdbMovieSummaryDto>();

        foreach (var response in responses)
        {
            if (response?.Results is null || response.Results.Count == 0)
            {
                continue;
            }

            results.AddRange(response.Results);
            if (results.Count >= take)
            {
                break;
            }
        }

        return results.Take(take).ToList();
    }

    private static MovieListItemDto MapLiveMovie(TmdbMovieSummaryDto movie, IReadOnlyDictionary<int, string> genreMap)
    {
        var genreNames = movie.GenreIds
            .Where(genreMap.ContainsKey)
            .Select(genreId => genreMap[genreId])
            .Distinct()
            .ToList();

        return new MovieListItemDto(
            0,
            movie.Id,
            movie.Title ?? string.Empty,
            BuildImageUrl(movie.PosterPath, "w500"),
            BuildImageUrl(movie.BackdropPath, "w780"),
            ParseDate(movie.ReleaseDate),
            movie.OriginalLanguage,
            null,
            movie.Popularity,
            movie.VoteAverage,
            movie.VoteCount,
            genreNames,
            Enumerable.Empty<string>());
    }

    private static PagedResponse<T> EmptyPagedResponse<T>(int pageIndex, int pageSize) => new()
    {
        Data = Enumerable.Empty<T>(),
        PageNumber = pageIndex,
        PageSize = pageSize,
        TotalCount = 0,
        TotalPages = 0
    };

    private static string? BuildImageUrl(string? imagePath, string size)
    {
        if (string.IsNullOrWhiteSpace(imagePath))
        {
            return null;
        }

        return $"https://image.tmdb.org/t/p/{size}{imagePath}";
    }

    private static DateTime? ParseDate(string? value)
    {
        return DateTime.TryParse(value, out var parsedDate) ? parsedDate : null;
    }
}
