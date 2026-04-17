using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieReviewsCountByMovieIdSpecification : BaseSpecification<UserMovieReview>
{
    public UserMovieReviewsCountByMovieIdSpecification(int movieId)
        : base(x => x.MovieId == movieId)
    {
    }
}
