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
        var movieId = await _context.Movies.Where(x => x.TMDB_Id == tmdbId).Select(x => x.MovieId).FirstOrDefaultAsync(cancellationToken);
        var isLiked = await _context.UserMovieLikes.AnyAsync(x => x.UserId == userId && x.Movie.TMDB_Id == tmdbId, cancellationToken);
        var isInWatchlist = await _context.UserMovieWatchlists.AnyAsync(x => x.UserId == userId && x.Movie.TMDB_Id == tmdbId, cancellationToken);
        var isWatched = await _context.UserMovieWatched.AnyAsync(x => x.UserId == userId && x.Movie.TMDB_Id == tmdbId, cancellationToken);
        var rating = await _context.UserMovieRates.Where(x => x.UserId == userId && x.Movie.TMDB_Id == tmdbId).Select(x => (int?)x.Stars).FirstOrDefaultAsync(cancellationToken);

        return new MovieInteractionStatusDto(
            movieId,
            tmdbId,
            isLiked,
            isInWatchlist,
            isWatched,
            rating);
    }

    public async Task<GameInteractionStatusDto> GetGameInteractionStatusAsync(long userId, int rawgId, CancellationToken cancellationToken = default)
    {
        var gameId = await _context.Games.Where(x => x.RAWG_Id == rawgId).Select(x => x.GameId).FirstOrDefaultAsync(cancellationToken);
        var isLiked = await _context.UserGameLikes.AnyAsync(x => x.UserId == userId && x.Game.RAWG_Id == rawgId, cancellationToken);
        var isInWishlist = await _context.UserGameWishlists.AnyAsync(x => x.UserId == userId && x.Game.RAWG_Id == rawgId, cancellationToken);
        var rating = await _context.UserGameRates.Where(x => x.UserId == userId && x.Game.RAWG_Id == rawgId).Select(x => (int?)x.Stars).FirstOrDefaultAsync(cancellationToken);

        return new GameInteractionStatusDto
        {
            GameId = gameId,
            RawgId = rawgId,
            IsLiked = isLiked,
            IsInWishlist = isInWishlist,
            UserRating = rating
        };
    }
}
