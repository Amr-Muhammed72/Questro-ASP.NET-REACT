using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieLikeByUserAndMovieSpecification : BaseSpecification<UserMovieLike>
{
    public UserMovieLikeByUserAndMovieSpecification(long userId, int movieId)
        : base(x => x.UserId == userId && x.MovieId == movieId)
    {
    }
}
