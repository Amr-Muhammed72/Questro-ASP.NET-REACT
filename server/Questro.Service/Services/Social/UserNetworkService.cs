using Microsoft.AspNetCore.Identity;
using Questro.Core.Entities.Social;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Specifications.Social;
using Questro.Infrastructure.Abstractions;
using Questro.Service.Abstractions.Social;
using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Social;
using Questro.Shared.ErrorHandle.Social;
using Questro.Shared.Result;

namespace Questro.Service.Services.Social;

public class UserNetworkService : IUserNetworkService
{
    private readonly IGenericRepository<UserFollow> _followRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;

    public UserNetworkService(
        IGenericRepository<UserFollow> followRepo,
        IUnitOfWork unitOfWork,
        UserManager<ApplicationUser> userManager)
    {
        _followRepo = followRepo;
        _unitOfWork = unitOfWork;
        _userManager = userManager;
    }

    public async Task<Result<bool>> FollowAsync(long followerId, long followeeId, CancellationToken cancellationToken = default)
    {
        if (followerId == followeeId)
            return Result.Failure<bool>(SocialError.CannotFollowSelf);

        var followee = await _userManager.FindByIdAsync(followeeId.ToString());
        if (followee is null)
            return Result.Failure<bool>(SocialError.UserNotFound);

        var existingFollow = await _followRepo.GetEntityWithSpecAsync(
            new FollowExistsSpecification(followerId, followeeId), cancellationToken);

        if (existingFollow is not null)
            return Result.Failure<bool>(SocialError.AlreadyFollowing);

        var follow = new UserFollow
        {
            FollowerId = followerId,
            FolloweeId = followeeId,
            Timestamp = DateTime.UtcNow
        };

        await _followRepo.AddAsync(follow, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);

        return Result.Success(true);
    }

    public async Task<Result<bool>> UnfollowAsync(long followerId, long followeeId, CancellationToken cancellationToken = default)
    {
        if (followerId == followeeId)
            return Result.Failure<bool>(SocialError.CannotFollowSelf);

        var existingFollow = await _followRepo.GetEntityWithSpecAsync(
            new FollowExistsSpecification(followerId, followeeId), cancellationToken);

        if (existingFollow is null)
            return Result.Failure<bool>(SocialError.NotFollowing);

        _followRepo.Remove(existingFollow);
        await _unitOfWork.CompleteAsync(cancellationToken);

        return Result.Success(true);
    }

    public async Task<Result<PagedResponse<UserFollowDto>>> GetFollowersAsync(
        long userId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var spec = new FollowersByUserSpecification(userId, pageIndex, pageSize);
        var countSpec = new FollowersCountByUserSpecification(userId);

        var items = await _followRepo.ListAsync(spec, cancellationToken);
        var totalCount = await _followRepo.CountAsync(countSpec, cancellationToken);

        var dtos = items.Select(x => new UserFollowDto
        {
            UserId = x.Follower.Id,
            UserName = x.Follower.UserName ?? string.Empty,
            ProfilePicUrl = x.Follower.ProfilePic,
            FollowedAt = x.Timestamp
        }).ToList();

        var safePageSize = pageSize < 1 ? 20 : pageSize;
        var response = new PagedResponse<UserFollowDto>
        {
            Data = dtos,
            PageNumber = pageIndex,
            PageSize = safePageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)safePageSize)
        };

        return Result.Success(response);
    }

    public async Task<Result<PagedResponse<UserFollowDto>>> GetFollowingAsync(
        long userId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var spec = new FollowingByUserSpecification(userId, pageIndex, pageSize);
        var countSpec = new FollowingCountByUserSpecification(userId);

        var items = await _followRepo.ListAsync(spec, cancellationToken);
        var totalCount = await _followRepo.CountAsync(countSpec, cancellationToken);

        var dtos = items.Select(x => new UserFollowDto
        {
            UserId = x.Followee.Id,
            UserName = x.Followee.UserName ?? string.Empty,
            ProfilePicUrl = x.Followee.ProfilePic,
            FollowedAt = x.Timestamp
        }).ToList();

        var safePageSize = pageSize < 1 ? 20 : pageSize;
        var response = new PagedResponse<UserFollowDto>
        {
            Data = dtos,
            PageNumber = pageIndex,
            PageSize = safePageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)safePageSize)
        };

        return Result.Success(response);
    }

    public async Task<Result<FollowStatsDto>> GetFollowStatsAsync(long userId, long? currentUserId, CancellationToken cancellationToken = default)
    {
        var followersCount = await _followRepo.CountAsync(
            new FollowersCountByUserSpecification(userId),
            cancellationToken);
        var followingCount = await _followRepo.CountAsync(
            new FollowingCountByUserSpecification(userId),
            cancellationToken);

        UserFollow? follow = null;
        if (currentUserId.HasValue && currentUserId.Value != userId)
        {
            follow = await _followRepo.GetReadOnlyAsync(
                new FollowExistsSpecification(currentUserId.Value, userId),
                cancellationToken);
        }

        return Result.Success(new FollowStatsDto
        {
            FollowersCount = followersCount,
            FollowingCount = followingCount,
            IsFollowedByCurrentUser = follow is not null
        });
    }
}
