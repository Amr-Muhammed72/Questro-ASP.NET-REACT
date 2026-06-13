using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class UserGameWishlistByUserAndGameSpecification : BaseSpecification<UserGameWishlist>
{
    public UserGameWishlistByUserAndGameSpecification(long userId, int gameId)
        : base(x => x.UserId == userId && x.GameId == gameId)
    {
    }
}
