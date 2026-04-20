using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieWatchedByUserAndMovieSpecification : BaseSpecification<UserMovieWatched>
{
    public UserMovieWatchedByUserAndMovieSpecification(long userId, int movieId)
        : base(x => x.UserId == userId && x.MovieId == movieId)
    {
    }
}
