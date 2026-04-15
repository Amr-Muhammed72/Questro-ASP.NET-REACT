namespace Questro.Shared.Contracts.Auth;

public sealed record RegisterResponseDto(
    long UserId,
    string UserName,
    string FirstName,
    string LastName,
    string Email,
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresOnUtc,
    DateTime RefreshTokenExpiresOnUtc);