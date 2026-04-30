using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class UserGameReviewByUserAndGameSpecification : BaseSpecification<UserGameReview>
{
    public UserGameReviewByUserAndGameSpecification(long userId, int gameId)
        : base(x => x.UserId == userId && x.GameId == gameId)
    {
    }
}
