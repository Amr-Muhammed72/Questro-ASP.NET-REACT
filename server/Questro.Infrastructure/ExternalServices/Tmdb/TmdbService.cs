using Microsoft.Extensions.Options;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.ExternalServices.Tmdb.Contracts;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.Options.Tmdb;
using System.Globalization;
using System.Net.Http.Json;
using System.Text;

namespace Questro.Infrastructure.ExternalServices.Tmdb;

public sealed class TmdbService : ITmdbService
{
    private readonly HttpClient _httpClient;
    private readonly TmdbOptions _tmdbOptions;

    public TmdbService(HttpClient httpClient, IOptions<TmdbOptions> tmdbOptions)
    {
        _httpClient = httpClient;
        _tmdbOptions = tmdbOptions.Value;
    }

    public Task<TmdbPagedMovieResponse?> GetTrendingMoviesWeekAsync(int page = 1, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(new Dictionary<string, string?>
        {
            [TmdbConstants.QueryKeys.Page] = page.ToString(CultureInfo.InvariantCulture)
        });

        return GetAsync<TmdbPagedMovieResponse>($"{BuildEndpoint(TmdbConstants.Endpoints.TrendingMovieWeek)}{query}", cancellationToken);
    }

    public Task<TmdbPagedMovieResponse?> GetNowPlayingMoviesAsync(int page = 1, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(new Dictionary<string, string?>
        {
            [TmdbConstants.QueryKeys.Page] = page.ToString(CultureInfo.InvariantCulture)
        });

        return GetAsync<TmdbPagedMovieResponse>($"{BuildEndpoint(TmdbConstants.Endpoints.NowPlayingMovie)}{query}", cancellationToken);
    }

    public Task<TmdbPagedMovieResponse?> DiscoverMoviesAsync(MovieSpecParams specParams, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(new Dictionary<string, string?>
        {
            [TmdbConstants.QueryKeys.Page] = (specParams.PageIndex < 1 ? 1 : specParams.PageIndex).ToString(CultureInfo.InvariantCulture),
            [TmdbConstants.QueryKeys.SortBy] = MapSort(specParams.Sort),
            [TmdbConstants.QueryKeys.WithGenres] = specParams.GenreId?.ToString(CultureInfo.InvariantCulture),
            [TmdbConstants.QueryKeys.WithOriginalLanguage] = specParams.Language,
            [TmdbConstants.QueryKeys.PrimaryReleaseYear] = specParams.Year?.ToString(CultureInfo.InvariantCulture),
            [TmdbConstants.QueryKeys.VoteAverageGte] = specParams.MinRating?.ToString(CultureInfo.InvariantCulture),
            [TmdbConstants.QueryKeys.VoteAverageLte] = specParams.MaxRating?.ToString(CultureInfo.InvariantCulture),
            [TmdbConstants.QueryKeys.IncludeAdult] = TmdbConstants.QueryValues.False
        });

        return GetAsync<TmdbPagedMovieResponse>($"{BuildEndpoint(TmdbConstants.Endpoints.DiscoverMovie)}{query}", cancellationToken);
    }

    public Task<TmdbPagedMovieResponse?> SearchMoviesAsync(MovieSpecParams specParams, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(new Dictionary<string, string?>
        {
            [TmdbConstants.QueryKeys.Query] = specParams.Search,
            [TmdbConstants.QueryKeys.Page] = (specParams.PageIndex < 1 ? 1 : specParams.PageIndex).ToString(CultureInfo.InvariantCulture),
            [TmdbConstants.QueryKeys.Year] = specParams.Year?.ToString(CultureInfo.InvariantCulture),
            [TmdbConstants.QueryKeys.WithGenres] = specParams.GenreId?.ToString(CultureInfo.InvariantCulture),
            [TmdbConstants.QueryKeys.WithOriginalLanguage] = specParams.Language,
            [TmdbConstants.QueryKeys.VoteAverageGte] = specParams.MinRating?.ToString(CultureInfo.InvariantCulture),
            [TmdbConstants.QueryKeys.VoteAverageLte] = specParams.MaxRating?.ToString(CultureInfo.InvariantCulture),
            [TmdbConstants.QueryKeys.IncludeAdult] = TmdbConstants.QueryValues.False
        });

        return GetAsync<TmdbPagedMovieResponse>($"{BuildEndpoint(TmdbConstants.Endpoints.SearchMovie)}{query}", cancellationToken);
    }

    public Task<TmdbGenreListResponse?> GetMovieGenresAsync(CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(null);
        return GetAsync<TmdbGenreListResponse>($"{BuildEndpoint(TmdbConstants.Endpoints.GenreMovieList)}{query}", cancellationToken);
    }

    public Task<TmdbMovieDetailsResponse?> GetMovieDetailsAsync(int tmdbId, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(null);
        return GetAsync<TmdbMovieDetailsResponse>($"{BuildEndpoint($"{TmdbConstants.Endpoints.Movie}/{tmdbId}")}{query}", cancellationToken);
    }

