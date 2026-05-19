using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Users;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Users;

public interface IUserGameLibraryService
{
    Task<Result<PagedResponse<UserLibraryGameItemDto>>> GetWishlistAsync(long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<UserLibraryGameItemDto>>> GetLikedAsync(long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<UserLibraryGameItemDto>>> GetRatedAsync(long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
}
