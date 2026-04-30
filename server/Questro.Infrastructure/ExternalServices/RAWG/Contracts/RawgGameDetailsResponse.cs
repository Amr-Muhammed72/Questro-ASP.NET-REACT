using System.Text.Json.Serialization;

namespace Questro.Infrastructure.ExternalServices.RAWG.Contracts;

public sealed class RawgGameDetailsResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("released")]
    public string? Released { get; set; }

    [JsonPropertyName("background_image")]
    public string? BackgroundImage { get; set; }

    [JsonPropertyName("background_image_additional")]
    public string? BackgroundImageAdditional { get; set; }

    [JsonPropertyName("rating")]
    public double? Rating { get; set; }

    [JsonPropertyName("ratings_count")]
    public int? RatingsCount { get; set; }

    [JsonPropertyName("playtime")]
    public int? Playtime { get; set; }

    [JsonPropertyName("website")]
    public string? Website { get; set; }

    [JsonPropertyName("genres")]
    public List<RawgGenreDto> Genres { get; set; } = new();

    [JsonPropertyName("platforms")]
    public List<RawgPlatformWithReleaseDateDto> Platforms { get; set; } = new();

    [JsonPropertyName("stores")]
    public List<RawgStoreDto> Stores { get; set; } = new();

    [JsonPropertyName("developers")]
    public List<RawgDeveloperDto> Developers { get; set; } = new();

    [JsonPropertyName("publishers")]
    public List<RawgPublisherDto> Publishers { get; set; } = new();
}

public sealed class RawgDeveloperDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("image_background")]
    public string? ImageBackground { get; set; }
}

public sealed class RawgPublisherDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("image_background")]
    public string? ImageBackground { get; set; }
}
