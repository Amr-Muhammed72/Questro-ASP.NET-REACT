using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Shared.Contracts.Auth;
public record LogInResponseDto(
    long UserId,
    string UserName,
    string FirstName,
    string LastName,
    string Email,
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresOnUtc,
    DateTime RefreshTokenExpiresOnUtc);
    
