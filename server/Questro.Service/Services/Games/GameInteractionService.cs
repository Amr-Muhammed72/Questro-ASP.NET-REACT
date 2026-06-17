using Microsoft.AspNetCore.Identity;
using Questro.Core.Entities.Games;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Specifications.Games;
using Questro.Infrastructure.Abstractions;
using Questro.Service.Abstractions.Games;
using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Games;
using Questro.Shared.ErrorHandle.Games;
using Questro.Shared.Result;

namespace Questro.Service.Services.Games;

public sealed class GameInteractionService : IGameInteractionService
{
    private readonly IGenericRepository<Game> _gameRepository;
    private readonly IGenericRepository<UserGameLike> _userGameLikeRepository;
    private readonly IGenericRepository<UserGameRate> _userGameRateRepository;
    private readonly IGenericRepository<UserGameReview> _userGameReviewRepository;
    private readonly IGenericRepository<UserGameWishlist> _userGameWishlistRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IGameSyncService _gameSyncService;

    public GameInteractionService(
        IGenericRepository<Game> gameRepository,
        IGenericRepository<UserGameLike> userGameLikeRepository,
        IGenericRepository<UserGameRate> userGameRateRepository,
        IGenericRepository<UserGameReview> userGameReviewRepository,
        IGenericRepository<UserGameWishlist> userGameWishlistRepository,
        UserManager<ApplicationUser> userManager,
        IUnitOfWork unitOfWork,
        IGameSyncService gameSyncService)
    {
        _gameRepository = gameRepository;
        _userGameLikeRepository = userGameLikeRepository;
        _userGameRateRepository = userGameRateRepository;
        _userGameReviewRepository = userGameReviewRepository;
        _userGameWishlistRepository = userGameWishlistRepository;
        _userManager = userManager;
        _unitOfWork = unitOfWork;
        _gameSyncService = gameSyncService;
    }

    public async Task<Result<GameInteractionStatusDto>> ToggleLikeAsync(int rawgId, long userId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<GameInteractionStatusDto>(GameError.UnauthorizedInteraction);
        }

        if (rawgId <= 0)
        {
            return Result.Failure<GameInteractionStatusDto>(GameError.InvalidRawgId);
        }

        var ensureLocalGameResult = await EnsureLocalGameAsync(rawgId, cancellationToken);
        if (ensureLocalGameResult.IsFailure)
        {
            return Result.Failure<GameInteractionStatusDto>(ensureLocalGameResult.Error, ensureLocalGameResult.Details);
        }

        var game = ensureLocalGameResult.Value;

        var existingLike = await _userGameLikeRepository.GetEntityWithSpecAsync(
            new UserGameLikeByUserAndGameSpecification(userId, game.GameId),
            cancellationToken);

        if (existingLike is null)
        {
            await _userGameLikeRepository.AddAsync(new UserGameLike
            {
                UserId = userId,
                GameId = game.GameId,
                Timestamp = DateTime.UtcNow
            }, cancellationToken);
        }
        else
        {
            _userGameLikeRepository.Remove(existingLike);
        }

        await _unitOfWork.CompleteAsync(cancellationToken);
        var status = await BuildInteractionStatusAsync(game, userId, cancellationToken);

