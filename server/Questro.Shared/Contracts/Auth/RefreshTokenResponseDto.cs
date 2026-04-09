namespace Questro.Shared.Contracts.Auth;

public sealed record RefreshTokenResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresOnUtc,
    DateTime RefreshTokenExpiresOnUtc);