    public Task<TmdbMovieCreditsResponse?> GetMovieCreditsAsync(int tmdbId, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(null);
        return GetAsync<TmdbMovieCreditsResponse>(
            $"{BuildEndpoint($"{TmdbConstants.Endpoints.Movie}/{tmdbId}/{TmdbConstants.Endpoints.Credits}")}{query}",
            cancellationToken);
    }

    public Task<TmdbMovieVideosResponse?> GetMovieVideosAsync(int tmdbId, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(null);
        return GetAsync<TmdbMovieVideosResponse>(
            $"{BuildEndpoint($"{TmdbConstants.Endpoints.Movie}/{tmdbId}/{TmdbConstants.Endpoints.Videos}")}{query}",
            cancellationToken);
    }

    public Task<TmdbPagedMovieResponse?> GetSimilarMoviesAsync(int tmdbId, int page = 1, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(new Dictionary<string, string?>
        {
            [TmdbConstants.QueryKeys.Page] = page.ToString(CultureInfo.InvariantCulture)
        });

        return GetAsync<TmdbPagedMovieResponse>(
            $"{BuildEndpoint($"{TmdbConstants.Endpoints.Movie}/{tmdbId}/{TmdbConstants.Endpoints.Similar}")}{query}",
            cancellationToken);
    }

    public Task<TmdbMovieWatchProvidersResponse?> GetMovieWatchProvidersAsync(int tmdbId, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(null);
        return GetAsync<TmdbMovieWatchProvidersResponse>(
            $"{BuildEndpoint($"{TmdbConstants.Endpoints.Movie}/{tmdbId}/{TmdbConstants.Endpoints.WatchProviders}")}{query}",
            cancellationToken);
    }

    public Task<TmdbPersonDetailsResponse?> GetPersonDetailsAsync(int tmdbId, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(null);
        return GetAsync<TmdbPersonDetailsResponse>(
            $"{BuildEndpoint($"{TmdbConstants.Endpoints.Person}/{tmdbId}")}{query}",
            cancellationToken);
    }

    public Task<TmdbPersonMovieCreditsResponse?> GetPersonMovieCreditsAsync(int tmdbId, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(null);
        return GetAsync<TmdbPersonMovieCreditsResponse>(
            $"{BuildEndpoint($"{TmdbConstants.Endpoints.Person}/{tmdbId}/{TmdbConstants.Endpoints.Credits}")}{query}",
            cancellationToken);
    }

    private async Task<T?> GetAsync<T>(string pathAndQuery, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_tmdbOptions.ApiKey))
        {
            return default;
        }

        try
        {
            var response = await _httpClient.GetAsync(pathAndQuery, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return default;
            }

            return await response.Content.ReadFromJsonAsync<T>(cancellationToken: cancellationToken);
        }
        catch
        {
            return default;
        }
    }

    private string BuildQuery(Dictionary<string, string?>? additionalQuery)
    {
        var query = new Dictionary<string, string?>
        {
            [TmdbConstants.QueryKeys.ApiKey] = _tmdbOptions.ApiKey
        };

        if (additionalQuery is not null)
        {
            foreach (var pair in additionalQuery)
            {
                if (!string.IsNullOrWhiteSpace(pair.Value))
                {
                    query[pair.Key] = pair.Value;
                }
            }
        }

        var builder = new StringBuilder("?");
        var isFirst = true;

        foreach (var pair in query)
        {
            if (string.IsNullOrWhiteSpace(pair.Value))
            {
                continue;
            }

            if (!isFirst)
            {
                builder.Append('&');
            }

            builder.Append(Uri.EscapeDataString(pair.Key));
            builder.Append('=');
            builder.Append(Uri.EscapeDataString(pair.Value));
            isFirst = false;
        }

        return builder.ToString();
    }

    private static string MapSort(string? input)
    {
        return input?.Trim().ToLowerInvariant() switch
        {
            "latest" => TmdbConstants.SortValues.PrimaryReleaseDateDesc,
            "oldest" => TmdbConstants.SortValues.PrimaryReleaseDateAsc,
            "popularity" => TmdbConstants.SortValues.PopularityDesc,
            "popularityasc" => TmdbConstants.SortValues.PopularityAsc,
            "rating" => TmdbConstants.SortValues.VoteAverageDesc,
            "ratingasc" => TmdbConstants.SortValues.VoteAverageAsc,
            _ => TmdbConstants.SortValues.PopularityDesc
        };
    }

    private string BuildEndpoint(string endpoint)
    {
        var baseUrl = _tmdbOptions.BaseUrl.TrimEnd('/');
        if (!baseUrl.EndsWith("/3", StringComparison.OrdinalIgnoreCase))
        {
            baseUrl = $"{baseUrl}/3";
        }

        return $"{baseUrl}/{endpoint.TrimStart('/')}";
    }
}
