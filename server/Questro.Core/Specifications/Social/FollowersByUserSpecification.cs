using Questro.Core.Entities.Social;

namespace Questro.Core.Specifications.Social;

public class FollowersByUserSpecification : BaseSpecification<UserFollow>
{
    public FollowersByUserSpecification(long userId, int pageIndex, int pageSize)
        : base(x => x.FolloweeId == userId)
    {
        AddInclude(x => x.Follower);
        AddOrderByDescending(x => x.Timestamp);

        var safePageIndex = pageIndex < 1 ? 1 : pageIndex;
        var safePageSize = pageSize < 1 ? 20 : pageSize;
        var skip = (safePageIndex - 1) * safePageSize;

        ApplyPaging(skip, safePageSize);
    }
}
