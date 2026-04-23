using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Auth;
using Questro.Shared.Contracts.OTP;

namespace Questro.API.Controllers.Auth
{
    [Route("api/[controller]")]
    [ApiController]
    public class OTPController : ControllerBase
    {
        private readonly IOTPService _otpService;
        public OTPController(IOTPService OTPService)
        {
            _otpService = OTPService;
        }
        [HttpPost("Resend-OTP")]
        public async Task<IActionResult> ResendOtp(SendOtpRequestDto request, CancellationToken cancellationToken)
        {
            var result = await _otpService.ResendOTPAsync(request, cancellationToken);
            return result.IsSuccess ? Ok(new {Message = "OTP sent to your email" }) : BadRequest(result.Error);
        }
    }
}
