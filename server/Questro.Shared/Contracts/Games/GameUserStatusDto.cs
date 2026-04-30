namespace Questro.Shared.Contracts.Games;

public sealed record GameUserStatusDto(
    bool IsLiked,
    bool IsInWishlist,
    int? UserRating);
