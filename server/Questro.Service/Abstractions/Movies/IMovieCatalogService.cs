using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Movies;

public interface IMovieCatalogService
{
    Task<Result<PagedResponse<MovieListItemDto>>> GetMoviesAsync(MovieSpecParams specParams, long? userId = null, CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<MovieListItemDto>>> GetRecentlyAddedAsync(int take = 20, long? userId = null, CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<MovieListItemDto>>> GetTrendingAsync(int take = 20, long? userId = null, CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<MovieGenreDto>>> GetGenresAsync(CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<MovieListItemDto>>> GetRecommendedAsync(int take = 20, long? userId = null, CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<MovieListItemDto>>> GetRecommendedForMeAsync(long userId, int take = 20, CancellationToken cancellationToken = default);
}
