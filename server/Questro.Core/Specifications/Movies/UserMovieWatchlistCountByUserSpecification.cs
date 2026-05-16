using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieWatchlistCountByUserSpecification : BaseSpecification<UserMovieWatchlist>
{
    public UserMovieWatchlistCountByUserSpecification(long userId)
        : base(x => x.UserId == userId)
    {
    }
}
