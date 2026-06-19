namespace Questro.Shared.Contracts.Movies;

public sealed record MovieReviewDto(
    int ReviewId,
    int? TmdbId,
    long UserId,
    string? UserName,
    string Body,
    string? Sentiment,
    DateTime Timestamp,
    string? UserProfilePictureUrl = null);
