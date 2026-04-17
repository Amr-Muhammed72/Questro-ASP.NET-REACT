using Questro.Shared.Contracts.Auth;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Auth;

public interface IAuthService
{
    Task<Result<RegisterResponseDto>> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
    Task<Result<LogInResponseDto>> LogInAsync(LogInRequestDto request, CancellationToken cancellationToken = default);
    Task<Result<RefreshTokenResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default);
    Task<Result> LogOutAsync(string? refreshToken, CancellationToken cancellationToken);
}