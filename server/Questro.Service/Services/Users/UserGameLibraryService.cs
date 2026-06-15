using Microsoft.AspNetCore.Identity;
using Questro.Core.Entities.Games;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Specifications.Games;
using Questro.Infrastructure.Abstractions;
using Questro.Service.Abstractions.Users;
using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Users;
using Questro.Shared.ErrorHandle.Social;
using Questro.Shared.ErrorHandle.Users;
using Questro.Shared.Result;

namespace Questro.Service.Services.Users;

public class UserGameLibraryService : IUserGameLibraryService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IGenericRepository<UserGameWishlist> _wishlistRepo;
    private readonly IGenericRepository<UserGameLike> _likeRepo;
    private readonly IGenericRepository<UserGameRate> _rateRepo;

    public UserGameLibraryService(
        UserManager<ApplicationUser> userManager,
        IGenericRepository<UserGameWishlist> wishlistRepo,
        IGenericRepository<UserGameLike> likeRepo,
        IGenericRepository<UserGameRate> rateRepo)
    {
        _userManager = userManager;
        _wishlistRepo = wishlistRepo;
        _likeRepo = likeRepo;
        _rateRepo = rateRepo;
    }

    public async Task<Result<PagedResponse<UserLibraryGameItemDto>>> GetWishlistAsync(
        long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var privacyCheck = await CheckPrivacyAsync(targetUserId, requesterId);
        if (privacyCheck is not null) return privacyCheck;

        var spec = new UserGameWishlistByUserSpecification(targetUserId, pageIndex, pageSize);
        var countSpec = new UserGameWishlistCountByUserSpecification(targetUserId);

        var items = await _wishlistRepo.ListAsync(spec, cancellationToken);
        var totalCount = await _wishlistRepo.CountAsync(countSpec, cancellationToken);

        var dtos = items.Select(x => new UserLibraryGameItemDto
        {
            RawgId = x.Game.RAWG_Id ?? x.GameId,
            Name = x.Game.Title,
            BackgroundImage = x.Game.Poster_Url,
            Timestamp = x.Timestamp
        }).ToList();

        return Result.Success(BuildPagedResponse(dtos, pageIndex, pageSize, totalCount));
    }

    public async Task<Result<PagedResponse<UserLibraryGameItemDto>>> GetLikedAsync(
        long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var privacyCheck = await CheckPrivacyAsync(targetUserId, requesterId);
        if (privacyCheck is not null) return privacyCheck;

        var spec = new UserGameLikesByUserSpecification(targetUserId, pageIndex, pageSize);
        var countSpec = new UserGameLikesCountByUserSpecification(targetUserId);

        var items = await _likeRepo.ListAsync(spec, cancellationToken);
        var totalCount = await _likeRepo.CountAsync(countSpec, cancellationToken);

        var dtos = items.Select(x => new UserLibraryGameItemDto
        {
            RawgId = x.Game.RAWG_Id ?? x.GameId,
            Name = x.Game.Title,
            BackgroundImage = x.Game.Poster_Url,
            Timestamp = x.Timestamp
        }).ToList();

        return Result.Success(BuildPagedResponse(dtos, pageIndex, pageSize, totalCount));
    }

    public async Task<Result<PagedResponse<UserLibraryGameItemDto>>> GetRatedAsync(
        long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var privacyCheck = await CheckPrivacyAsync(targetUserId, requesterId);
        if (privacyCheck is not null) return privacyCheck;

        var spec = new UserGameRatesByUserSpecification(targetUserId, pageIndex, pageSize);
        var countSpec = new UserGameRatesCountByUserSpecification(targetUserId);

        var items = await _rateRepo.ListAsync(spec, cancellationToken);
        var totalCount = await _rateRepo.CountAsync(countSpec, cancellationToken);

        var dtos = items.Select(x => new UserLibraryGameItemDto
        {
            RawgId = x.Game.RAWG_Id ?? x.GameId,
            Name = x.Game.Title,
            BackgroundImage = x.Game.Poster_Url,
            Timestamp = x.Timestamp,
            Rating = x.Stars
        }).ToList();

        return Result.Success(BuildPagedResponse(dtos, pageIndex, pageSize, totalCount));
    }

    private async Task<Result<PagedResponse<UserLibraryGameItemDto>>?> CheckPrivacyAsync(long targetUserId, long? requesterId)
    {
        if (requesterId.HasValue && requesterId.Value == targetUserId)
            return null;

        var targetUser = await _userManager.FindByIdAsync(targetUserId.ToString());
        if (targetUser is null)
            return Result.Failure<PagedResponse<UserLibraryGameItemDto>>(UserError.UserNotFound);

        if (!targetUser.IsHistoryPublic)
        {
            // Parents can always view their child's library
            if (requesterId.HasValue && targetUser.ParentId == requesterId.Value)
                return null;

            return Result.Failure<PagedResponse<UserLibraryGameItemDto>>(SocialError.HistoryIsPrivate);
        }

        return null;
    }

    private static PagedResponse<UserLibraryGameItemDto> BuildPagedResponse(
        List<UserLibraryGameItemDto> data, int pageIndex, int pageSize, int totalCount)
    {
        var safePageSize = pageSize < 1 ? 20 : pageSize;
        return new PagedResponse<UserLibraryGameItemDto>
        {
            Data = data,
            PageNumber = pageIndex,
            PageSize = safePageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)safePageSize)
        };
    }
}
