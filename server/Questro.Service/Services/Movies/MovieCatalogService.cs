using Questro.Core.Entities.Movies;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.ExternalServices.Tmdb.Contracts;
using Questro.Service.Abstractions.Movies;
using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.ErrorHandle.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Services.Movies;

public sealed class MovieCatalogService : IMovieCatalogService
{
    private const int DefaultTake = 20;

    private readonly ITmdbService _tmdbService;
    private readonly IGenericRepository<MovieGenre> _movieGenreRepository;

    public MovieCatalogService(
        ITmdbService tmdbService,
        IGenericRepository<MovieGenre> movieGenreRepository)
    {
        _tmdbService = tmdbService;
        _movieGenreRepository = movieGenreRepository;
    }

    public async Task<Result<PagedResponse<MovieListItemDto>>> GetMoviesAsync(MovieSpecParams specParams, CancellationToken cancellationToken = default)
    {
        var parameters = specParams ?? new MovieSpecParams();
        var safePageIndex = parameters.PageIndex < 1 ? 1 : parameters.PageIndex;
        var safePageSize = parameters.PageSize < 1 ? DefaultTake : parameters.PageSize;

        var genreMap = await GetLocalGenreMapAsync(cancellationToken);

        TmdbPagedMovieResponse? tmdbResponse = string.IsNullOrWhiteSpace(parameters.Search)
            ? await _tmdbService.DiscoverMoviesAsync(parameters, cancellationToken)
            : await _tmdbService.SearchMoviesAsync(parameters, cancellationToken);

        if (tmdbResponse?.Results is null || tmdbResponse.Results.Count == 0)
        {
            return Result.Success(new PagedResponse<MovieListItemDto>
            {
                Data = Enumerable.Empty<MovieListItemDto>(),
                PageNumber = safePageIndex,
                PageSize = safePageSize,
                TotalCount = 0,
                TotalPages = 0
            });
        }

        var filtered = ApplyPostSearchFilters(tmdbResponse.Results, parameters)
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

    public async Task<Result<IEnumerable<MovieListItemDto>>> GetRecentlyAddedAsync(int take = DefaultTake, CancellationToken cancellationToken = default)
    {
        var safeTake = take < 1 ? DefaultTake : take;
        var genreMap = await GetLocalGenreMapAsync(cancellationToken);

        var tmdbMovies = await CollectMoviesAsync(_tmdbService.GetNowPlayingMoviesAsync, safeTake, cancellationToken);
        if (tmdbMovies.Count == 0)
        {
            return Result.Failure<IEnumerable<MovieListItemDto>>(MovieError.RecentlyAddedUnavailable);
        }

        var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-30);
        var recentOnly = tmdbMovies
            .Where(x => ParseDate(x.ReleaseDate) is DateTime releaseDate && releaseDate.Date >= thirtyDaysAgo)
            .ToList();

        if (recentOnly.Count == 0)
        {
            recentOnly = tmdbMovies;
        }

        var mapped = recentOnly
            .Take(safeTake)
            .Select(x => MapLiveMovie(x, genreMap))
            .ToList();

        return Result.Success<IEnumerable<MovieListItemDto>>(mapped);
    }

    public async Task<Result<IEnumerable<MovieListItemDto>>> GetTrendingAsync(int take = DefaultTake, CancellationToken cancellationToken = default)
    {
        var safeTake = take < 1 ? DefaultTake : take;
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

    public async Task<Result<IEnumerable<MovieGenreDto>>> GetGenresAsync(CancellationToken cancellationToken = default)
    {
        var genreMap = await GetLocalGenreMapAsync(cancellationToken);
        if (genreMap.Count > 0)
        {
            var mapped = genreMap
                .OrderBy(x => x.Value)
                .Select(x => new MovieGenreDto(x.Key, x.Value))
                .ToList();

            return Result.Success<IEnumerable<MovieGenreDto>>(mapped);
        }

        var tmdbGenres = await _tmdbService.GetMovieGenresAsync(cancellationToken);
        if (tmdbGenres?.Genres is null || tmdbGenres.Genres.Count == 0)
        {
            return Result.Failure<IEnumerable<MovieGenreDto>>(MovieError.GenresNotFound);
        }

        var fallback = tmdbGenres.Genres
            .Where(x => !string.IsNullOrWhiteSpace(x.Name))
            .OrderBy(x => x.Name)
            .Select(x => new MovieGenreDto(x.Id, x.Name))
            .ToList();

        return Result.Success<IEnumerable<MovieGenreDto>>(fallback);
    }

    public async Task<Result<IEnumerable<MovieListItemDto>>> GetRecommendedAsync(int take = DefaultTake, CancellationToken cancellationToken = default)
    {
        var safeTake = take < 1 ? DefaultTake : take;
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

    public Task<Result<IEnumerable<MovieListItemDto>>> GetRecommendedForMeAsync(long userId, int take = 20, CancellationToken cancellationToken = default)
    {
        _ = userId;
        return GetRecommendedAsync(take, cancellationToken);
    }

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
        var results = new List<TmdbMovieSummaryDto>();
        var currentPage = 1;

        while (results.Count < take)
        {
            var response = await pageFetcher(currentPage, cancellationToken);
            if (response?.Results is null || response.Results.Count == 0)
            {
                break;
            }

            results.AddRange(response.Results);

            if (currentPage >= response.TotalPages)
            {
                break;
            }

            currentPage++;
        }

        return results.Take(take).ToList();
    }

    private static IEnumerable<TmdbMovieSummaryDto> ApplyPostSearchFilters(IEnumerable<TmdbMovieSummaryDto> source, MovieSpecParams parameters)
    {
        var query = source;

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search.Trim();
            query = query.Where(x => x.Title?.Contains(search, StringComparison.OrdinalIgnoreCase) == true);
        }

        if (!string.IsNullOrWhiteSpace(parameters.Language))
        {
            var language = parameters.Language.Trim();
            query = query.Where(x => string.Equals(x.OriginalLanguage, language, StringComparison.OrdinalIgnoreCase));
        }

        if (parameters.MinRating.HasValue)
        {
            query = query.Where(x => (x.VoteAverage ?? 0) >= parameters.MinRating.Value);
        }

        if (parameters.MaxRating.HasValue)
        {
            query = query.Where(x => (x.VoteAverage ?? 0) <= parameters.MaxRating.Value);
        }

        if (parameters.Year.HasValue)
        {
            query = query.Where(x => ParseDate(x.ReleaseDate)?.Year == parameters.Year.Value);
        }

        if (parameters.GenreId.HasValue)
        {
            query = query.Where(x => x.GenreIds.Contains(parameters.GenreId.Value));
        }

        return query;
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
