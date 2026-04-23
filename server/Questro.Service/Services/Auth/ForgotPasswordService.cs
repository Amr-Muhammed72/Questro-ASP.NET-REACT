using Hangfire;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;
using Questro.Core.Entities.UserManagement;
using Questro.Service.Abstractions.Auth;
using Questro.Service.Abstractions.Email;
using Questro.Shared.Contracts.Auth;
using Questro.Shared.ErrorHandle.Passwordreset;
using Questro.Shared.Result;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Service.Services.Auth
{
    public class ForgotPasswordService : IForgotPasswordService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMemoryCache _cache;
        private readonly IEmailTemplateService _emailTemplateService;
        private const int OtpExpiryMinutes = 3;
        private const int TokenExpiryMinutes = 15;

        public ForgotPasswordService(
            UserManager<ApplicationUser> userManager,
            IMemoryCache cache,
            IEmailTemplateService emailTemplateService)
        {
            _userManager = userManager;
            _cache = cache;
            _emailTemplateService = emailTemplateService;
        }

        
        public async Task<Result> SendResetOtpAsync(
            ForgotPasswordRequestDto request, CancellationToken cancellationToken = default)
        {
            var email = request.Email?.Trim().ToLowerInvariant();

            var user = await _userManager.FindByEmailAsync(email);
            if (user is null)
                return Result.Failure(ForgotPasswordError.UserNotFound);

            var otpKey = $"RESET_OTP:{email}";
            _cache.Remove(otpKey);

            var otp = Random.Shared.Next(100000, 999999).ToString();
            _cache.Set(otpKey, HashOtp(otp), TimeSpan.FromMinutes(OtpExpiryMinutes));

            var subject = "Reset Your Password";
            var body = _emailTemplateService.GetOtpEmailBody(otp, OtpExpiryMinutes);

            BackgroundJob.Enqueue<IEmailService>(s =>
                s.SendEmailAsync(email, subject, body));

            return Result.Success();
        }

       
        public async Task<Result<string>> VerifyResetOtpAsync(
            VerifyResetOtpRequestDto request, CancellationToken cancellationToken = default)
        {
            var email = request.Email?.Trim().ToLowerInvariant();

            var user = await _userManager.FindByEmailAsync(email);
            if (user is null)
                return Result.Failure<string>(ForgotPasswordError.UserNotFound);

            var otpKey = $"RESET_OTP:{email}";
            if (!_cache.TryGetValue(otpKey, out string? storedHash))
                return Result.Failure<string>(ForgotPasswordError.InvalidOrExpiredOtp);

            if (storedHash != HashOtp(request.Otp))
                return Result.Failure<string>(ForgotPasswordError.InvalidOrExpiredOtp);

            
            _cache.Remove(otpKey);

            
            var resetToken = Guid.NewGuid().ToString("N");
            var tokenKey = $"RESET_TOKEN:{resetToken}";
            _cache.Set(tokenKey, email, TimeSpan.FromMinutes(TokenExpiryMinutes));

            return Result.Success(resetToken);
        }

      
        public async Task<Result> ResetPasswordAsync(
            ResetPasswordRequestDto request, CancellationToken cancellationToken = default)
        {
            if (request.NewPassword != request.ConfirmPassword)
                return Result.Failure(ForgotPasswordError.PasswordMismatch);

            var tokenKey = $"RESET_TOKEN:{request.ResetToken}";
            if (!_cache.TryGetValue(tokenKey, out string? email))
                return Result.Failure(ForgotPasswordError.InvalidResetToken);

            var user = await _userManager.FindByEmailAsync(email!);
            if (user is null)
                return Result.Failure(ForgotPasswordError.UserNotFound);

           
            _cache.Remove(tokenKey);

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

            if (!result.Succeeded)
                return Result.Failure(ForgotPasswordError.ResetFailed);

            return Result.Success();
        }

        private static string HashOtp(string otp)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(otp));
            return Convert.ToHexString(bytes);
        }
    }
}
