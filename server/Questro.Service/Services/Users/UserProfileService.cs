using Microsoft.AspNetCore.Identity;
using Questro.Core.Entities.Social;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Entities.Users;
using Questro.Core.Specifications.Social;
using Questro.Infrastructure.Abstractions;
using Questro.Service.Abstractions.Users;
using Questro.Shared.Contracts.Users;
using Questro.Shared.ErrorHandle.Social;
using Questro.Shared.ErrorHandle.Users;
using Questro.Shared.Result;

namespace Questro.Service.Services.Users;

public class UserProfileService : IUserProfileService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IGenericRepository<UserFollow> _followRepo;
    private readonly IFileService _fileService;

    public UserProfileService(
        UserManager<ApplicationUser> userManager,
        IGenericRepository<UserFollow> followRepo,
        IFileService fileService)
    {
        _userManager = userManager;
        _followRepo = followRepo;
        _fileService = fileService;
    }

    public async Task<Result<UserProfileDto>> GetProfileAsync(long targetUserId, long? currentUserId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(targetUserId.ToString());
        if (user is null)
            return Result.Failure<UserProfileDto>(UserError.UserNotFound);

        var followersCount = await _followRepo.CountAsync(new FollowersCountByUserSpecification(targetUserId), cancellationToken);
        var followingCount = await _followRepo.CountAsync(new FollowingCountByUserSpecification(targetUserId), cancellationToken);

        var isFollowed = false;
        if (currentUserId.HasValue && currentUserId.Value != targetUserId)
        {
            var existingFollow = await _followRepo.GetEntityWithSpecAsync(
                new FollowExistsSpecification(currentUserId.Value, targetUserId), cancellationToken);
            isFollowed = existingFollow is not null;
        }

        var dto = new UserProfileDto
        {
            UserId = user.Id,
            UserName = user.UserName ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Bio = user.Bio,
            Gender = user.Gender,
            ProfilePicUrl = user.ProfilePic,
            JoinDate = user.JoinDate,
            PrimaryInterest = user.PrimaryInterest.ToString(),
            IsHistoryPublic = user.IsHistoryPublic,
            FollowersCount = followersCount,
            FollowingCount = followingCount,
            IsFollowedByCurrentUser = isFollowed
        };

        return Result.Success(dto);
    }

    public async Task<Result<UserProfileDto>> UpdateProfileAsync(long userId, UpdateProfileRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result.Failure<UserProfileDto>(UserError.UserNotFound);

        if (request.FirstName is not null) user.FirstName = request.FirstName.Trim();
        if (request.LastName is not null) user.LastName = request.LastName.Trim();
        if (request.Bio is not null) user.Bio = request.Bio.Trim();
        if (request.Gender is not null) user.Gender = request.Gender.Trim();
        if (request.BirthDate.HasValue)
        {
            user.BirthDate = request.BirthDate.Value;
            user.Age = CalculateAge(request.BirthDate.Value);
        }
        if (request.PrimaryInterest.HasValue && Enum.IsDefined(typeof(UserInterest), request.PrimaryInterest.Value))
            user.PrimaryInterest = (UserInterest)request.PrimaryInterest.Value;
        if (request.IsHistoryPublic.HasValue) user.IsHistoryPublic = request.IsHistoryPublic.Value;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return Result.Failure<UserProfileDto>(UserError.RegistrationFailed,
                result.Errors.Select(e => e.Description).ToList());

        return await GetProfileAsync(userId, userId, cancellationToken);
    }

    public async Task<Result<string>> UpdateProfilePictureAsync(long userId, Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result.Failure<string>(UserError.UserNotFound);

        // Delete old profile picture if exists
        if (!string.IsNullOrEmpty(user.ProfilePic))
            _fileService.DeleteFile(user.ProfilePic);

        var relativePath = await _fileService.SaveFileAsync(fileStream, fileName, "profile-pictures", cancellationToken);
        user.ProfilePic = relativePath;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return Result.Failure<string>(UserError.RegistrationFailed,
                result.Errors.Select(e => e.Description).ToList());

        return Result.Success(relativePath);
    }

    private static int CalculateAge(DateTime birthDate)
    {
        var today = DateTime.UtcNow.Date;
        var age = today.Year - birthDate.Year;
        if (birthDate.Date > today.AddYears(-age)) age--;
        return age < 0 ? 0 : age;
    }
}
