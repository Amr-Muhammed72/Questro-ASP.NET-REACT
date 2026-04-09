namespace Questro.Shared.Contracts.Auth;

public sealed class RefreshTokenRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
}