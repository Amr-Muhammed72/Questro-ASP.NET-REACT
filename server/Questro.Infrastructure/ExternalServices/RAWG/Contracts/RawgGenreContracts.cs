using System.Text.Json.Serialization;

namespace Questro.Infrastructure.ExternalServices.RAWG.Contracts;

public sealed class RawgGenreListResponse
{
    [JsonPropertyName("results")]
    public List<RawgGenreDto> Results { get; set; } = new();
}

public sealed class RawgGenreDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("image_background")]
    public string? ImageBackground { get; set; }
}

public sealed class RawgPlatformListResponse
{
    [JsonPropertyName("results")]
    public List<RawgPlatformDto> Results { get; set; } = new();
}

public sealed class RawgPlatformDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }
}

public sealed class RawgPlatformWithReleaseDateDto
{
    [JsonPropertyName("platform")]
    public RawgPlatformDto? Platform { get; set; }

    [JsonPropertyName("released_at")]
    public string? ReleasedAt { get; set; }

    [JsonPropertyName("requirements")]
    public RawgPlatformRequirementsDto? Requirements { get; set; }

    [JsonPropertyName("requirements_en")]
    public RawgPlatformRequirementsDto? RequirementsEn { get; set; }
}

public sealed class RawgPlatformRequirementsDto
{
    [JsonPropertyName("minimum")]
    public string? Minimum { get; set; }

    [JsonPropertyName("recommended")]
    public string? Recommended { get; set; }
}

public sealed class RawgStoreDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("url")]
    public string? Url { get; set; }
}
