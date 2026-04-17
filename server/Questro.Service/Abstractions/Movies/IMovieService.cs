using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Movies;

public interface IMovieService
{
    Task<Result<PagedResponse<MovieListItemDto>>> GetMoviesAsync(MovieSpecParams specParams, CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<MovieListItemDto>>> GetRecentlyAddedAsync(int take = 20, CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<MovieListItemDto>>> GetTrendingAsync(int take = 20, CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<MovieGenreDto>>> GetGenresAsync(CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<MovieListItemDto>>> GetRecommendedAsync(int take = 20, CancellationToken cancellationToken = default);
    Task<Result<MovieListItemDto>> FetchAndSaveMovieByTmdbIdAsync(int tmdbId, CancellationToken cancellationToken = default);
    Task<Result<MovieDetailsDto>> GetMovieDetailsAsync(int tmdbId, long? userId = null, CancellationToken cancellationToken = default);
    Task<Result<StaffDetailsDto>> GetStaffDetailsAsync(int tmdbId, CancellationToken cancellationToken = default);
    Task<Result<MovieInteractionStatusDto>> ToggleLikeAsync(int tmdbId, long userId, CancellationToken cancellationToken = default);
    Task<Result<MovieInteractionStatusDto>> SetRatingAsync(int tmdbId, long userId, int stars, CancellationToken cancellationToken = default);
    Task<Result<MovieInteractionStatusDto>> ToggleWatchlistAsync(int tmdbId, long userId, CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<MovieReviewDto>>> GetMovieReviewsAsync(int tmdbId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<Result<MovieReviewDto>> AddReviewAsync(int tmdbId, long userId, string body, CancellationToken cancellationToken = default);
    Task<Result<MovieReviewDto>> UpdateReviewAsync(int tmdbId, long userId, string body, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteReviewAsync(int tmdbId, long userId, CancellationToken cancellationToken = default);
    Task<Result<MovieInteractionStatusDto>> MarkWatchedAsync(int tmdbId, long userId, CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<MovieListItemDto>>> GetRecommendedForMeAsync(long userId, int take = 20, CancellationToken cancellationToken = default);
}