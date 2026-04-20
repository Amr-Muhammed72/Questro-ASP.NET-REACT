using System.Text.Json.Serialization;

namespace Questro.Infrastructure.ExternalServices.Tmdb.Contracts;

public sealed class TmdbMovieWatchProvidersResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("results")]
    public Dictionary<string, TmdbWatchProviderRegionDto> Results { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed class TmdbWatchProviderRegionDto
{
    [JsonPropertyName("link")]
    public string? Link { get; set; }

    [JsonPropertyName("flatrate")]
    public List<TmdbWatchProviderDto> Flatrate { get; set; } = new();

    [JsonPropertyName("rent")]
    public List<TmdbWatchProviderDto> Rent { get; set; } = new();

    [JsonPropertyName("buy")]
    public List<TmdbWatchProviderDto> Buy { get; set; } = new();
}

public sealed class TmdbWatchProviderDto
{
    [JsonPropertyName("provider_id")]
    public int ProviderId { get; set; }

    [JsonPropertyName("provider_name")]
    public string? ProviderName { get; set; }

    [JsonPropertyName("logo_path")]
    public string? LogoPath { get; set; }

    [JsonPropertyName("display_priority")]
    public int? DisplayPriority { get; set; }
}
