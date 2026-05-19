using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieLikesCountByUserSpecification : BaseSpecification<UserMovieLike>
{
    public UserMovieLikesCountByUserSpecification(long userId)
        : base(x => x.UserId == userId)
    {
    }
}
