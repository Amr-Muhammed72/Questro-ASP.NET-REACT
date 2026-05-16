using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Games;
using Questro.Shared.Result;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Service.Abstractions.Games
{
    public interface IGameCatalogServices
    {
        Task<Result<PagedResponse<GameListItemDto>>>  GetGamesAsync(GameSpecParams specParams, CancellationToken cancellationToken = default);
        Task<Result<PagedResponse<GameListItemDto>>> GetRecentlyAddedAsync(int take = 20, CancellationToken cancellationToken = default);
        Task<Result<PagedResponse<GameListItemDto>>> GetTrendingAsync(int take = 30, CancellationToken cancellationToken = default);
        Task<Result<PagedResponse<GameListItemDto>>> GetRecommendedForMeAsync(long userId, int take = 30, CancellationToken cancellationToken = default);
        Task<Result<IEnumerable<GameGenreDto>>> GetGameGenresAsync(CancellationToken cancellationToken = default);
        Task<Result<IEnumerable<GamePlatformDto>>> GetGamePlatformsAsync(CancellationToken cancellationToken = default);
    }
}
