using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Entities.Users;
using Questro.Infrastructure.Data;
using Questro.Service.Abstractions.Auth;
using Questro.Shared.Contracts.Auth;
using Questro.Shared.Contracts.OTP;

using Questro.Shared.ErrorHandle.Users;
using Questro.Shared.Options.Jwt;
using Questro.Shared.Result;
using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Questro.Service.Services.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _SignInManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly JwtOptions _jwtOptions;
    private readonly IValidator<RegisterRequestDto> _validator;
    private readonly IOTPService _otpService;


    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<ApplicationRole> roleManager,
        ApplicationDbContext dbContext,
        IOptions<JwtOptions> jwtOptions,
        IValidator<RegisterRequestDto> validator,
        IOTPService OTPService
        )
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _dbContext = dbContext;
        _jwtOptions = jwtOptions.Value;
        _validator = validator;
        _SignInManager = signInManager;
        _otpService = OTPService;
    }

    public async Task<Result<RegisterResponseDto>> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var validationResult = await _validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return Result.Failure<RegisterResponseDto>
                (UserError.InvalidRegistrationData, validationResult.Errors.Select(e => e.ErrorMessage).ToList());

        if (!string.Equals(request.Password, request.ConfirmPassword, StringComparison.Ordinal))
            return Result.Failure<RegisterResponseDto>(UserError.PasswordsDoNotMatch);

        var email = request.Email.Trim().ToLowerInvariant();
        var userName = request.UserName.Trim();

        var existingByEmail = await _userManager.FindByEmailAsync(email);
        if (existingByEmail is not null)
            return Result.Failure<RegisterResponseDto>(UserError.EmailAlreadyExists);

        var existingByUserName = await _userManager.FindByNameAsync(userName);
        if (existingByUserName is not null)
            return Result.Failure<RegisterResponseDto>(UserError.UserNameAlreadyExists);
        await _otpService.SendOTPAsync(
                        new SendOtpRequestDto(request.Email),
                         cancellationToken);
        // Create temporary user data for response (without creating account in DB)
        var tempUser = new
        {
            UserId = 0L, // Will be set after user is created on OTP verification
            UserName = userName,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email
        };

        

        // Return empty tokens since user hasn't completed registration yet
        return Result.Success(new RegisterResponseDto(
            tempUser.UserId,
            tempUser.UserName,
            tempUser.FirstName,
            tempUser.LastName,
            tempUser.Email,
            string.Empty, // AccessToken will be provided after OTP verification
            string.Empty, // RefreshToken will be provided after OTP verification
            DateTime.UtcNow,
            DateTime.UtcNow));   
    }
    public async Task<Result<LogInResponseDto>> LogInAsync(LogInRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            return Result.Failure<LogInResponseDto>(UserError.InvalidLogInData);

        var input = request.Email.Trim();
        var user = await _userManager.FindByEmailAsync(input);
        if (user is null)
        {
            user = await _userManager.FindByNameAsync(input);
            if(user is null)
                return Result.Failure<LogInResponseDto>(UserError.InvalidCredentials);
        }
        // pass check 
        var isValid = await _SignInManager.CheckPasswordSignInAsync(user, request.Password , true);
        if (isValid.IsLockedOut)
            return Result.Failure<LogInResponseDto>(UserError.UserLockedOut);
        if (isValid.IsNotAllowed)
            return Result.Failure<LogInResponseDto>(UserError.LoginNotAllowed);
        if (!isValid.Succeeded)
            return Result.Failure<LogInResponseDto>(UserError.InvalidCredentials);
        // Create Accesss Tokens
        var (accessToken, accessTokenExpiresOnUtc) = await GenerateAccessTokenAsync(user);
        // revoke old tokens 
        var oldTokens = await _dbContext.RefreshTokens
                          .Where(x => x.UserId == user.Id && x.RevokedOnUtc == null)
                          .ToListAsync();

        foreach (var token in oldTokens)
        {
            token.RevokedOnUtc = DateTime.UtcNow;
        }
        var refreshTokenValue = GenerateRefreshToken();
        var refreshTokenExpiresOnUtc =
            DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenExpirationDays > 0
            ? _jwtOptions.RefreshTokenExpirationDays : 7);

        // Save Refresh Token in DB
        await _dbContext.RefreshTokens.AddAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            CreatedOnUtc = DateTime.UtcNow,
            ExpiresOnUtc = refreshTokenExpiresOnUtc
        }, cancellationToken);

        var saved = await _dbContext.SaveChangesAsync(cancellationToken);
        if (saved == 0)
            return Result.Failure<LogInResponseDto>(UserError.LogInFailed);
        return Result.Success(new LogInResponseDto(
             user.Id,
             user.UserName ?? string.Empty,
             user.FirstName ?? string.Empty,
             user.LastName ?? string.Empty,
             user.Email ?? string.Empty,
             accessToken,
             refreshTokenValue,
             accessTokenExpiresOnUtc,
             refreshTokenExpiresOnUtc));
    }

    public async Task<Result> LogOutAsync(string? refreshToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(refreshToken))
            return Result.Failure(UserError.InvalidRefreshToken);
        var token = await _dbContext.RefreshTokens
        .FirstOrDefaultAsync(x => x.Token == refreshToken, cancellationToken);
        if(token is null) 
            return Result.Failure(UserError.InvalidRefreshToken);

        token.RevokedOnUtc = DateTime.UtcNow;
        var done = await _dbContext.SaveChangesAsync(cancellationToken);
        if (done == 0 )
            return Result.Failure(UserError.LogoutFailed);
        return Result.Success();
    }
    public async Task<Result<RefreshTokenResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default)
    {
        var providedToken = request.RefreshToken?.Trim();
        if (string.IsNullOrWhiteSpace(providedToken))
            return Result.Failure<RefreshTokenResponseDto>(UserError.InvalidRefreshToken);

        var existingRefreshToken = await _dbContext.RefreshTokens
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Token == providedToken, cancellationToken);

        if (existingRefreshToken is null || existingRefreshToken.RevokedOnUtc is not null || existingRefreshToken.ExpiresOnUtc <= DateTime.UtcNow)
            return Result.Failure<RefreshTokenResponseDto>(UserError.InvalidRefreshToken);

        var user = existingRefreshToken.User;

        var (newAccessToken, accessTokenExpiresOnUtc) = await GenerateAccessTokenAsync(user);
        var newRefreshTokenValue = GenerateRefreshToken();
        var newRefreshTokenExpiresOnUtc = DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenExpirationDays > 0 ? _jwtOptions.RefreshTokenExpirationDays : 7);

        existingRefreshToken.RevokedOnUtc = DateTime.UtcNow;

        await _dbContext.RefreshTokens.AddAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = newRefreshTokenValue,
            CreatedOnUtc = DateTime.UtcNow,
            ExpiresOnUtc = newRefreshTokenExpiresOnUtc
        }, cancellationToken);

        var saved = await _dbContext.SaveChangesAsync(cancellationToken);
        if (saved == 0)
            return Result.Failure<RefreshTokenResponseDto>(UserError.RegistrationFailed);

        return Result.Success(new RefreshTokenResponseDto(
            newAccessToken,
            newRefreshTokenValue,
            accessTokenExpiresOnUtc,
            newRefreshTokenExpiresOnUtc));
    }
    public async Task<Result<LogInResponseDto>> VerifyOtpAndLoginAsync(VerifyOtpRequestDto request, CancellationToken cancellationToken = default)
    {
        var verifyResult = await _otpService.VerifyOTPAsync(request, cancellationToken);

        if (verifyResult.IsFailure)
            return Result.Failure<LogInResponseDto>(verifyResult.Error);

        var identityUser = new ApplicationUser
        {
            UserName = request.UserName,
            Email = request.Email,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Gender = request.Gender?.Trim(),
            BirthDate = request.BirthDate,
            Age = CalculateAge(request.BirthDate),
            JoinDate = DateTime.UtcNow,
            PrimaryInterest = UserInterest.Mixed,
            EmailConfirmed = false
        };

        var identityCreateResult = await _userManager.CreateAsync(identityUser, request.Password);
        if (!identityCreateResult.Succeeded)
            return Result.Failure<LogInResponseDto>(
             UserError.RegistrationFailed,
                    identityCreateResult.Errors.Select(e => e.Description).ToList()
                            );

        const string defaultRole = "User";
        if (!await _roleManager.RoleExistsAsync(defaultRole))
        {
            var roleResult = await _roleManager.CreateAsync(new ApplicationRole { Name = defaultRole });
            if (!roleResult.Succeeded)
                return Result.Failure<LogInResponseDto>
                    (UserError.RegistrationFailed, roleResult.Errors.Select(e => e.Description).ToList());
        }

        var addToRoleResult = await _userManager.AddToRoleAsync(identityUser, defaultRole);
        if (!addToRoleResult.Succeeded)
            return Result.Failure<LogInResponseDto>(
                UserError.RegistrationFailed, addToRoleResult.Errors.Select(e => e.Description).ToList());

        // Create Accesss Tokens
        var (accessToken, accessTokenExpiresOnUtc) = await GenerateAccessTokenAsync(identityUser);
        // revoke old tokens 
        var oldTokens = await _dbContext.RefreshTokens
                          .Where(x => x.UserId == identityUser.Id && x.RevokedOnUtc == null)
                          .ToListAsync();

        foreach (var token in oldTokens)
        {
            token.RevokedOnUtc = DateTime.UtcNow;
        }
        var refreshTokenValue = GenerateRefreshToken();
        var refreshTokenExpiresOnUtc =
            DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenExpirationDays > 0
            ? _jwtOptions.RefreshTokenExpirationDays : 7);

        // Save Refresh Token in DB
        await _dbContext.RefreshTokens.AddAsync(new RefreshToken
        {
            UserId = identityUser.Id,
            Token = refreshTokenValue,
            CreatedOnUtc = DateTime.UtcNow,
            ExpiresOnUtc = refreshTokenExpiresOnUtc
        }, cancellationToken);

        var saved = await _dbContext.SaveChangesAsync(cancellationToken);
        if (saved == 0)
            return Result.Failure<LogInResponseDto>(UserError.LogInFailed);
        return Result.Success(new LogInResponseDto(
             identityUser.Id,
             identityUser.UserName ?? string.Empty,
             identityUser.FirstName ?? string.Empty,
             identityUser.LastName ?? string.Empty,
             identityUser.Email ?? string.Empty,
             accessToken,
             refreshTokenValue,
             accessTokenExpiresOnUtc,
             refreshTokenExpiresOnUtc));
    }

    
    private async Task<(string Token, DateTime ExpiresOnUtc)> GenerateAccessTokenAsync(ApplicationUser user)
    {
        var key = _jwtOptions.Key;
        var issuer = _jwtOptions.Issuer;
        var audience = _jwtOptions.Audience;
        var expirationMinutes = _jwtOptions.AccessTokenExpirationMinutes > 0 ? _jwtOptions.AccessTokenExpirationMinutes : 60;

        if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(audience))
            throw new InvalidOperationException("JWT settings are missing.");

        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.UserName ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var expiresOnUtc = DateTime.UtcNow.AddMinutes(expirationMinutes);
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expiresOnUtc,
            signingCredentials: credentials);

        var tokenValue = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
        return (tokenValue, expiresOnUtc);
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(randomBytes);
    }

    private static int CalculateAge(DateTime birthDate)
    {
        var today = DateTime.UtcNow.Date;
        var age = today.Year - birthDate.Year;

        if (birthDate.Date > today.AddYears(-age))
        {
            age--;
        }

        return age < 0 ? 0 : age;
    }

    
}