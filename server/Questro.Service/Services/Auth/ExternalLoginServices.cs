using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Entities.Users;
using Questro.Service.Abstractions.Auth;
using Questro.Shared.Contracts.Auth;
using Questro.Shared.ErrorHandle.Users;
using Questro.Shared.Result;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Questro.Service.Services.Auth
{
    public class ExternalLoginServices : IExternalLoginServices
    {
        private readonly IAuthService _authService;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;

        public ExternalLoginServices(
            IAuthService authService,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager)
        {
            _authService = authService;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task<Result<ExternalLoginResponse>> LoginWithGoogleAsync(ExternalLoginRequest request)
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
            if (string.IsNullOrWhiteSpace(clientId))
                return Result.Failure<ExternalLoginResponse>(UserError.ExternalLoginFailed);

            var idToken = request.IdToken;
            if (string.IsNullOrWhiteSpace(idToken))
                return Result.Failure<ExternalLoginResponse>(UserError.ExternalLoginFailed);

            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(
                    idToken,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { clientId }
                    });
            }
            catch (InvalidJwtException)
            {
                return Result.Failure<ExternalLoginResponse>(UserError.ExternalLoginFailed);
            }

            var googleId = payload.Subject;
            var email = payload.Email?.Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(googleId) || string.IsNullOrWhiteSpace(email) || !payload.EmailVerified)
                return Result.Failure<ExternalLoginResponse>(UserError.ExternalLoginEmailNotFound);

            var loginInfo = new UserLoginInfo("Google", googleId, "Google");
            var user = await _userManager.FindByLoginAsync(loginInfo.LoginProvider, loginInfo.ProviderKey);

            if (user is null)
            {
                user = await _userManager.FindByEmailAsync(email);

                if (user is null)
                {
                    var createResult = await CreateGoogleUserAsync(payload, email);
                    if (createResult.IsFailure)
                        return Result.Failure<ExternalLoginResponse>(createResult.Error, createResult.Details);

                    user = createResult.Value;
                }

                var addLoginResult = await _userManager.AddLoginAsync(user, loginInfo);
             
                if (!addLoginResult.Succeeded)
                    return Result.Failure<ExternalLoginResponse>(
                        UserError.ExternalLoginFailed,
                        addLoginResult.Errors.Select(e => e.Description).ToList());
            }

            var loginResult = await _authService.IssueLoginTokensAsync(user);
            if (loginResult.IsFailure)
                return Result.Failure<ExternalLoginResponse>(loginResult.Error, loginResult.Details);

            return Result.Success(MapExternalLoginResponse(user, loginResult.Value));
        }

       

        private async Task<Result<ApplicationUser>> CreateGoogleUserAsync(GoogleJsonWebSignature.Payload payload, string email)
        {
            var user = new ApplicationUser
            {
                UserName =null,
                Email = email,
                FirstName = payload.GivenName,
                LastName = payload.FamilyName ?? string.Empty,
                JoinDate = DateTime.UtcNow,
                PrimaryInterest = UserInterest.Mixed,
                IsProfileCompleted = false,
                EmailConfirmed = true
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
                return Result.Failure<ApplicationUser>(
                    UserError.RegistrationFailed,
                    createResult.Errors.Select(e => e.Description).ToList());

            var roleResult = await EnsureDefaultRoleAsync(user);
            if (!roleResult.Succeeded)
                return Result.Failure<ApplicationUser>(
                    UserError.RegistrationFailed,
                    roleResult.Errors.Select(e => e.Description).ToList());

            return Result.Success(user);
        }

        private async Task<IdentityResult> EnsureDefaultRoleAsync(ApplicationUser user)
        {
            const string defaultRole = "User";

            if (!await _roleManager.RoleExistsAsync(defaultRole))
            {
                var createRoleResult = await _roleManager.CreateAsync(new ApplicationRole { Name = defaultRole });
                if (!createRoleResult.Succeeded)
                    return createRoleResult;
            }

            if (await _userManager.IsInRoleAsync(user, defaultRole))
                return IdentityResult.Success;

            return await _userManager.AddToRoleAsync(user, defaultRole);
        }


        private static ExternalLoginResponse MapExternalLoginResponse(ApplicationUser user, LogInResponseDto loginResponse)
        {
            return new ExternalLoginResponse(
                user.IsProfileCompleted,
                loginResponse.UserId,
                loginResponse.UserName,
                loginResponse.FirstName,
                loginResponse.LastName,
                loginResponse.Email,
                loginResponse.AccessToken,
                loginResponse.RefreshToken,
                loginResponse.AccessTokenExpiresOnUtc,
                loginResponse.RefreshTokenExpiresOnUtc);
        }

        private sealed record GoogleTokenResponse(
            [property: JsonPropertyName("id_token")] string? IdToken);
    }
}
