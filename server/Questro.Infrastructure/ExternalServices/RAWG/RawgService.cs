using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.ExternalServices.RAWG.Contracts;
using Questro.Shared.Contracts.Games;
using Questro.Shared.Options.Rawg;
using System.Globalization;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace Questro.Infrastructure.ExternalServices.RAWG;

public sealed class RawgService : IRawgService
{
    private readonly HttpClient _httpClient;
    private readonly RawgOptions _rawgOptions;
    private readonly ILogger<RawgService> _logger;

    public RawgService(HttpClient httpClient, IOptions<RawgOptions> rawgOptions, ILogger<RawgService> logger)
    {
        _httpClient = httpClient;
        _rawgOptions = rawgOptions.Value;
        _logger = logger;
    }

    public Task<RawgPagedGameResponse?> GetTrendingGamesAsync(int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(new Dictionary<string, string?>
        {
            [RawgConstants.QueryKeys.Page] = page.ToString(CultureInfo.InvariantCulture),
            [RawgConstants.QueryKeys.PageSize] = pageSize.ToString(CultureInfo.InvariantCulture),
            [RawgConstants.QueryKeys.Ordering] = RawgConstants.SortValues.TrendingDesc
        });

        return GetAsync<RawgPagedGameResponse>($"{BuildEndpoint(RawgConstants.Endpoints.Games)}{query}", cancellationToken);
    }

    public Task<RawgPagedGameResponse?> DiscoverGamesAsync(
        GameSpecParams specParams,
        string? maxContentRating = null,
        CancellationToken cancellationToken = default)
    {
        var queryParams = new Dictionary<string, string?>
        {
            [RawgConstants.QueryKeys.Page]       = (specParams.PageIndex < 1 ? 1 : specParams.PageIndex).ToString(CultureInfo.InvariantCulture),
            [RawgConstants.QueryKeys.PageSize]   = RawgConstants.QueryValues.DefaultPageSize.ToString(CultureInfo.InvariantCulture),
            [RawgConstants.QueryKeys.Ordering]   = MapSort(specParams.Sort),
            [RawgConstants.QueryKeys.Genres]     = specParams.GenreId?.ToString(CultureInfo.InvariantCulture),
            [RawgConstants.QueryKeys.Platforms]  = specParams.PlatformId?.ToString(CultureInfo.InvariantCulture),
            // RAWG uses a single `dates` param: "YYYY-01-01,YYYY-12-31"
            [RawgConstants.QueryKeys.Dates]      = BuildRawgDateRange(specParams.Year),
            // RAWG uses a single `metacritic` param: "min,max" (both bounds optional)
            [RawgConstants.QueryKeys.Metacritic] = BuildRawgMetacriticRange(specParams.MinRating, specParams.MaxRating)
        };

        ApplyRawgContentSafety(queryParams, maxContentRating);

        var query = BuildQuery(queryParams);
        return GetAsync<RawgPagedGameResponse>($"{BuildEndpoint(RawgConstants.Endpoints.Games)}{query}", cancellationToken);
    }

    public Task<RawgPagedGameResponse?> SearchGamesAsync(
        GameSpecParams specParams,
        string? maxContentRating = null,
        CancellationToken cancellationToken = default)
    {
        // RAWG's games endpoint supports `search` alongside `genres`, `dates`, `metacritic`,
        // and `platforms` in the same request — unlike TMDB where search and discover are separate.
        var queryParams = new Dictionary<string, string?>
        {
            [RawgConstants.QueryKeys.Search]     = specParams.Search,
            [RawgConstants.QueryKeys.Page]       = (specParams.PageIndex < 1 ? 1 : specParams.PageIndex).ToString(CultureInfo.InvariantCulture),
            [RawgConstants.QueryKeys.PageSize]   = RawgConstants.QueryValues.DefaultPageSize.ToString(CultureInfo.InvariantCulture),
            // Carry through all remaining filters — RAWG honours them alongside search
            [RawgConstants.QueryKeys.Genres]     = specParams.GenreId?.ToString(CultureInfo.InvariantCulture),
            [RawgConstants.QueryKeys.Platforms]  = specParams.PlatformId?.ToString(CultureInfo.InvariantCulture),
            [RawgConstants.QueryKeys.Dates]      = BuildRawgDateRange(specParams.Year),
            [RawgConstants.QueryKeys.Metacritic] = BuildRawgMetacriticRange(specParams.MinRating, specParams.MaxRating)
        };

        ApplyRawgContentSafety(queryParams, maxContentRating);

        var query = BuildQuery(queryParams);
        return GetAsync<RawgPagedGameResponse>($"{BuildEndpoint(RawgConstants.Endpoints.Games)}{query}", cancellationToken);
    }

