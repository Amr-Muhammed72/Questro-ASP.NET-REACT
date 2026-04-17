using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class MovieStaffByMovieIdSpecification : BaseSpecification<Movie_Staff>
{
    public MovieStaffByMovieIdSpecification(int movieId)
        : base(x => x.MovieId == movieId)
    {
    }
}
