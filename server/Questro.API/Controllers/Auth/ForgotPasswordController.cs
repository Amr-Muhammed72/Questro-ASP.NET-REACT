using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Auth;
using Questro.Shared.Contracts.Auth;

namespace Questro.API.Controllers.Auth
{
    [Route("api/[controller]")]
    [ApiController]
    public class ForgotPasswordController : ControllerBase
    {
        private readonly IForgotPasswordService _forgotPasswordService;

        public ForgotPasswordController(IForgotPasswordService forgotPasswordService)
            => _forgotPasswordService = forgotPasswordService;

       
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(
            ForgotPasswordRequestDto request, CancellationToken cancellationToken)
        {
            var result = await _forgotPasswordService.SendResetOtpAsync(request, cancellationToken);
            return result.IsSuccess
                ? Ok(new { message = "OTP sent to your email." })
                : BadRequest(result.Error);
        }

        
        [HttpPost("verify-reset-otp")]
        public async Task<IActionResult> VerifyResetOtp(
            VerifyResetOtpRequestDto request, CancellationToken cancellationToken)
        {
            var result = await _forgotPasswordService.VerifyResetOtpAsync(request, cancellationToken);
            return result.IsSuccess
                ? Ok(new { resetToken = result.Value })
                : BadRequest(result.Error);
        }

        
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(
            ResetPasswordRequestDto request, CancellationToken cancellationToken)
        {
            var result = await _forgotPasswordService.ResetPasswordAsync(request, cancellationToken);
            return result.IsSuccess
                ? Ok(new { message = "Password reset successfully." })
                : BadRequest(result.Error);
        }
    }
}
