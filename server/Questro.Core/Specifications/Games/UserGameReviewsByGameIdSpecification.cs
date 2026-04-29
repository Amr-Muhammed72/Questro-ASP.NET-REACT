using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class UserGameReviewsByGameIdSpecification : BaseSpecification<UserGameReview>
{
    public UserGameReviewsByGameIdSpecification(int gameId, int pageIndex = 1, int pageSize = 20)
        : base(x => x.GameId == gameId)
    {
        AddInclude(x => x.User);
        ApplyPaging((pageIndex - 1) * pageSize, pageSize);
        AddOrderByDescending(x => x.Timestamp);
    }
}
