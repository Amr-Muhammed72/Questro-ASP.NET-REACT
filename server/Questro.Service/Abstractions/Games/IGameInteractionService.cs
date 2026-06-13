using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Games;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Games;

public interface IGameInteractionService
{
    Task<Result<GameInteractionStatusDto>> ToggleLikeAsync(int rawgId, long userId, CancellationToken cancellationToken = default);
    Task<Result<GameInteractionStatusDto>> SetRatingAsync(int rawgId, long userId, int stars, CancellationToken cancellationToken = default);
    Task<Result<GameInteractionStatusDto>> ToggleWishlistAsync(int rawgId, long userId, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<GameReviewDto>>> GetGameReviewsAsync(int rawgId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<Result<GameReviewDto>> AddReviewAsync(int rawgId, long userId, string body, CancellationToken cancellationToken = default);
    Task<Result<GameReviewDto>> UpdateReviewAsync(int rawgId, long userId, string body, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteReviewAsync(int rawgId, long userId, CancellationToken cancellationToken = default);
}
