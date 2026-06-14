using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Games;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Games;

public interface IGameCatalogServices
{
    Task<Result<PagedResponse<GameListItemDto>>> GetGamesAsync(GameSpecParams specParams, long? userId = null, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<GameListItemDto>>> GetRecentlyAddedAsync(int take = 20, long? userId = null, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<GameListItemDto>>> GetTrendingAsync(int take = 30, long? userId = null, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<GameListItemDto>>> GetRecommendedForMeAsync(long userId, int take = 30, CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<GameGenreDto>>> GetGameGenresAsync(long? userId = null, CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<GamePlatformDto>>> GetGamePlatformsAsync(CancellationToken cancellationToken = default);
}
