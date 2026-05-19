using Microsoft.AspNetCore.Identity;
using Questro.Core.Entities.Movies;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Specifications.Movies;
using Questro.Infrastructure.Abstractions;
using Questro.Service.Abstractions.Users;
using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Users;
using Questro.Shared.ErrorHandle.Social;
using Questro.Shared.ErrorHandle.Users;
using Questro.Shared.Result;

namespace Questro.Service.Services.Users;

public class UserMovieLibraryService : IUserMovieLibraryService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IGenericRepository<UserMovieWatchlist> _watchlistRepo;
    private readonly IGenericRepository<UserMovieLike> _likeRepo;
    private readonly IGenericRepository<UserMovieRate> _rateRepo;
    private readonly IGenericRepository<UserMovieWatched> _watchedRepo;

    public UserMovieLibraryService(
        UserManager<ApplicationUser> userManager,
        IGenericRepository<UserMovieWatchlist> watchlistRepo,
        IGenericRepository<UserMovieLike> likeRepo,
        IGenericRepository<UserMovieRate> rateRepo,
        IGenericRepository<UserMovieWatched> watchedRepo)
    {
        _userManager = userManager;
        _watchlistRepo = watchlistRepo;
        _likeRepo = likeRepo;
        _rateRepo = rateRepo;
        _watchedRepo = watchedRepo;
    }

    public async Task<Result<PagedResponse<UserLibraryMovieItemDto>>> GetWatchlistAsync(
        long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var privacyCheck = await CheckPrivacyAsync(targetUserId, requesterId);
        if (privacyCheck is not null) return privacyCheck;

        var spec = new UserMovieWatchlistByUserSpecification(targetUserId, pageIndex, pageSize);
        var countSpec = new UserMovieWatchlistCountByUserSpecification(targetUserId);

        var items = await _watchlistRepo.ListAsync(spec, cancellationToken);
        var totalCount = await _watchlistRepo.CountAsync(countSpec, cancellationToken);

        var dtos = items.Select(x => new UserLibraryMovieItemDto
        {
            TmdbId = x.Movie.TMDB_Id ?? x.MovieId,
            Title = x.Movie.Title,
            PosterUrl = x.Movie.Poster_Url,
            Timestamp = x.Timestamp
        }).ToList();

        return Result.Success(BuildPagedResponse(dtos, pageIndex, pageSize, totalCount));
    }

    public async Task<Result<PagedResponse<UserLibraryMovieItemDto>>> GetLikedAsync(
        long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var privacyCheck = await CheckPrivacyAsync(targetUserId, requesterId);
        if (privacyCheck is not null) return privacyCheck;

        var spec = new UserMovieLikesByUserSpecification(targetUserId, pageIndex, pageSize);
        var countSpec = new UserMovieLikesCountByUserSpecification(targetUserId);

        var items = await _likeRepo.ListAsync(spec, cancellationToken);
        var totalCount = await _likeRepo.CountAsync(countSpec, cancellationToken);

        var dtos = items.Select(x => new UserLibraryMovieItemDto
        {
            TmdbId = x.Movie.TMDB_Id ?? x.MovieId,
            Title = x.Movie.Title,
            PosterUrl = x.Movie.Poster_Url,
            Timestamp = x.Timestamp
        }).ToList();

        return Result.Success(BuildPagedResponse(dtos, pageIndex, pageSize, totalCount));
    }

    public async Task<Result<PagedResponse<UserLibraryMovieItemDto>>> GetRatedAsync(
        long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var privacyCheck = await CheckPrivacyAsync(targetUserId, requesterId);
        if (privacyCheck is not null) return privacyCheck;

        var spec = new UserMovieRatesByUserSpecification(targetUserId, pageIndex, pageSize);
        var countSpec = new UserMovieRatesCountByUserSpecification(targetUserId);

        var items = await _rateRepo.ListAsync(spec, cancellationToken);
        var totalCount = await _rateRepo.CountAsync(countSpec, cancellationToken);

        var dtos = items.Select(x => new UserLibraryMovieItemDto
        {
            TmdbId = x.Movie.TMDB_Id ?? x.MovieId,
            Title = x.Movie.Title,
            PosterUrl = x.Movie.Poster_Url,
            Timestamp = x.Timestamp,
            Rating = x.Stars
        }).ToList();

        return Result.Success(BuildPagedResponse(dtos, pageIndex, pageSize, totalCount));
    }

    public async Task<Result<PagedResponse<UserLibraryMovieItemDto>>> GetWatchedAsync(
        long targetUserId, long? requesterId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var privacyCheck = await CheckPrivacyAsync(targetUserId, requesterId);
        if (privacyCheck is not null) return privacyCheck;

        var spec = new UserMovieWatchedByUserSpecification(targetUserId, pageIndex, pageSize);
        var countSpec = new UserMovieWatchedCountByUserSpecification(targetUserId);

        var items = await _watchedRepo.ListAsync(spec, cancellationToken);
        var totalCount = await _watchedRepo.CountAsync(countSpec, cancellationToken);

        var dtos = items.Select(x => new UserLibraryMovieItemDto
        {
            TmdbId = x.Movie.TMDB_Id ?? x.MovieId,
            Title = x.Movie.Title,
            PosterUrl = x.Movie.Poster_Url,
            Timestamp = x.Timestamp
        }).ToList();

        return Result.Success(BuildPagedResponse(dtos, pageIndex, pageSize, totalCount));
    }

    private async Task<Result<PagedResponse<UserLibraryMovieItemDto>>?> CheckPrivacyAsync(long targetUserId, long? requesterId)
    {
        if (requesterId.HasValue && requesterId.Value == targetUserId)
            return null; // Own profile, always allowed

        var targetUser = await _userManager.FindByIdAsync(targetUserId.ToString());
        if (targetUser is null)
            return Result.Failure<PagedResponse<UserLibraryMovieItemDto>>(UserError.UserNotFound);

        if (!targetUser.IsHistoryPublic)
            return Result.Failure<PagedResponse<UserLibraryMovieItemDto>>(SocialError.HistoryIsPrivate);

        return null;
    }

    private static PagedResponse<UserLibraryMovieItemDto> BuildPagedResponse(
        List<UserLibraryMovieItemDto> data, int pageIndex, int pageSize, int totalCount)
    {
        var safePageSize = pageSize < 1 ? 20 : pageSize;
        return new PagedResponse<UserLibraryMovieItemDto>
        {
            Data = data,
            PageNumber = pageIndex,
            PageSize = safePageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)safePageSize)
        };
    }
}
