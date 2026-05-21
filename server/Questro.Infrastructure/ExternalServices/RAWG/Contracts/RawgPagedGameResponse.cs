using System.Text.Json.Serialization;

namespace Questro.Infrastructure.ExternalServices.RAWG.Contracts;

public sealed class RawgPagedGameResponse
{
    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("next")]
    public string? Next { get; set; }

    [JsonPropertyName("results")]
    public List<RawgGameSummaryDto> Results { get; set; } = new();
}

public sealed class RawgGameSummaryDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("released")]
    public string? Released { get; set; }

    [JsonPropertyName("background_image")]
    public string? BackgroundImage { get; set; }

    [JsonPropertyName("rating")]
    public double? Rating { get; set; }

    [JsonPropertyName("ratings_count")]
    public int? RatingsCount { get; set; }

    [JsonPropertyName("playtime")]
    public int? Playtime { get; set; }

    [JsonPropertyName("genres")]
    public List<RawgGenreDto> Genres { get; set; } = new();

    [JsonPropertyName("platforms")]
    public List<RawgPlatformWithReleaseDateDto> Platforms { get; set; } = new();

    [JsonPropertyName("stores")]
    public List<RawgStoreDto> Stores { get; set; } = new();

    [JsonPropertyName("tags")]
    public List<RawgTagDto> Tags { get; set; } = new();
}
