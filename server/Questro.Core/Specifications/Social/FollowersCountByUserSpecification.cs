using Questro.Core.Entities.Social;

namespace Questro.Core.Specifications.Social;

public class FollowersCountByUserSpecification : BaseSpecification<UserFollow>
{
    public FollowersCountByUserSpecification(long userId)
        : base(x => x.FolloweeId == userId)
    {
    }
}
