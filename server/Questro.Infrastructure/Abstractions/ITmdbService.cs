using Questro.Infrastructure.ExternalServices.Tmdb.Contracts;
using Questro.Shared.Contracts.Movies;

namespace Questro.Infrastructure.Abstractions;

public interface ITmdbService
{
    Task<TmdbPagedMovieResponse?> GetTrendingMoviesWeekAsync(int page = 1, CancellationToken cancellationToken = default);
    Task<TmdbPagedMovieResponse?> GetNowPlayingMoviesAsync(int page = 1, CancellationToken cancellationToken = default);
    Task<TmdbPagedMovieResponse?> DiscoverMoviesAsync(MovieSpecParams specParams, bool isChildAccount = false, CancellationToken cancellationToken = default);
    Task<TmdbPagedMovieResponse?> SearchMoviesAsync(MovieSpecParams specParams, bool isChildAccount = false, CancellationToken cancellationToken = default);
    Task<TmdbPagedPersonResponse?> SearchPersonsAsync(string query, int page = 1, CancellationToken cancellationToken = default);
    Task<TmdbGenreListResponse?> GetMovieGenresAsync(CancellationToken cancellationToken = default);
    Task<TmdbMovieDetailsResponse?> GetMovieDetailsAsync(int tmdbId, CancellationToken cancellationToken = default);
    Task<TmdbMovieCreditsResponse?> GetMovieCreditsAsync(int tmdbId, CancellationToken cancellationToken = default);
    Task<TmdbMovieVideosResponse?> GetMovieVideosAsync(int tmdbId, CancellationToken cancellationToken = default);
    Task<TmdbPagedMovieResponse?> GetSimilarMoviesAsync(int tmdbId, int page = 1, CancellationToken cancellationToken = default);
    Task<TmdbMovieWatchProvidersResponse?> GetMovieWatchProvidersAsync(int tmdbId, CancellationToken cancellationToken = default);
    Task<TmdbPersonDetailsResponse?> GetPersonDetailsAsync(int tmdbId, CancellationToken cancellationToken = default);
    Task<TmdbPersonMovieCreditsResponse?> GetPersonMovieCreditsAsync(int tmdbId, CancellationToken cancellationToken = default);
}
