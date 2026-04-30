using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class UserGameLikeByUserAndGameSpecification : BaseSpecification<UserGameLike>
{
    public UserGameLikeByUserAndGameSpecification(long userId, int gameId)
        : base(x => x.UserId == userId && x.GameId == gameId)
    {
    }
}
