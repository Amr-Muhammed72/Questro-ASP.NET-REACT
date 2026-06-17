using Questro.Shared.Contracts.Games;
using Questro.Shared.Contracts.Movies;

namespace Questro.Infrastructure.Abstractions;

public interface IUserInteractionQueryRepository
{
    Task<MovieInteractionStatusDto> GetMovieInteractionStatusAsync(long userId, int tmdbId, CancellationToken cancellationToken = default);
    Task<GameInteractionStatusDto> GetGameInteractionStatusAsync(long userId, int rawgId, CancellationToken cancellationToken = default);
}