        return Result.Success(status);
    }

    public async Task<Result<GameInteractionStatusDto>> SetRatingAsync(int rawgId, long userId, int stars, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<GameInteractionStatusDto>(GameError.UnauthorizedInteraction);
        }

        if (rawgId <= 0)
        {
            return Result.Failure<GameInteractionStatusDto>(GameError.InvalidRawgId);
        }

        if (stars < 1 || stars > 5)
        {
            return Result.Failure<GameInteractionStatusDto>(GameError.InvalidRating);
        }

        var ensureLocalGameResult = await EnsureLocalGameAsync(rawgId, cancellationToken);
        if (ensureLocalGameResult.IsFailure)
        {
            return Result.Failure<GameInteractionStatusDto>(ensureLocalGameResult.Error, ensureLocalGameResult.Details);
        }

        var game = ensureLocalGameResult.Value;

        var existingRate = await _userGameRateRepository.GetEntityWithSpecAsync(
            new UserGameRateByUserAndGameSpecification(userId, game.GameId),
            cancellationToken);

        if (existingRate is null)
        {
            await _userGameRateRepository.AddAsync(new UserGameRate
            {
                UserId = userId,
                GameId = game.GameId,
                Stars = stars,
                Timestamp = DateTime.UtcNow
            }, cancellationToken);
        }
        else
        {
            existingRate.Stars = stars;
            existingRate.Timestamp = DateTime.UtcNow;
            _userGameRateRepository.Update(existingRate);
        }

        await EnsureWishlistCleanupAsync(userId, game.GameId, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);
       
        var status = await BuildInteractionStatusAsync(game, userId, cancellationToken);

        return Result.Success(status);
    }

    public async Task<Result<GameInteractionStatusDto>> ToggleWishlistAsync(int rawgId, long userId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<GameInteractionStatusDto>(GameError.UnauthorizedInteraction);
        }

        if (rawgId <= 0)
        {
            return Result.Failure<GameInteractionStatusDto>(GameError.InvalidRawgId);
        }

        var ensureLocalGameResult = await EnsureLocalGameAsync(rawgId, cancellationToken);
        if (ensureLocalGameResult.IsFailure)
        {
            return Result.Failure<GameInteractionStatusDto>(ensureLocalGameResult.Error, ensureLocalGameResult.Details);
        }

        var game = ensureLocalGameResult.Value;

        var existingWishlist = await _userGameWishlistRepository.GetEntityWithSpecAsync(
            new UserGameWishlistByUserAndGameSpecification(userId, game.GameId),
            cancellationToken);

        if (existingWishlist is null)
        {
            await _userGameWishlistRepository.AddAsync(new UserGameWishlist
            {
                UserId = userId,
                GameId = game.GameId,
                Timestamp = DateTime.UtcNow
            }, cancellationToken);
        }
        else
        {
            _userGameWishlistRepository.Remove(existingWishlist);
        }

        await _unitOfWork.CompleteAsync(cancellationToken);
        var status = await BuildInteractionStatusAsync(game, userId, cancellationToken);

        return Result.Success(status);
    }

    public async Task<Result<PagedResponse<GameReviewDto>>> GetGameReviewsAsync(
        int rawgId,
        int pageIndex = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (rawgId <= 0)
        {
            return Result.Failure<PagedResponse<GameReviewDto>>(GameError.InvalidRawgId);
        }

        var safePageIndex = pageIndex < 1 ? 1 : pageIndex;
        var safePageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 50);
        var game = await _gameRepository.GetEntityWithSpecAsync(new GameDetailsByRawgIdSpecification(rawgId), cancellationToken);

        if (game is null)
        {
            return Result.Success(new PagedResponse<GameReviewDto>
            {
                Data = Enumerable.Empty<GameReviewDto>(),
                PageNumber = safePageIndex,
                PageSize = safePageSize,
                TotalCount = 0,
                TotalPages = 0
            });
        }

        var reviews = await _userGameReviewRepository.ListAsync(
            new UserGameReviewsByGameIdSpecification(game.GameId, safePageIndex, safePageSize),
            cancellationToken);

        var totalCount = await _userGameReviewRepository.CountAsync(
            new UserGameReviewsCountByGameIdSpecification(game.GameId),
            cancellationToken);

        var mapped = reviews
            .Select(x => new GameReviewDto
            {
                ReviewId = x.Id,
                GameId = x.GameId,
                UserId = x.UserId,
                Content = x.Body,
                CreatedAt = x.Timestamp,
                UpdatedAt = x.Timestamp,
                UserName = x.User?.UserName,
                UserProfilePictureUrl = x.User?.ProfilePic
            }).ToList();

        return Result.Success(new PagedResponse<GameReviewDto>
        {
            Data = mapped,
            PageNumber = safePageIndex,
            PageSize = safePageSize,
            TotalCount = totalCount,
            TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)safePageSize)
        });
    }

    public async Task<Result<GameReviewDto>> AddReviewAsync(int rawgId, long userId, string body, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<GameReviewDto>(GameError.UnauthorizedInteraction);
        }

        if (rawgId <= 0)
        {
            return Result.Failure<GameReviewDto>(GameError.InvalidRawgId);
        }

        var bodyValidation = ValidateReviewBody(body);
        if (bodyValidation.IsFailure)
        {
            return Result.Failure<GameReviewDto>(bodyValidation.Error, bodyValidation.Details);
        }

        var ensureLocalGameResult = await EnsureLocalGameAsync(rawgId, cancellationToken);
        if (ensureLocalGameResult.IsFailure)
        {
            return Result.Failure<GameReviewDto>(ensureLocalGameResult.Error, ensureLocalGameResult.Details);
        }

        var game = ensureLocalGameResult.Value;
        var existingReview = await _userGameReviewRepository.GetEntityWithSpecAsync(
            new UserGameReviewByUserAndGameSpecification(userId, game.GameId),
            cancellationToken);

        if (existingReview is not null)
        {
            return Result.Failure<GameReviewDto>(GameError.ReviewAlreadyExists);
        }

        var review = new UserGameReview
        {
            UserId = userId,
            GameId = game.GameId,
            Body = body.Trim(),
            Timestamp = DateTime.UtcNow
        };

        await _userGameReviewRepository.AddAsync(review, cancellationToken);
        await EnsureWishlistCleanupAsync(userId, game.GameId, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);
       

        var user = await _userManager.FindByIdAsync(userId.ToString());
        return Result.Success(new GameReviewDto
        {
            ReviewId = review.Id,
            GameId = review.GameId,
            UserId = review.UserId,
            UserName = user?.UserName,
            UserProfilePictureUrl = user?.ProfilePic,
            Content = review.Body,
            CreatedAt = review.Timestamp,
            UpdatedAt = review.Timestamp
        });
    }

    public async Task<Result<GameReviewDto>> UpdateReviewAsync(int rawgId, long userId, string body, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<GameReviewDto>(GameError.UnauthorizedInteraction);
        }

        if (rawgId <= 0)
        {
            return Result.Failure<GameReviewDto>(GameError.InvalidRawgId);
        }

        var bodyValidation = ValidateReviewBody(body);
        if (bodyValidation.IsFailure)
        {
            return Result.Failure<GameReviewDto>(bodyValidation.Error, bodyValidation.Details);
        }

        var ensureLocalGameResult = await EnsureLocalGameAsync(rawgId, cancellationToken);
        if (ensureLocalGameResult.IsFailure)
        {
            return Result.Failure<GameReviewDto>(ensureLocalGameResult.Error, ensureLocalGameResult.Details);
        }

        var game = ensureLocalGameResult.Value;
        var existingReview = await _userGameReviewRepository.GetEntityWithSpecAsync(
            new UserGameReviewByUserAndGameSpecification(userId, game.GameId),
            cancellationToken);

        if (existingReview is null)
        {
            return Result.Failure<GameReviewDto>(GameError.ReviewNotFound);
        }

        existingReview.Body = body.Trim();
        existingReview.Timestamp = DateTime.UtcNow;
        _userGameReviewRepository.Update(existingReview);

        await EnsureWishlistCleanupAsync(userId, game.GameId, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);
        

        var user = await _userManager.FindByIdAsync(userId.ToString());
        return Result.Success(new GameReviewDto
        {
            ReviewId = existingReview.Id,
            GameId = existingReview.GameId,
            UserId = existingReview.UserId,
            UserName = user?.UserName,
            UserProfilePictureUrl = user?.ProfilePic,
            Content = existingReview.Body,
            CreatedAt = existingReview.Timestamp,
            UpdatedAt = existingReview.Timestamp
        });
    }

    public async Task<Result<bool>> DeleteReviewAsync(int rawgId, long userId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<bool>(GameError.UnauthorizedInteraction);
        }

        if (rawgId <= 0)
        {
            return Result.Failure<bool>(GameError.InvalidRawgId);
        }

        var game = await _gameRepository.GetEntityWithSpecAsync(new GameDetailsByRawgIdSpecification(rawgId), cancellationToken);
        if (game is null)
        {
            return Result.Failure<bool>(GameError.NotFound);
        }

        var existingReview = await _userGameReviewRepository.GetEntityWithSpecAsync(
            new UserGameReviewByUserAndGameSpecification(userId, game.GameId),
            cancellationToken);

        if (existingReview is null)
        {
            return Result.Failure<bool>(GameError.ReviewNotFound);
        }

        _userGameReviewRepository.Remove(existingReview);
        await _unitOfWork.CompleteAsync(cancellationToken);
      

        return Result.Success(true);
    }

    private async Task<Result<Game>> EnsureLocalGameAsync(int rawgId, CancellationToken cancellationToken)
    {
        var localGame = await _gameRepository.GetEntityWithSpecAsync(new GameDetailsByRawgIdSpecification(rawgId), cancellationToken);
        if (localGame is not null)
        {
            return Result.Success(localGame);
        }

        var syncResult = await _gameSyncService.FetchAndSaveGameByRawgIdAsync(rawgId, cancellationToken);
        if (syncResult.IsFailure)
        {
            return Result.Failure<Game>(syncResult.Error, syncResult.Details);
        }

        localGame = await _gameRepository.GetEntityWithSpecAsync(new GameDetailsByRawgIdSpecification(rawgId), cancellationToken);
        return localGame is null
            ? Result.Failure<Game>(GameError.NotFound)
            : Result.Success(localGame);
    }

    private async Task EnsureWishlistCleanupAsync(long userId, int gameId, CancellationToken cancellationToken)
    {
        var existingWishlist = await _userGameWishlistRepository.GetEntityWithSpecAsync(
            new UserGameWishlistByUserAndGameSpecification(userId, gameId),
            cancellationToken);

        if (existingWishlist is not null)
        {
            _userGameWishlistRepository.Remove(existingWishlist);
        }
    }

    private Result ValidateReviewBody(string? body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return Result.Failure(GameError.ReviewBodyInvalid);
        }

        if (body.Trim().Length > 4000)
        {
            return Result.Failure(GameError.ReviewBodyTooLong);
        }

        return Result.Success();
    }

    private async Task<string?> GetUserNameAsync(long userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        return user?.UserName;
    }

  
    private async Task<GameInteractionStatusDto> BuildInteractionStatusAsync(Game game, long userId, CancellationToken cancellationToken)
    {
        GameUserStatusDto? userStatus = await BuildUserStatusAsync(game.GameId, userId, cancellationToken);
        return new GameInteractionStatusDto
        {
            GameId = game.GameId,
            RawgId = game.RAWG_Id,
            IsLiked = userStatus.IsLiked,
            IsInWishlist = userStatus.IsInWishlist,
            UserRating = userStatus.UserRating
        };
    }

    private async Task<GameUserStatusDto> BuildUserStatusAsync(int gameId, long userId, CancellationToken cancellationToken)
    {
        var like = await _userGameLikeRepository.GetEntityWithSpecAsync(
            new UserGameLikeByUserAndGameSpecification(userId, gameId),
            cancellationToken);

        var rate = await _userGameRateRepository.GetEntityWithSpecAsync(
            new UserGameRateByUserAndGameSpecification(userId, gameId),
            cancellationToken);

        var wishlist = await _userGameWishlistRepository.GetEntityWithSpecAsync(
            new UserGameWishlistByUserAndGameSpecification(userId, gameId),
            cancellationToken);

        return new GameUserStatusDto(
            like is not null,
            wishlist is not null,
            rate?.Stars);
    }
}
