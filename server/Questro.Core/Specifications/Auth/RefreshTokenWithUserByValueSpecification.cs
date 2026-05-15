using Questro.Core.Entities.UserManagement;

namespace Questro.Core.Specifications.Auth;


public class RefreshTokenWithUserByValueSpecification : BaseSpecification<RefreshToken>
{
    public RefreshTokenWithUserByValueSpecification(string tokenValue)
        : base(rt => rt.Token == tokenValue)
    {
        AddInclude(rt => rt.User);
    }
}
