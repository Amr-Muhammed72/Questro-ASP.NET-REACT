using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieReviewByUserAndMovieSpecification : BaseSpecification<UserMovieReview>
{
    public UserMovieReviewByUserAndMovieSpecification(long userId, int movieId)
        : base(x => x.UserId == userId && x.MovieId == movieId)
    {
        AddInclude(x => x.User);
    }
}
