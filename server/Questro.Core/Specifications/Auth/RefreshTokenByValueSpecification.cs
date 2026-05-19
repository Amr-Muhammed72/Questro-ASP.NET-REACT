using Questro.Core.Entities.UserManagement;

namespace Questro.Core.Specifications.Auth;


public class RefreshTokenByValueSpecification : BaseSpecification<RefreshToken>
{
    public RefreshTokenByValueSpecification(string tokenValue)
        : base(rt => rt.Token == tokenValue)
    {
    }
}
