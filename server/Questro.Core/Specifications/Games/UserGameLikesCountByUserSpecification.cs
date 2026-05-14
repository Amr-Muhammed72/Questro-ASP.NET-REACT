using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class UserGameLikesCountByUserSpecification : BaseSpecification<UserGameLike>
{
    public UserGameLikesCountByUserSpecification(long userId)
        : base(x => x.UserId == userId)
    {
    }
}
