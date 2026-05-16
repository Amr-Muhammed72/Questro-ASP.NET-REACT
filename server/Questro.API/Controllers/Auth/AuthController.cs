using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Auth;
using Questro.Service.Abstractions;
using Questro.Shared.Contracts.Auth;
using Questro.Shared.Contracts.OTP;

using Questro.Shared.Result;

namespace Questro.API.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
   

    public AuthController(IAuthService authService )
    {
        _authService = authService;
        
    }
  

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request, cancellationToken);

        if (result.IsFailure)
        {
            var errorResponse = new
            {
                code = result.Error.Code,
                en = result.Error.en,
                Details = result.Details
            };

            return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
        }
       
        return Created($"api/auth/{result.Value.UserId}", new
        {
            message = "OTP sent to your email",
            result.Value.UserId,
            result.Value.UserName,
            result.Value.FirstName,
            result.Value.LastName,
            result.Value.Email
        });
    }
    [HttpPost("Verify")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _authService.VerifyOtpAndLoginAsync(request, cancellationToken);

        if (result.IsFailure)
            return StatusCode(result.Error.StatusCode ?? 500, new
            {
                result.Error.Code,
                result.Error.en
            });

        SetRefreshTokenInCookie(result.Value.RefreshToken, result.Value.RefreshTokenExpiresOnUtc);

        return Ok(new
        {
            result.Value.UserId,
            result.Value.UserName,
            result.Value.FirstName,
            result.Value.LastName,
            result.Value.Email,
            result.Value.AccessToken,
            result.Value.AccessTokenExpiresOnUtc
        });
    }
    [HttpPost("logIn")]
    public async Task<IActionResult> LogIn([FromBody] LogInRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _authService.LogInAsync(request, cancellationToken);
        if (result.IsFailure)
        {
            var errorResponse = new
            {
                code = result.Error.Code,
                en = result.Error.en
            };
            return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
        }
        SetRefreshTokenInCookie(result.Value.RefreshToken, result.Value.RefreshTokenExpiresOnUtc);

        return Ok(new
        {
            result.Value.UserId,
            result.Value.UserName,
            result.Value.FirstName,
            result.Value.LastName,
            result.Value.Email,
            result.Value.AccessToken,
            result.Value.AccessTokenExpiresOnUtc
        });

    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies["refreshToken"];

        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized();

        var result = await _authService.RefreshTokenAsync
            (new RefreshTokenRequestDto {RefreshToken = refreshToken}, cancellationToken);

        if (result.IsFailure)
        {
            var errorResponse = new
            {
                code = result.Error.Code,
                en = result.Error.en
            };

            return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
        }
        SetRefreshTokenInCookie(result.Value.RefreshToken, result.Value.RefreshTokenExpiresOnUtc);

        return Ok(new
        {
            accessToken = result.Value.AccessToken,
            accessTokenExpiresOnUtc = result.Value.AccessTokenExpiresOnUtc
        });
    }
    [HttpPost("logOut")]
    public async Task<IActionResult> LogOut(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies["refreshToken"];
        var result = await _authService.LogOutAsync(refreshToken, cancellationToken);
        if (result.IsFailure)
        {
            var errorResponse = new
            {
                code = result.Error.Code,
                en = result.Error.en
            };
            return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
        }
        Response.Cookies.Delete("refreshToken");
        return Ok(new { message = "Logged out successfully" });
    }

  
    private void SetRefreshTokenInCookie(string token, DateTime expiry)
    {
        Response.Cookies.Append("refreshToken", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = expiry,
            IsEssential = true
        });
    }
 
}