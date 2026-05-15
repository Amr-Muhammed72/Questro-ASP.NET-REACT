using Questro.Core.Entities.UserManagement;

namespace Questro.Core.Specifications.Auth;


public class ActiveRefreshTokensByUserSpecification : BaseSpecification<RefreshToken>
{
    public ActiveRefreshTokensByUserSpecification(long userId)
        : base(rt => rt.UserId == userId && rt.RevokedOnUtc == null)
    {
    }
}
