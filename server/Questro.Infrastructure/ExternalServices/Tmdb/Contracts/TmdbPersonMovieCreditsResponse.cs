using System.Text.Json.Serialization;

namespace Questro.Infrastructure.ExternalServices.Tmdb.Contracts;

public sealed class TmdbPersonMovieCreditsResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("cast")]
    public List<TmdbPersonMovieCastCreditDto> Cast { get; set; } = new();

    [JsonPropertyName("crew")]
    public List<TmdbPersonMovieCrewCreditDto> Crew { get; set; } = new();
}

public sealed class TmdbPersonMovieCastCreditDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("poster_path")]
    public string? PosterPath { get; set; }

    [JsonPropertyName("release_date")]
    public string? ReleaseDate { get; set; }

    [JsonPropertyName("character")]
    public string? Character { get; set; }

    [JsonPropertyName("vote_average")]
    public double? VoteAverage { get; set; }
}

public sealed class TmdbPersonMovieCrewCreditDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("poster_path")]
    public string? PosterPath { get; set; }

    [JsonPropertyName("release_date")]
    public string? ReleaseDate { get; set; }

    [JsonPropertyName("department")]
    public string? Department { get; set; }

    [JsonPropertyName("job")]
    public string? Job { get; set; }

    [JsonPropertyName("vote_average")]
    public double? VoteAverage { get; set; }
}
