using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Social;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Social;

public interface IUserNetworkService
{
    Task<Result<bool>> FollowAsync(long followerId, long followeeId, CancellationToken cancellationToken = default);
    Task<Result<bool>> UnfollowAsync(long followerId, long followeeId, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<UserFollowDto>>> GetFollowersAsync(long userId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<UserFollowDto>>> GetFollowingAsync(long userId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<Result<FollowStatsDto>> GetFollowStatsAsync(long userId, long? currentUserId, CancellationToken cancellationToken = default);
}
