using Questro.Core.Entities.Social;

namespace Questro.Core.Specifications.Social;

public class FollowingCountByUserSpecification : BaseSpecification<UserFollow>
{
    public FollowingCountByUserSpecification(long userId)
        : base(x => x.FollowerId == userId)
    {
    }
}
