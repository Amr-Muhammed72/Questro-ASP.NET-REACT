using Questro.Shared.Contracts.Games;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Games;

public interface IGameSyncService
{
    Task<Result<GameListItemDto>> FetchAndSaveGameByRawgIdAsync(int rawgId, CancellationToken cancellationToken = default);
}