    public Task<RawgGenreListResponse?> GetGameGenresAsync(CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(null);
        return GetAsync<RawgGenreListResponse>($"{BuildEndpoint(RawgConstants.Endpoints.Genres)}{query}", cancellationToken);
    }

    public async Task<RawgPlatformListResponse?> GetGamePlatformsAsync(CancellationToken cancellationToken = default)
    {
        const int pageSize = 40;
        var page = 1;
        var platforms = new RawgPlatformListResponse();

        while (true)
        {
            var query = BuildQuery(new Dictionary<string, string?>
            {
                [RawgConstants.QueryKeys.Page] = page.ToString(CultureInfo.InvariantCulture),
                [RawgConstants.QueryKeys.PageSize] = pageSize.ToString(CultureInfo.InvariantCulture)
            });

            var response = await GetAsync<RawgPlatformListResponse>(
                $"{BuildEndpoint(RawgConstants.Endpoints.Platforms)}{query}",
                cancellationToken);

            if (response is null)
            {
                return page == 1 ? null : platforms;
            }

            platforms.Count = response.Count;
            platforms.Next = response.Next;
            platforms.Results.AddRange(response.Results);

            if (string.IsNullOrWhiteSpace(response.Next) || response.Results.Count == 0)
            {
                return platforms;
            }

            page++;
        }
    }

    public Task<RawgGameDetailsResponse?> GetGameDetailsAsync(int rawgId, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(null);
        return GetAsync<RawgGameDetailsResponse>($"{BuildEndpoint($"{RawgConstants.Endpoints.Games}/{rawgId}")}{query}", cancellationToken);
    }
    
    public Task<RawgPagedGameResponse?> GetSimilarGamesAsync(
        int rawgId,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(new Dictionary<string, string?>
        {
            [RawgConstants.QueryKeys.Page] = (page < 1 ? 1 : page).ToString(CultureInfo.InvariantCulture),
            [RawgConstants.QueryKeys.PageSize] = ((RawgConstants.QueryValues.DefaultPageSize).ToString(CultureInfo.InvariantCulture))
        });

        return GetAsync<RawgPagedGameResponse>(
            $"{BuildEndpoint($"{RawgConstants.Endpoints.Games}/{rawgId}/{RawgConstants.Endpoints.Suggested}")}{query}",
            cancellationToken);
    }

