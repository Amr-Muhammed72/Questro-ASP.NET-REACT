using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class UserGameRatesByUserSpecification : BaseSpecification<UserGameRate>
{
    public UserGameRatesByUserSpecification(long userId, int pageIndex, int pageSize)
        : base(x => x.UserId == userId)
    {
        AddInclude(x => x.Game);
        AddOrderByDescending(x => x.Timestamp);

        var safePageIndex = pageIndex < 1 ? 1 : pageIndex;
        var safePageSize = pageSize < 1 ? 20 : pageSize;
        var skip = (safePageIndex - 1) * safePageSize;

        ApplyPaging(skip, safePageSize);
    }
}
