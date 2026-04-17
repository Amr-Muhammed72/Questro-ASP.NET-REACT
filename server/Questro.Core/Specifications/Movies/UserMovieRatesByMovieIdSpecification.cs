using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieRatesByMovieIdSpecification : BaseSpecification<UserMovieRate>
{
    public UserMovieRatesByMovieIdSpecification(int movieId)
        : base(x => x.MovieId == movieId)
    {
    }
}
