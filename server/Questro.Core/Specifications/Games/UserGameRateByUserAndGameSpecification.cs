using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class UserGameRateByUserAndGameSpecification : BaseSpecification<UserGameRate>
{
    public UserGameRateByUserAndGameSpecification(long userId, int gameId)
        : base(x => x.UserId == userId && x.GameId == gameId)
    {
    }
}
