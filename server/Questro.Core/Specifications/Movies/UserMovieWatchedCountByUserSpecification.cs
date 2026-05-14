using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieWatchedCountByUserSpecification : BaseSpecification<UserMovieWatched>
{
    public UserMovieWatchedCountByUserSpecification(long userId)
        : base(x => x.UserId == userId)
    {
    }
}
