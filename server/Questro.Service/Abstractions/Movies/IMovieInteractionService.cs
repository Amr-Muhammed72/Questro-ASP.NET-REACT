using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Movies;

public interface IMovieInteractionService
{
    Task<Result<MovieInteractionStatusDto>> ToggleLikeAsync(int tmdbId, long userId, CancellationToken cancellationToken = default);
    Task<Result<MovieInteractionStatusDto>> SetRatingAsync(int tmdbId, long userId, int stars, CancellationToken cancellationToken = default);
    Task<Result<MovieInteractionStatusDto>> ToggleWatchlistAsync(int tmdbId, long userId, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<MovieReviewDto>>> GetMovieReviewsAsync(int tmdbId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<Result<MovieReviewDto>> AddReviewAsync(int tmdbId, long userId, string body, CancellationToken cancellationToken = default);
    Task<Result<MovieReviewDto>> UpdateReviewAsync(int tmdbId, long userId, string body, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteReviewAsync(int tmdbId, long userId, CancellationToken cancellationToken = default);
    Task<Result<MovieInteractionStatusDto>> ToggleWatchedAsync(int tmdbId, long userId, CancellationToken cancellationToken = default);
}
