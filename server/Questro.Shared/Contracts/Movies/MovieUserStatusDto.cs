namespace Questro.Shared.Contracts.Movies;

public sealed record MovieUserStatusDto(
    bool IsLiked,
    bool IsInWatchlist,
    bool IsWatched,
    int? UserRating);
