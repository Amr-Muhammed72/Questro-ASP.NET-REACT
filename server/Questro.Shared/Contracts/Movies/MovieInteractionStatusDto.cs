namespace Questro.Shared.Contracts.Movies;

public sealed record MovieInteractionStatusDto(
    int MovieId,
    int? TmdbId,
    bool IsLiked,
    bool IsInWatchlist,
    int? UserRating);
