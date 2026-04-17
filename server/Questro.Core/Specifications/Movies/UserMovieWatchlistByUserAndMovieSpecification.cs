using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieWatchlistByUserAndMovieSpecification : BaseSpecification<UserMovieWatchlist>
{
    public UserMovieWatchlistByUserAndMovieSpecification(long userId, int movieId)
        : base(x => x.UserId == userId && x.MovieId == movieId)
    {
    }
}
