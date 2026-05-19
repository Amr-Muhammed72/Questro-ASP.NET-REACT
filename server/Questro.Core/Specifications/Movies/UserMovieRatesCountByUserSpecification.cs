using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieRatesCountByUserSpecification : BaseSpecification<UserMovieRate>
{
    public UserMovieRatesCountByUserSpecification(long userId)
        : base(x => x.UserId == userId)
    {
    }
}
