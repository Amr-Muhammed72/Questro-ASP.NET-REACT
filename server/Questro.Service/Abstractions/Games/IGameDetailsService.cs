using Questro.Shared.Contracts.Games;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Games;

public interface IGameDetailsService
{
    Task<Result<GameDetailsDto>> GetGameDetailsAsync(int rawgId, CancellationToken cancellationToken = default);
}
