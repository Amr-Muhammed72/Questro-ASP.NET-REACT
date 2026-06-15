using Microsoft.EntityFrameworkCore;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.Data;
using Questro.Shared.Contracts.Games;
using Questro.Shared.Contracts.Movies;

namespace Questro.Infrastructure.Repositories;

public class UserInteractionQueryRepository : IUserInteractionQueryRepository
{
    private readonly ApplicationDbContext _context;

    public UserInteractionQueryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<MovieInteractionStatusDto> GetMovieInteractionStatusAsync(long userId, int tmdbId, CancellationToken cancellationToken = default)
    {
        var movieIdTask = _context.Movies.Where(x => x.TMDB_Id == tmdbId).Select(x => x.MovieId).FirstOrDefaultAsync(cancellationToken);
        var likeTask = _context.UserMovieLikes.AnyAsync(x => x.UserId == userId && x.Movie.TMDB_Id == tmdbId, cancellationToken);
        var watchlistTask = _context.UserMovieWatchlists.AnyAsync(x => x.UserId == userId && x.Movie.TMDB_Id == tmdbId, cancellationToken);
        var watchedTask = _context.UserMovieWatched.AnyAsync(x => x.UserId == userId && x.Movie.TMDB_Id == tmdbId, cancellationToken);
        var ratingTask = _context.UserMovieRates.Where(x => x.UserId == userId && x.Movie.TMDB_Id == tmdbId).Select(x => (int?)x.Stars).FirstOrDefaultAsync(cancellationToken);

        await Task.WhenAll(movieIdTask, likeTask, watchlistTask, watchedTask, ratingTask);

        return new MovieInteractionStatusDto(
            movieIdTask.Result,
            tmdbId,
            likeTask.Result,
            watchlistTask.Result,
            watchedTask.Result,
            ratingTask.Result);
    }

    public async Task<GameInteractionStatusDto> GetGameInteractionStatusAsync(long userId, int rawgId, CancellationToken cancellationToken = default)
    {
        var gameIdTask = _context.Games.Where(x => x.RAWG_Id == rawgId).Select(x => x.GameId).FirstOrDefaultAsync(cancellationToken);
        var likeTask = _context.UserGameLikes.AnyAsync(x => x.UserId == userId && x.Game.RAWG_Id == rawgId, cancellationToken);
        var wishlistTask = _context.UserGameWishlists.AnyAsync(x => x.UserId == userId && x.Game.RAWG_Id == rawgId, cancellationToken);
        var ratingTask = _context.UserGameRates.Where(x => x.UserId == userId && x.Game.RAWG_Id == rawgId).Select(x => (int?)x.Stars).FirstOrDefaultAsync(cancellationToken);

        await Task.WhenAll(gameIdTask, likeTask, wishlistTask, ratingTask);

        return new GameInteractionStatusDto
        {
            GameId = gameIdTask.Result,
            RawgId = rawgId,
            IsLiked = likeTask.Result,
            IsInWishlist = wishlistTask.Result,
            UserRating = ratingTask.Result
        };
    }
}
