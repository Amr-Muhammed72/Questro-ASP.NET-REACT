using Hangfire;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Questro.Core.Entities.UserManagement;
using Questro.Service.Abstractions.Auth;
using Questro.Service.Abstractions.Email;
using Questro.Shared.Contracts.OTP;
using Questro.Shared.ErrorHandle.OTP;
using Questro.Shared.ErrorHandle.Users;
using Questro.Shared.Result;
using System.Security.Cryptography;
using System.Text;


namespace Questro.Service.Services.Auth
{
    public class OTPService : IOTPService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMemoryCache _cache;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IEmailTemplateService _emailTemplateService;
        
        public OTPService(UserManager<ApplicationUser> userManager, IMemoryCache cache, IBackgroundJobClient backgroundJobClient,
            IEmailTemplateService emailTemplateService )
        {
            _userManager = userManager;
            _cache = cache;
            _backgroundJobClient = backgroundJobClient;
            _emailTemplateService = emailTemplateService;
            
        }
       
        public  Task<Result> SendOTPAsync(SendOtpRequestDto request, CancellationToken cancellationToken = default)
        {
            
            var email = request.Email?.Trim().ToLowerInvariant();
            if(string.IsNullOrEmpty(email))
                return Task.FromResult(Result.Failure(OTPError.UserNotFound)); var key = $"OTP:{email}";
            if (_cache.TryGetValue(key, out var value))
                return Task.FromResult(Result.Failure(OTPError.OtpAlreadySent));
            var otp = GenerateOtp();
            _cache.Set(key,value: HashOtp(otp),TimeSpan.FromMinutes(3));
            var subject = "Your OTP Verification Code";
            var body = _emailTemplateService.GetOtpEmailBody(otp, expiryMinutes: 3);

            BackgroundJob.Enqueue<IEmailService>(s =>
                     s.SendEmailAsync(email, subject, body));
            return Task.FromResult(Result.Success());
        }

        public  Task<Result> VerifyOTPAsync(VerifyOtpRequestDto request, CancellationToken cancellationToken = default)
        {
            var email = request.Email.Trim().ToLowerInvariant();

            var cacheKey = $"OTP:{email}";

            if (!_cache.TryGetValue(cacheKey, out string? storedOtp))
                return Task.FromResult(Result.Failure(OTPError.InvalidOtp));

            if (storedOtp != HashOtp(request.Otp))
                return Task.FromResult(Result.Failure(OTPError.InvalidOtp));
          
            _cache.Remove(cacheKey);
      
            return Task.FromResult(Result.Success());
        }
        public async Task<Result> ResendOTPAsync(SendOtpRequestDto request, CancellationToken cancellationToken = default)
        {
            var email = request.Email?.Trim().ToLowerInvariant();

            var user = await _userManager.FindByEmailAsync(email);
            if (user is null)
                return Result.Failure(OTPError.UserNotFound);

            var key = $"OTP:{email}";

           
            _cache.Remove(key);

            var otp = GenerateOtp();
            _cache.Set(key, HashOtp(otp), TimeSpan.FromMinutes(3));

            var subject = "Your New OTP Verification Code";
            var body = _emailTemplateService.GetOtpEmailBody(otp, expiryMinutes: 3);

            BackgroundJob.Enqueue<IEmailService>(s =>
                s.SendEmailAsync(email, subject, body));

            return Result.Success();
        }
        private static string GenerateOtp()
        {
            return RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        }
        private static string HashOtp(string otp)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(otp));
            return Convert.ToBase64String(bytes);
        }
    }
}
