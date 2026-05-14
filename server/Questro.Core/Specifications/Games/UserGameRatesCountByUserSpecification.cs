using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class UserGameRatesCountByUserSpecification : BaseSpecification<UserGameRate>
{
    public UserGameRatesCountByUserSpecification(long userId)
        : base(x => x.UserId == userId)
    {
    }
}
