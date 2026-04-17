using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieRateByUserAndMovieSpecification : BaseSpecification<UserMovieRate>
{
    public UserMovieRateByUserAndMovieSpecification(long userId, int movieId)
        : base(x => x.UserId == userId && x.MovieId == movieId)
    {
    }
}
