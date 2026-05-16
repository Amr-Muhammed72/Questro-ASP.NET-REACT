using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Users;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Users;

public interface IUserMovieLibraryService
{
    Task<Result<PagedResponse<UserLibraryMovieItemDto>>> GetWatchlistAsync(long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<UserLibraryMovieItemDto>>> GetLikedAsync(long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<UserLibraryMovieItemDto>>> GetRatedAsync(long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<UserLibraryMovieItemDto>>> GetWatchedAsync(long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
}
