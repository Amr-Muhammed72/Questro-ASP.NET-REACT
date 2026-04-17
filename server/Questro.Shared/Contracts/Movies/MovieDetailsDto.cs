namespace Questro.Shared.Contracts.Movies;

public sealed record MovieDetailsDto(
    int MovieId,
    int? TmdbId,
    string Title,
    string? Overview,
    int? Runtime,
    DateTime? ReleaseDate,
    string? Language,
    string? PosterUrl,
    string? BackdropUrl,
    double? Popularity,
    double? TmdbRating,
    int? TmdbVoteCount,
    string? ImdbId,
    string? TrailerUrl,
    IEnumerable<string> Genres,
    IEnumerable<MovieStaffCreditDto> Cast,
    IEnumerable<MovieStaffCreditDto> Crew,
    IEnumerable<MovieListItemDto> SimilarMovies,
    MovieWatchProvidersDto? WatchProviders,
    MovieRatingSummaryDto RatingSummary,
    MovieUserStatusDto? UserStatus);
