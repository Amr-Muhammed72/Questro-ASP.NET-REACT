
using Questro.Infrastructure.Abstractions;
using Questro.Service.Abstractions.Interactions;
using Questro.Shared.Contracts.Games;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.ErrorHandle.Games;
using Questro.Shared.ErrorHandle.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Services.Interactions;

public sealed class UserInteractionService : IUserInteractionService
{
    private readonly IUserInteractionQueryRepository _queryRepository;

    public UserInteractionService(IUserInteractionQueryRepository queryRepository)
    {
        _queryRepository = queryRepository;
    }

    public async Task<Result<MovieInteractionStatusDto>> GetMovieInteractionStatusAsync(long userId, int tmdbId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<MovieInteractionStatusDto>(MovieError.UnauthorizedInteraction);
        }

        if (tmdbId <= 0)
        {
            return Result.Failure<MovieInteractionStatusDto>(MovieError.InvalidTmdbId);
        }

        var status = await _queryRepository.GetMovieInteractionStatusAsync(userId, tmdbId, cancellationToken);
        return Result.Success(status);
    }

    public async Task<Result<GameInteractionStatusDto>> GetGameInteractionStatusAsync(long userId, int rawgId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<GameInteractionStatusDto>(GameError.UnauthorizedInteraction);
        }

        if (rawgId <= 0)
        {
            return Result.Failure<GameInteractionStatusDto>(GameError.InvalidRawgId);
        }

        var status = await _queryRepository.GetGameInteractionStatusAsync(userId, rawgId, cancellationToken);
        return Result.Success(status);
    }
}