    public Task<RawgGameTrailersResponse?> GetGameTrailersAsync(int rawgId, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(null);
        return GetAsync<RawgGameTrailersResponse>(
            $"{BuildEndpoint($"{RawgConstants.Endpoints.Games}/{rawgId}/{RawgConstants.Endpoints.Movies}")}{query}",
            cancellationToken);
    }
    public Task<RawgGameScreenshotsResponse?> GetGameScreenshotsAsync(int rawgId, CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(null);
        return GetAsync<RawgGameScreenshotsResponse>(
            $"{BuildEndpoint($"{RawgConstants.Endpoints.Games}/{rawgId}/{RawgConstants.Endpoints.Screenshots}")}{query}",
            cancellationToken);
    }
    private async Task<T?> GetAsync<T>(string pathAndQuery, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_rawgOptions.ApiKey))
        {
            return default;
        }

        try
        {
            var response = await _httpClient.GetAsync(pathAndQuery, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("RAWG API returned {StatusCode} for {Path}", (int)response.StatusCode, pathAndQuery);
                return default;
            }

            return await response.Content.ReadFromJsonAsync<T>(cancellationToken: cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "RAWG API request failed for {Path}. Error: {ErrorMessage}", pathAndQuery, BuildExceptionMessage(ex));
            return default;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "RAWG API request timed out for {Path}. Error: {ErrorMessage}", pathAndQuery, BuildExceptionMessage(ex));
            return default;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "RAWG API response parsing failed for {Path}. Error: {ErrorMessage}", pathAndQuery, BuildExceptionMessage(ex));
            return default;
        }
    }

    private static string BuildExceptionMessage(Exception exception)
    {
        var builder = new StringBuilder();
        var current = exception;
        var isFirst = true;

        while (current is not null)
        {
            if (!isFirst)
            {
                builder.Append(" | Inner: ");
            }

            builder.Append(current.Message);
            current = current.InnerException;
            isFirst = false;
        }

        return builder.ToString();
    }

    private string BuildQuery(Dictionary<string, string?>? additionalQuery)
    {
        var query = new Dictionary<string, string?>
        {
            [RawgConstants.QueryKeys.Key] = _rawgOptions.ApiKey
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


    private static void ApplyRawgContentSafety(
        Dictionary<string, string?> queryParams,
        string? maxContentRating)
    {
        // ── Global Shield ── always exclude explicit tags for every user ─────
        queryParams[RawgConstants.QueryKeys.ExcludeTags] = "nsfw,erotic,nudity";

        // ── ESRB Rating Cap ──────────────────────────────────────────────────
        // Child path:  maxContentRating is non-null (callers default to "Teen" via ??).
        //              MapEsrbRatingIds converts it to the appropriate ID range.
        // Adult/parent path: maxContentRating is null.
        //              Hard-cap at Mature (IDs 1-4) platform-wide — Adults Only (ID 5)
        //              is NEVER served to any account, regardless of age.
        var esrbIds = string.IsNullOrWhiteSpace(maxContentRating)
            ? "1,2,3,4"                        // adult/parent cap: max Mature, block Adults Only
            : MapEsrbRatingIds(maxContentRating); // child cap: map their allowed max

        if (!string.IsNullOrWhiteSpace(esrbIds))
        {
            queryParams[RawgConstants.QueryKeys.EsrbRating] = esrbIds;
        }
    }


    private static string? MapEsrbRatingIds(string? maxContentRating)
    {
        if (string.IsNullOrWhiteSpace(maxContentRating))
            return null;

        return maxContentRating.Trim().ToLowerInvariant() switch
        {
            "everyone"       => "1",
            "everyone 10+"   => "1,2",
            "everyone10plus" => "1,2",
            "teen"           => "1,2,3",
            "mature"         => "1,2,3,4",
            "adults only"    => "1,2,3,4,5",
            "adultsonly"     => "1,2,3,4,5",
            _                => null   // unrecognised label — no ESRB filter applied
        };
    }

    private static string MapSort(string? input)
    {
        return input?.Trim().ToLowerInvariant() switch
        {
            "latest" => RawgConstants.SortValues.ReleaseDateDesc,
            "oldest" => RawgConstants.SortValues.ReleaseDateAsc,
            "popularity" => RawgConstants.SortValues.PopularityDesc,
            "popularityasc" => RawgConstants.SortValues.PopularityAsc,
            "trending" => RawgConstants.SortValues.TrendingDesc,
            "trendingasc" => RawgConstants.SortValues.TrendingAsc,
            _ => RawgConstants.SortValues.PopularityDesc
        };
    }

    private static string? NormalizeTags(string? tags)
    {
        if (string.IsNullOrWhiteSpace(tags))
        {
            return null;
        }

        var normalizedTags = tags
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return normalizedTags.Length == 0 ? null : string.Join(",", normalizedTags);
    }

    /// <summary>
    /// Builds the RAWG `dates` query parameter from a year filter.
    /// RAWG expects: "YYYY-01-01,YYYY-12-31"
    /// </summary>
    private static string? BuildRawgDateRange(int? year)
    {
        if (!year.HasValue)
            return null;

        return $"{year.Value}-01-01,{year.Value}-12-31";
    }

    /// <summary>
    /// Builds the RAWG `metacritic` query parameter from min/max rating bounds.
    /// RAWG expects a single comma-separated range: "80,100".
    /// Either bound can be omitted: "80," means "at least 80"; ",90" means "at most 90".
    /// </summary>
    private static string? BuildRawgMetacriticRange(double? min, double? max)
    {
        if (!min.HasValue && !max.HasValue)
            return null;

        var minStr = min.HasValue ? ((int)Math.Round(min.Value)).ToString(CultureInfo.InvariantCulture) : string.Empty;
        var maxStr = max.HasValue ? ((int)Math.Round(max.Value)).ToString(CultureInfo.InvariantCulture) : string.Empty;

        return $"{minStr},{maxStr}";
    }

    private string BuildEndpoint(string endpoint)
    {
        var baseUrl = _rawgOptions.BaseUrl.TrimEnd('/');
        return $"{baseUrl}/{endpoint.TrimStart('/')}";
    }

    
}
