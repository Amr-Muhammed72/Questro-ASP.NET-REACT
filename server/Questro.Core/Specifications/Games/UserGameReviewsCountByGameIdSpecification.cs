using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class UserGameReviewsCountByGameIdSpecification : BaseSpecification<UserGameReview>
{
    public UserGameReviewsCountByGameIdSpecification(int gameId)
        : base(x => x.GameId == gameId)
    {
    }
}
