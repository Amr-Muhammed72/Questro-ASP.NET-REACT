using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class UserGameWishlistCountByUserSpecification : BaseSpecification<UserGameWishlist>
{
    public UserGameWishlistCountByUserSpecification(long userId)
        : base(x => x.UserId == userId)
    {
    }
}
