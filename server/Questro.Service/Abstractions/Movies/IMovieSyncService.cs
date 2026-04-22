using Questro.Shared.Contracts.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Movies;

public interface IMovieSyncService
{
    Task<Result<MovieListItemDto>> FetchAndSaveMovieByTmdbIdAsync(int tmdbId, CancellationToken cancellationToken = default);
}
