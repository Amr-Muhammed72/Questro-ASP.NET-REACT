using Questro.Infrastructure.ExternalServices.RAWG.Contracts;
using Questro.Shared.Contracts.Games;

namespace Questro.Infrastructure.Abstractions;

public interface IRawgService
{
    Task<RawgPagedGameResponse?> GetTrendingGamesAsync(int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<RawgPagedGameResponse?> DiscoverGamesAsync(GameSpecParams specParams, CancellationToken cancellationToken = default);
    Task<RawgPagedGameResponse?> SearchGamesAsync(GameSpecParams specParams, CancellationToken cancellationToken = default);
    Task<RawgGenreListResponse?> GetGameGenresAsync(CancellationToken cancellationToken = default);
    Task<RawgGameDetailsResponse?> GetGameDetailsAsync(int rawgId, CancellationToken cancellationToken = default);
    Task<RawgPagedGameResponse?> GetSimilarGamesAsync(int rawgId, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<RawgGameTrailersResponse?> GetGameTrailersAsync(int rawgId, CancellationToken cancellationToken = default);
    Task<RawgGameScreenshotsResponse?> GetGameScreenshotsAsync(int rawgId, CancellationToken cancellationToken = default);

}
