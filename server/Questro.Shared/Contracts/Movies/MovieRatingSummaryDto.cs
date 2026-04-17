namespace Questro.Shared.Contracts.Movies;

public sealed record MovieRatingSummaryDto(
    double? Average,
    int Count);
