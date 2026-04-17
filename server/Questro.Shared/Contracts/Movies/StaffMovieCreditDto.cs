namespace Questro.Shared.Contracts.Movies;

public sealed record StaffMovieCreditDto(
    int? MovieId,
    int? TmdbId,
    string Title,
    string? PosterUrl,
    DateTime? ReleaseDate,
    string? Role,
    double? TmdbRating);
