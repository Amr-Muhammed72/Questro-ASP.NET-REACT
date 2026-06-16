using Microsoft.AspNetCore.Identity;
using Questro.Core.Entities.Movies;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Specifications.Movies;
using Questro.Infrastructure.Abstractions;
using Questro.Service.Abstractions.Movies;
using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.ErrorHandle.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Services.Movies;

public sealed class MovieInteractionService : IMovieInteractionService
{
    private readonly IGenericRepository<Movie> _movieRepository;
    private readonly IGenericRepository<UserMovieLike> _userMovieLikeRepository;
    private readonly IGenericRepository<UserMovieRate> _userMovieRateRepository;
    private readonly IGenericRepository<UserMovieReview> _userMovieReviewRepository;
    private readonly IGenericRepository<UserMovieWatched> _userMovieWatchedRepository;
    private readonly IGenericRepository<UserMovieWatchlist> _userMovieWatchlistRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMovieSyncService _movieSyncService;

    public MovieInteractionService(
        IGenericRepository<Movie> movieRepository,
        IGenericRepository<UserMovieLike> userMovieLikeRepository,
        IGenericRepository<UserMovieRate> userMovieRateRepository,
        IGenericRepository<UserMovieReview> userMovieReviewRepository,
        IGenericRepository<UserMovieWatched> userMovieWatchedRepository,
        IGenericRepository<UserMovieWatchlist> userMovieWatchlistRepository,
        UserManager<ApplicationUser> userManager,
        IUnitOfWork unitOfWork,
        IMovieSyncService movieSyncService)
    {
        _movieRepository = movieRepository;
        _userMovieLikeRepository = userMovieLikeRepository;
        _userMovieRateRepository = userMovieRateRepository;
        _userMovieReviewRepository = userMovieReviewRepository;
        _userMovieWatchedRepository = userMovieWatchedRepository;
        _userMovieWatchlistRepository = userMovieWatchlistRepository;
        _userManager = userManager;
        _unitOfWork = unitOfWork;
        _movieSyncService = movieSyncService;
    }

    public async Task<Result<MovieInteractionStatusDto>> ToggleLikeAsync(int tmdbId, long userId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<MovieInteractionStatusDto>(MovieError.UnauthorizedInteraction);
        }

