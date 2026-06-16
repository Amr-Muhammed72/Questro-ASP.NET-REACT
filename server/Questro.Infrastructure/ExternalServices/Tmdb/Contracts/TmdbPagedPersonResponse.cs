using System.Text.Json.Serialization;

namespace Questro.Infrastructure.ExternalServices.Tmdb.Contracts;

public sealed class TmdbPagedPersonResponse
{
    [JsonPropertyName("page")]
    public int Page { get; set; }

    [JsonPropertyName("total_pages")]
    public int TotalPages { get; set; }

    [JsonPropertyName("total_results")]
    public int TotalResults { get; set; }

    [JsonPropertyName("results")]
    public List<TmdbPersonSummaryDto> Results { get; set; } = new();
}

public sealed class TmdbPersonSummaryDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("profile_path")]
    public string? ProfilePath { get; set; }
}
