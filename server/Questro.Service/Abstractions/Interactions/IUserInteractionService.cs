using Questro.Shared.Contracts.Games;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Interactions;

public interface IUserInteractionService
{
    Task<Result<MovieInteractionStatusDto>> GetMovieInteractionStatusAsync(long userId, int tmdbId, CancellationToken cancellationToken = default);
    Task<Result<GameInteractionStatusDto>> GetGameInteractionStatusAsync(long userId, int rawgId, CancellationToken cancellationToken = default);
}