        if (tmdbId <= 0)
        {
            return Result.Failure<MovieInteractionStatusDto>(MovieError.InvalidTmdbId);
        }

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, cancellationToken);
        if (ensureLocalMovieResult.IsFailure)
        {
            return Result.Failure<MovieInteractionStatusDto>(ensureLocalMovieResult.Error, ensureLocalMovieResult.Details);
        }

        var movie = ensureLocalMovieResult.Value;

        var existingLike = await _userMovieLikeRepository.GetEntityWithSpecAsync(
            new UserMovieLikeByUserAndMovieSpecification(userId, movie.MovieId),
            cancellationToken);

        if (existingLike is null)
        {
            await _userMovieLikeRepository.AddAsync(new UserMovieLike
            {
                UserId = userId,
                MovieId = movie.MovieId,
                Timestamp = DateTime.UtcNow
            }, cancellationToken);
        }
        else
        {
            _userMovieLikeRepository.Remove(existingLike);
        }

        await _unitOfWork.CompleteAsync(cancellationToken);
        var status = await BuildInteractionStatusAsync(movie, userId, cancellationToken);

        return Result.Success(status);
    }

    public async Task<Result<MovieInteractionStatusDto>> SetRatingAsync(int tmdbId, long userId, int stars, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<MovieInteractionStatusDto>(MovieError.UnauthorizedInteraction);
        }

        if (tmdbId <= 0)
        {
            return Result.Failure<MovieInteractionStatusDto>(MovieError.InvalidTmdbId);
        }

        if (stars < 1 || stars > 5)
        {
            return Result.Failure<MovieInteractionStatusDto>(MovieError.InvalidRating);
        }

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, cancellationToken);
        if (ensureLocalMovieResult.IsFailure)
        {
            return Result.Failure<MovieInteractionStatusDto>(ensureLocalMovieResult.Error, ensureLocalMovieResult.Details);
        }

        var movie = ensureLocalMovieResult.Value;

        var existingRate = await _userMovieRateRepository.GetEntityWithSpecAsync(
            new UserMovieRateByUserAndMovieSpecification(userId, movie.MovieId),
            cancellationToken);

        if (existingRate is null)
        {
            await _userMovieRateRepository.AddAsync(new UserMovieRate
            {
                UserId = userId,
                MovieId = movie.MovieId,
                Stars = stars,
                Timestamp = DateTime.UtcNow
            }, cancellationToken);
        }
        else
        {
            existingRate.Stars = stars;
            existingRate.Timestamp = DateTime.UtcNow;
            _userMovieRateRepository.Update(existingRate);
        }

        await EnsureWatchedAndCleanupWatchlistAsync(userId, movie.MovieId, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);
        await TriggerGamificationCheckAsync(userId);
        var status = await BuildInteractionStatusAsync(movie, userId, cancellationToken);

        return Result.Success(status);
    }

    public async Task<Result<MovieInteractionStatusDto>> ToggleWatchlistAsync(int tmdbId, long userId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<MovieInteractionStatusDto>(MovieError.UnauthorizedInteraction);
        }

        if (tmdbId <= 0)
        {
            return Result.Failure<MovieInteractionStatusDto>(MovieError.InvalidTmdbId);
        }

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, cancellationToken);
        if (ensureLocalMovieResult.IsFailure)
        {
            return Result.Failure<MovieInteractionStatusDto>(ensureLocalMovieResult.Error, ensureLocalMovieResult.Details);
        }

        var movie = ensureLocalMovieResult.Value;

        var existingWatchlist = await _userMovieWatchlistRepository.GetEntityWithSpecAsync(
            new UserMovieWatchlistByUserAndMovieSpecification(userId, movie.MovieId),
            cancellationToken);

        if (existingWatchlist is null)
        {
            await _userMovieWatchlistRepository.AddAsync(new UserMovieWatchlist
            {
                UserId = userId,
                MovieId = movie.MovieId,
                Timestamp = DateTime.UtcNow
            }, cancellationToken);
        }
        else
        {
            _userMovieWatchlistRepository.Remove(existingWatchlist);
        }

        await _unitOfWork.CompleteAsync(cancellationToken);
        var status = await BuildInteractionStatusAsync(movie, userId, cancellationToken);

        return Result.Success(status);
    }

    public async Task<Result<PagedResponse<MovieReviewDto>>> GetMovieReviewsAsync(
        int tmdbId,
        int pageIndex = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (tmdbId <= 0)
        {
            return Result.Failure<PagedResponse<MovieReviewDto>>(MovieError.InvalidTmdbId);
        }

        var safePageIndex = pageIndex < 1 ? 1 : pageIndex;
        var safePageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 50);
        var movie = await _movieRepository.GetEntityWithSpecAsync(new MovieByTmdbIdSpecification(tmdbId), cancellationToken);

        if (movie is null)
        {
            return Result.Success(new PagedResponse<MovieReviewDto>
            {
                Data = Enumerable.Empty<MovieReviewDto>(),
                PageNumber = safePageIndex,
                PageSize = safePageSize,
                TotalCount = 0,
                TotalPages = 0
            });
        }

        var reviews = await _userMovieReviewRepository.ListAsync(
            new UserMovieReviewsByMovieIdSpecification(movie.MovieId, safePageIndex, safePageSize),
            cancellationToken);

        var totalCount = await _userMovieReviewRepository.CountAsync(
            new UserMovieReviewsCountByMovieIdSpecification(movie.MovieId),
            cancellationToken);

        var mapped = reviews
            .Select(x => new MovieReviewDto(
                x.Id,
                movie.TMDB_Id,
                x.UserId,
                x.User?.UserName,
                x.Body,
                x.Sentiment,
                x.Timestamp,
                x.User?.ProfilePic))
            .ToList();

        return Result.Success(new PagedResponse<MovieReviewDto>
        {
            Data = mapped,
            PageNumber = safePageIndex,
            PageSize = safePageSize,
            TotalCount = totalCount,
            TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)safePageSize)
        });
    }

    public async Task<Result<MovieReviewDto>> AddReviewAsync(int tmdbId, long userId, string body, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<MovieReviewDto>(MovieError.UnauthorizedInteraction);
        }

        if (tmdbId <= 0)
        {
            return Result.Failure<MovieReviewDto>(MovieError.InvalidTmdbId);
        }

        var bodyValidation = ValidateReviewBody(body);
        if (bodyValidation.IsFailure)
        {
            return Result.Failure<MovieReviewDto>(bodyValidation.Error, bodyValidation.Details);
        }

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, cancellationToken);
        if (ensureLocalMovieResult.IsFailure)
        {
            return Result.Failure<MovieReviewDto>(ensureLocalMovieResult.Error, ensureLocalMovieResult.Details);
        }

        var movie = ensureLocalMovieResult.Value;
        var existingReview = await _userMovieReviewRepository.GetEntityWithSpecAsync(
            new UserMovieReviewByUserAndMovieSpecification(userId, movie.MovieId),
            cancellationToken);

        if (existingReview is not null)
        {
            return Result.Failure<MovieReviewDto>(MovieError.ReviewAlreadyExists);
        }

        var review = new UserMovieReview
        {
            UserId = userId,
            MovieId = movie.MovieId,
            Body = body.Trim(),
            Sentiment = null,
            Timestamp = DateTime.UtcNow
        };

        await _userMovieReviewRepository.AddAsync(review, cancellationToken);
        await EnsureWatchedAndCleanupWatchlistAsync(userId, movie.MovieId, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);
        await TriggerGamificationCheckAsync(userId);

        var user = await _userManager.FindByIdAsync(userId.ToString());
        return Result.Success(new MovieReviewDto(
            review.Id,
            movie.TMDB_Id,
            review.UserId,
            user?.UserName,
            review.Body,
            review.Sentiment,
            review.Timestamp,
            user?.ProfilePic));
    }

    public async Task<Result<MovieReviewDto>> UpdateReviewAsync(int tmdbId, long userId, string body, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<MovieReviewDto>(MovieError.UnauthorizedInteraction);
        }

        if (tmdbId <= 0)
        {
            return Result.Failure<MovieReviewDto>(MovieError.InvalidTmdbId);
        }

        var bodyValidation = ValidateReviewBody(body);
        if (bodyValidation.IsFailure)
        {
            return Result.Failure<MovieReviewDto>(bodyValidation.Error, bodyValidation.Details);
        }

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, cancellationToken);
        if (ensureLocalMovieResult.IsFailure)
        {
            return Result.Failure<MovieReviewDto>(ensureLocalMovieResult.Error, ensureLocalMovieResult.Details);
        }

        var movie = ensureLocalMovieResult.Value;
        var existingReview = await _userMovieReviewRepository.GetEntityWithSpecAsync(
            new UserMovieReviewByUserAndMovieSpecification(userId, movie.MovieId),
            cancellationToken);

        if (existingReview is null)
        {
            return Result.Failure<MovieReviewDto>(MovieError.ReviewNotFound);
        }

        existingReview.Body = body.Trim();
        existingReview.Timestamp = DateTime.UtcNow;
        _userMovieReviewRepository.Update(existingReview);

        await EnsureWatchedAndCleanupWatchlistAsync(userId, movie.MovieId, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);
        await TriggerGamificationCheckAsync(userId);

        var user = await _userManager.FindByIdAsync(userId.ToString());
        return Result.Success(new MovieReviewDto(
            existingReview.Id,
            movie.TMDB_Id,
            existingReview.UserId,
            user?.UserName,
            existingReview.Body,
            existingReview.Sentiment,
            existingReview.Timestamp,
            user?.ProfilePic));
    }

    public async Task<Result<bool>> DeleteReviewAsync(int tmdbId, long userId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<bool>(MovieError.UnauthorizedInteraction);
        }

        if (tmdbId <= 0)
        {
            return Result.Failure<bool>(MovieError.InvalidTmdbId);
        }

        var movie = await _movieRepository.GetEntityWithSpecAsync(new MovieByTmdbIdSpecification(tmdbId), cancellationToken);
        if (movie is null)
        {
            return Result.Failure<bool>(MovieError.NotFound);
        }

        var existingReview = await _userMovieReviewRepository.GetEntityWithSpecAsync(
            new UserMovieReviewByUserAndMovieSpecification(userId, movie.MovieId),
            cancellationToken);

        if (existingReview is null)
        {
            return Result.Failure<bool>(MovieError.ReviewNotFound);
        }

        _userMovieReviewRepository.Remove(existingReview);
        await _unitOfWork.CompleteAsync(cancellationToken);
        await TriggerGamificationCheckAsync(userId);

        return Result.Success(true);
    }

    public async Task<Result<MovieInteractionStatusDto>> MarkWatchedAsync(int tmdbId, long userId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<MovieInteractionStatusDto>(MovieError.UnauthorizedInteraction);
        }

        if (tmdbId <= 0)
        {
            return Result.Failure<MovieInteractionStatusDto>(MovieError.InvalidTmdbId);
        }

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, cancellationToken);
        if (ensureLocalMovieResult.IsFailure)
        {
            return Result.Failure<MovieInteractionStatusDto>(ensureLocalMovieResult.Error, ensureLocalMovieResult.Details);
        }

        var movie = ensureLocalMovieResult.Value;

        await EnsureWatchedAndCleanupWatchlistAsync(userId, movie.MovieId, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);
        await TriggerGamificationCheckAsync(userId);

        var status = await BuildInteractionStatusAsync(movie, userId, cancellationToken);
        return Result.Success(status);
    }

    private async Task<Result<Movie>> EnsureLocalMovieAsync(int tmdbId, CancellationToken cancellationToken)
    {
        var localMovie = await _movieRepository.GetEntityWithSpecAsync(new MovieByTmdbIdSpecification(tmdbId), cancellationToken);
        if (localMovie is not null)
        {
            return Result.Success(localMovie);
        }

        var syncResult = await _movieSyncService.FetchAndSaveMovieByTmdbIdAsync(tmdbId, cancellationToken);
        if (syncResult.IsFailure)
        {
            return Result.Failure<Movie>(syncResult.Error, syncResult.Details);
        }

        localMovie = await _movieRepository.GetEntityWithSpecAsync(new MovieByTmdbIdSpecification(tmdbId), cancellationToken);
        return localMovie is null
            ? Result.Failure<Movie>(MovieError.NotFound)
            : Result.Success(localMovie);
    }

    private async Task EnsureWatchedAndCleanupWatchlistAsync(long userId, int movieId, CancellationToken cancellationToken)
    {
        var existingWatched = await _userMovieWatchedRepository.GetEntityWithSpecAsync(
            new UserMovieWatchedByUserAndMovieSpecification(userId, movieId),
            cancellationToken);

        if (existingWatched is null)
        {
            await _userMovieWatchedRepository.AddAsync(new UserMovieWatched
            {
                UserId = userId,
                MovieId = movieId,
                Timestamp = DateTime.UtcNow
            }, cancellationToken);
        }

        var existingWatchlist = await _userMovieWatchlistRepository.GetEntityWithSpecAsync(
            new UserMovieWatchlistByUserAndMovieSpecification(userId, movieId),
            cancellationToken);

        if (existingWatchlist is not null)
        {
            _userMovieWatchlistRepository.Remove(existingWatchlist);
        }
    }

    private Result ValidateReviewBody(string? body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return Result.Failure(MovieError.ReviewBodyInvalid);
        }

        if (body.Trim().Length > 4000)
        {
            return Result.Failure(MovieError.ReviewBodyTooLong);
        }

        return Result.Success();
    }

    private async Task<string?> GetUserNameAsync(long userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        return user?.UserName;
    }

    private Task TriggerGamificationCheckAsync(long userId)
    {
        _ = userId;
        return Task.CompletedTask;
    }

    private async Task<MovieInteractionStatusDto> BuildInteractionStatusAsync(Movie movie, long userId, CancellationToken cancellationToken)
    {
        var userStatus = await BuildUserStatusAsync(movie.MovieId, userId, cancellationToken);
        return new MovieInteractionStatusDto(
            movie.MovieId,
            movie.TMDB_Id,
            userStatus.IsLiked,
            userStatus.IsInWatchlist,
            userStatus.IsWatched,
            userStatus.UserRating);
    }

    private async Task<MovieUserStatusDto> BuildUserStatusAsync(int movieId, long userId, CancellationToken cancellationToken)
    {
        var like = await _userMovieLikeRepository.GetEntityWithSpecAsync(
            new UserMovieLikeByUserAndMovieSpecification(userId, movieId),
            cancellationToken);

        var rate = await _userMovieRateRepository.GetEntityWithSpecAsync(
            new UserMovieRateByUserAndMovieSpecification(userId, movieId),
            cancellationToken);

        var watchlist = await _userMovieWatchlistRepository.GetEntityWithSpecAsync(
            new UserMovieWatchlistByUserAndMovieSpecification(userId, movieId),
            cancellationToken);

        var watched = await _userMovieWatchedRepository.GetEntityWithSpecAsync(
            new UserMovieWatchedByUserAndMovieSpecification(userId, movieId),
            cancellationToken);

        return new MovieUserStatusDto(
            like is not null,
            watchlist is not null,
            watched is not null,
            rate?.Stars);
    }
}
