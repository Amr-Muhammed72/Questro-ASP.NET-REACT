using Questro.Core.Entities.Social;

namespace Questro.Core.Specifications.Social;

public class FollowExistsSpecification : BaseSpecification<UserFollow>
{
    public FollowExistsSpecification(long followerId, long followeeId)
        : base(x => x.FollowerId == followerId && x.FolloweeId == followeeId)
    {
    }
}
