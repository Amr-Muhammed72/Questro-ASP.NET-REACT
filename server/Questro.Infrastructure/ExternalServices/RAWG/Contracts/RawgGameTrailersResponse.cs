using System.Text.Json.Serialization;

namespace Questro.Infrastructure.ExternalServices.RAWG.Contracts;

public sealed class RawgGameTrailersResponse
{
    [JsonPropertyName("results")]
    public List<RawgGameTrailerDto> Results { get; set; } = new();
}

public sealed class RawgGameTrailerDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("preview")]
    public string? Preview { get; set; }

    [JsonPropertyName("data")]
    public RawgGameTrailerDataDto? Data { get; set; }
}

public sealed class RawgGameTrailerDataDto
{
    [JsonPropertyName("480")]
    public string? Sd { get; set; }

    [JsonPropertyName("max")]
    public string? Max { get; set; }
}
