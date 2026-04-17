using System.Text.Json.Serialization;

namespace Questro.Infrastructure.ExternalServices.Tmdb.Contracts;

public sealed class TmdbGenreListResponse
{
    [JsonPropertyName("genres")]
    public List<TmdbGenreDto> Genres { get; set; } = new();
}

public sealed class TmdbGenreDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}
