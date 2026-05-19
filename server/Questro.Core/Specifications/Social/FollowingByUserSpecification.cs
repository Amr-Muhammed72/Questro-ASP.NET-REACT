using Questro.Core.Entities.Social;

namespace Questro.Core.Specifications.Social;

public class FollowingByUserSpecification : BaseSpecification<UserFollow>
{
    public FollowingByUserSpecification(long userId, int pageIndex, int pageSize)
        : base(x => x.FollowerId == userId)
    {
        AddInclude(x => x.Followee);
        AddOrderByDescending(x => x.Timestamp);

        var safePageIndex = pageIndex < 1 ? 1 : pageIndex;
        var safePageSize = pageSize < 1 ? 20 : pageSize;
        var skip = (safePageIndex - 1) * safePageSize;

        ApplyPaging(skip, safePageSize);
    }
}
