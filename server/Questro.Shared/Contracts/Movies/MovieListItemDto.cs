namespace Questro.Shared.Contracts.Movies;

public sealed record MovieListItemDto(
    int MovieId,
    int? TmdbId,
    string Title,
    string? PosterUrl,
    string? BackdropUrl,
    DateTime? ReleaseDate,
    string? Language,
    string? MpaCertification,
    double? Popularity,
    double? TmdbRating,
    int? TmdbVoteCount,
    IEnumerable<string> Genres,
    IEnumerable<string> StaffNames);