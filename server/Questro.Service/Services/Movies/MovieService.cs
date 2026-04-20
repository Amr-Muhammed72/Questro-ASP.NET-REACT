using Microsoft.AspNetCore.Identity;
using Questro.Core.Entities.Movies;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Entities.Users;
using Questro.Core.Specifications.Movies;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.ExternalServices.Tmdb.Contracts;
using Questro.Service.Abstractions.Movies;
using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.ErrorHandle.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Services.Movies;

public class MovieService : IMovieService
{
    private const int DefaultTake = 20;

    private readonly IGenericRepository<Movie> _movieRepository;
    private readonly IGenericRepository<MovieGenre> _movieGenreRepository;
    private readonly IGenericRepository<Staff> _staffRepository;
    private readonly IGenericRepository<Movie_Staff> _movieStaffRepository;
    private readonly IGenericRepository<UserMovieLike> _userMovieLikeRepository;
    private readonly IGenericRepository<UserMovieRate> _userMovieRateRepository;
    private readonly IGenericRepository<UserMovieReview> _userMovieReviewRepository;
    private readonly IGenericRepository<UserMovieWatched> _userMovieWatchedRepository;
    private readonly IGenericRepository<UserMovieWatchlist> _userMovieWatchlistRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITmdbService _tmdbService;
    private readonly IUnitOfWork _unitOfWork;

    public MovieService(
        IGenericRepository<Movie> movieRepository,
        IGenericRepository<MovieGenre> movieGenreRepository,
        IGenericRepository<Staff> staffRepository,
        IGenericRepository<Movie_Staff> movieStaffRepository,
        IGenericRepository<UserMovieLike> userMovieLikeRepository,
        IGenericRepository<UserMovieRate> userMovieRateRepository,
        IGenericRepository<UserMovieReview> userMovieReviewRepository,
        IGenericRepository<UserMovieWatched> userMovieWatchedRepository,
        IGenericRepository<UserMovieWatchlist> userMovieWatchlistRepository,
        UserManager<ApplicationUser> userManager,
        ITmdbService tmdbService,
        IUnitOfWork unitOfWork)
    {
        _movieRepository = movieRepository;
        _movieGenreRepository = movieGenreRepository;
        _staffRepository = staffRepository;
        _movieStaffRepository = movieStaffRepository;
        _userMovieLikeRepository = userMovieLikeRepository;
        _userMovieRateRepository = userMovieRateRepository;
        _userMovieReviewRepository = userMovieReviewRepository;
        _userMovieWatchedRepository = userMovieWatchedRepository;
        _userMovieWatchlistRepository = userMovieWatchlistRepository;
        _userManager = userManager;
        _tmdbService = tmdbService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PagedResponse<MovieListItemDto>>> GetMoviesAsync(MovieSpecParams specParams, CancellationToken cancellationToken = default)
    {
        var parameters = specParams ?? new MovieSpecParams();
        var safePageIndex = parameters.PageIndex < 1 ? 1 : parameters.PageIndex;
        var safePageSize = parameters.PageSize < 1 ? DefaultTake : parameters.PageSize;

        var genreMap = await GetLocalGenreMapAsync(cancellationToken);

        TmdbPagedMovieResponse? tmdbResponse;
        if (string.IsNullOrWhiteSpace(parameters.Search))
        {
            tmdbResponse = await _tmdbService.DiscoverMoviesAsync(parameters, cancellationToken);
        }
        else
        {
            tmdbResponse = await _tmdbService.SearchMoviesAsync(parameters, cancellationToken);
        }

        if (tmdbResponse?.Results is null || tmdbResponse.Results.Count == 0)
        {
            return Result.Success(new PagedResponse<MovieListItemDto>
            {
                Data = Enumerable.Empty<MovieListItemDto>(),
                PageNumber = safePageIndex,
                PageSize = safePageSize,
                TotalCount = 0,
                TotalPages = 0
            });
        }

        var localMovieIdMap = await BuildLocalMovieIdMapAsync(tmdbResponse.Results.Select(x => x.Id), cancellationToken);

        var filtered = ApplyPostSearchFilters(tmdbResponse.Results, parameters)
            .Take(safePageSize)
            .Select(x => MapLiveMovie(x, genreMap, localMovieIdMap))
            .ToList();

        return Result.Success(new PagedResponse<MovieListItemDto>
        {
            Data = filtered,
            PageNumber = safePageIndex,
            PageSize = safePageSize,
            TotalCount = tmdbResponse.TotalResults,
            TotalPages = tmdbResponse.TotalPages
        });
    }

    public async Task<Result<IEnumerable<MovieListItemDto>>> GetRecentlyAddedAsync(int take = DefaultTake, CancellationToken cancellationToken = default)
    {
        var safeTake = take < 1 ? DefaultTake : take;
        var genreMap = await GetLocalGenreMapAsync(cancellationToken);

        var tmdbMovies = await CollectMoviesAsync(_tmdbService.GetNowPlayingMoviesAsync, safeTake, cancellationToken);
        if (tmdbMovies.Count == 0)
        {
            return Result.Failure<IEnumerable<MovieListItemDto>>(MovieError.RecentlyAddedUnavailable);
        }

        var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-30);
        var recentOnly = tmdbMovies
            .Where(x => ParseDate(x.ReleaseDate) is DateTime releaseDate && releaseDate.Date >= thirtyDaysAgo)
            .ToList();

        if (recentOnly.Count == 0)
        {
            recentOnly = tmdbMovies;
        }

        var noLocalMovieLookup = new Dictionary<int, int>();

        var mapped = recentOnly
            .Take(safeTake)
            .Select(x => MapLiveMovie(x, genreMap, noLocalMovieLookup))
            .ToList();

        return Result.Success<IEnumerable<MovieListItemDto>>(mapped);
    }

    public async Task<Result<IEnumerable<MovieListItemDto>>> GetTrendingAsync(int take = DefaultTake, CancellationToken cancellationToken = default)
    {
        var safeTake = take < 1 ? DefaultTake : take;
        var genreMap = await GetLocalGenreMapAsync(cancellationToken);

        var tmdbMovies = await CollectMoviesAsync(_tmdbService.GetTrendingMoviesWeekAsync, safeTake, cancellationToken);
        if (tmdbMovies.Count == 0)
        {
            return Result.Failure<IEnumerable<MovieListItemDto>>(MovieError.TrendingUnavailable);
        }

        var noLocalMovieLookup = new Dictionary<int, int>();

        var mapped = tmdbMovies
            .Select(x => MapLiveMovie(x, genreMap, noLocalMovieLookup))
            .ToList();

        return Result.Success<IEnumerable<MovieListItemDto>>(mapped);
    }

    public async Task<Result<IEnumerable<MovieGenreDto>>> GetGenresAsync(CancellationToken cancellationToken = default)
    {
        var genreMap = await GetLocalGenreMapAsync(cancellationToken);
        if (genreMap.Count == 0)
        {
            return Result.Failure<IEnumerable<MovieGenreDto>>(MovieError.GenresNotFound);
        }

        var mapped = genreMap
            .OrderBy(x => x.Value)
            .Select(x => new MovieGenreDto(x.Key, x.Value))
            .ToList();

        return Result.Success<IEnumerable<MovieGenreDto>>(mapped);
    }

    public async Task<Result<IEnumerable<MovieListItemDto>>> GetRecommendedAsync(int take = DefaultTake, CancellationToken cancellationToken = default)
    {
        var safeTake = take < 1 ? DefaultTake : take;

        var candidateMovies = await _movieRepository.ListAsync(
            new RecommendedPlaceholderMoviesSpecification(safeTake * 5),
            cancellationToken);

        var randomized = candidateMovies
            .OrderByDescending(x => x.TMDB_Rating ?? 0)
            .ThenByDescending(x => x.Popularity ?? 0)
            .Take(safeTake * 2)
            .OrderBy(_ => Random.Shared.Next())
            .Take(safeTake)
            .Select(MapLocalMovieToListItem)
            .ToList();

        return Result.Success<IEnumerable<MovieListItemDto>>(randomized);
    }

    public async Task<Result<MovieListItemDto>> FetchAndSaveMovieByTmdbIdAsync(int tmdbId, CancellationToken cancellationToken = default)
    {
        if (tmdbId <= 0)
        {
            return Result.Failure<MovieListItemDto>(MovieError.InvalidTmdbId);
        }

        var existingMovie = await _movieRepository.GetEntityWithSpecAsync(new MovieByTmdbIdSpecification(tmdbId), cancellationToken);
        if (existingMovie is not null)
        {
            var existingCredits = await _tmdbService.GetMovieCreditsAsync(tmdbId, cancellationToken);
            if (existingCredits is null)
            {
                return Result.Failure<MovieListItemDto>(MovieError.CreditsUnavailable);
            }

            var existingStaffByTmdbId = await EnsureStaffMembersExistAsync(existingCredits, cancellationToken);
            await UpsertMovieStaffLinksAsync(existingMovie.MovieId, existingCredits, existingStaffByTmdbId, cancellationToken);
            return Result.Success(MapLocalMovieToListItem(existingMovie));
        }

        var tmdbDetails = await _tmdbService.GetMovieDetailsAsync(tmdbId, cancellationToken);
        if (tmdbDetails is null || string.IsNullOrWhiteSpace(tmdbDetails.Title))
        {
            return Result.Failure<MovieListItemDto>(MovieError.NotFound);
        }

        var tmdbCredits = await _tmdbService.GetMovieCreditsAsync(tmdbId, cancellationToken);
        if (tmdbCredits is null)
        {
            return Result.Failure<MovieListItemDto>(MovieError.CreditsUnavailable);
        }

        var genreEntitiesByTmdbId = await EnsureGenresExistAsync(tmdbDetails.Genres, cancellationToken);
        var staffByTmdbId = await EnsureStaffMembersExistAsync(tmdbCredits, cancellationToken);

        var movie = new Movie
        {
            TMDB_Id = tmdbDetails.Id,
            IMDB_Id = tmdbDetails.ImdbId,
            Title = tmdbDetails.Title.Trim(),
            Overview = tmdbDetails.Overview,
            Runtime = tmdbDetails.Runtime,
            Popularity = tmdbDetails.Popularity,
            Poster_Url = BuildImageUrl(tmdbDetails.PosterPath, "w500"),
            Backdrop_Url = BuildImageUrl(tmdbDetails.BackdropPath, "w780"),
            Language = tmdbDetails.OriginalLanguage,
            Release_Date = ParseDate(tmdbDetails.ReleaseDate),
            TMDB_Rating = tmdbDetails.VoteAverage,
            TMDB_VoteCount = tmdbDetails.VoteCount,
            MovieGenres = tmdbDetails.Genres
                .Where(x => genreEntitiesByTmdbId.ContainsKey(x.Id))
                .Select(x => new Movie_MovieGenre
                {
                    GenreId = genreEntitiesByTmdbId[x.Id].GenreId,
                    CreatedAt = DateTime.UtcNow
                })
                .ToList()
        };

        await _movieRepository.AddAsync(movie, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);
        await UpsertMovieStaffLinksAsync(movie.MovieId, tmdbCredits, staffByTmdbId, cancellationToken);

        var response = new MovieListItemDto(
            movie.MovieId,
            movie.TMDB_Id,
            movie.Title,
            movie.Poster_Url,
            movie.Backdrop_Url,
            movie.Release_Date,
            movie.Language,
            movie.Mpa_Certification,
            movie.Popularity,
            movie.TMDB_Rating,
            movie.TMDB_VoteCount,
            tmdbDetails.Genres
                .Select(x => x.Name)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToList(),
            Enumerable.Empty<string>());

        return Result.Success(response);
    }

    public async Task<Result<MovieDetailsDto>> GetMovieDetailsAsync(int tmdbId, long? userId = null, CancellationToken cancellationToken = default)
    {
        if (tmdbId <= 0)
        {
            return Result.Failure<MovieDetailsDto>(MovieError.InvalidTmdbId);
        }

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, syncCredits: true, cancellationToken);
        var localMovie = ensureLocalMovieResult.IsSuccess ? ensureLocalMovieResult.Value : null;

        var tmdbDetails = await _tmdbService.GetMovieDetailsAsync(tmdbId, cancellationToken);
        if (tmdbDetails is null && localMovie is null)
        {
            return Result.Failure<MovieDetailsDto>(MovieError.NotFound);
        }

        var tmdbCredits = await _tmdbService.GetMovieCreditsAsync(tmdbId, cancellationToken);
        var tmdbVideos = await _tmdbService.GetMovieVideosAsync(tmdbId, cancellationToken);
        var tmdbSimilar = await _tmdbService.GetSimilarMoviesAsync(tmdbId, cancellationToken: cancellationToken);
        var tmdbWatchProviders = await _tmdbService.GetMovieWatchProvidersAsync(tmdbId, cancellationToken);

        var genres = ExtractGenreNames(localMovie, tmdbDetails);
        var cast = MapCastCredits(localMovie, tmdbCredits);
        var crew = MapCrewCredits(localMovie, tmdbCredits);
        var trailerUrl = ResolveTrailerUrl(tmdbVideos);
        var similar = await MapSimilarMoviesAsync(tmdbSimilar, cancellationToken);
        var watchProviders = MapWatchProviders(tmdbWatchProviders);

        var ratingSummary = await BuildRatingSummaryAsync(
            localMovie?.MovieId,
            tmdbDetails?.VoteAverage,
            tmdbDetails?.VoteCount,
            cancellationToken);

        MovieUserStatusDto? userStatus = null;
        if (userId.HasValue && userId.Value > 0 && localMovie is not null)
        {
            userStatus = await BuildUserStatusAsync(localMovie.MovieId, userId.Value, cancellationToken);
        }

        var details = new MovieDetailsDto(
            localMovie?.MovieId ?? 0,
            tmdbDetails?.Id ?? localMovie?.TMDB_Id,
            tmdbDetails?.Title ?? localMovie?.Title ?? string.Empty,
            tmdbDetails?.Overview ?? localMovie?.Overview,
            tmdbDetails?.Runtime ?? localMovie?.Runtime,
            ParseDate(tmdbDetails?.ReleaseDate) ?? localMovie?.Release_Date,
            tmdbDetails?.OriginalLanguage ?? localMovie?.Language,
            BuildImageUrl(tmdbDetails?.PosterPath, "w500") ?? localMovie?.Poster_Url,
            BuildImageUrl(tmdbDetails?.BackdropPath, "w780") ?? localMovie?.Backdrop_Url,
            tmdbDetails?.Popularity ?? localMovie?.Popularity,
            tmdbDetails?.VoteAverage ?? localMovie?.TMDB_Rating,
            tmdbDetails?.VoteCount ?? localMovie?.TMDB_VoteCount,
            tmdbDetails?.ImdbId ?? localMovie?.IMDB_Id,
            trailerUrl,
            genres,
            cast,
            crew,
            similar,
            watchProviders,
            ratingSummary,
            userStatus);

        return Result.Success(details);
    }

    public async Task<Result<StaffDetailsDto>> GetStaffDetailsAsync(int tmdbId, CancellationToken cancellationToken = default)
    {
        if (tmdbId <= 0)
        {
            return Result.Failure<StaffDetailsDto>(MovieError.InvalidTmdbId);
        }

        var localStaff = await _staffRepository.GetEntityWithSpecAsync(new StaffDetailsByTmdbIdSpecification(tmdbId), cancellationToken);
        var tmdbPerson = await _tmdbService.GetPersonDetailsAsync(tmdbId, cancellationToken);
        if (localStaff is null && (tmdbPerson is null || string.IsNullOrWhiteSpace(tmdbPerson.Name)))
        {
            return Result.Failure<StaffDetailsDto>(MovieError.StaffNotFound);
        }

        var personCredits = await _tmdbService.GetPersonMovieCreditsAsync(tmdbId, cancellationToken);
        var knownForMovies = BuildStaffMovieCredits(localStaff, personCredits);

        var details = new StaffDetailsDto(
            localStaff?.Staff_Id,
            localStaff?.TMDB_Id ?? tmdbPerson?.Id,
            localStaff?.Name ?? tmdbPerson?.Name ?? string.Empty,
            tmdbPerson?.Biography,
            localStaff?.BirthDate ?? ParseDate(tmdbPerson?.Birthday),
            tmdbPerson?.PlaceOfBirth,
            localStaff?.Gender ?? MapGender(tmdbPerson?.Gender),
            localStaff?.Department ?? tmdbPerson?.KnownForDepartment,
            localStaff?.Profile_Path ?? BuildImageUrl(tmdbPerson?.ProfilePath, "w300"),
            knownForMovies);

        return Result.Success(details);
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

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, syncCredits: false, cancellationToken);
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

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, syncCredits: false, cancellationToken);
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

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, syncCredits: false, cancellationToken);
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
                x.MovieId,
                movie.TMDB_Id,
                x.UserId,
                x.User?.UserName,
                x.Body,
                x.Sentiment,
                x.Timestamp))
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

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, syncCredits: false, cancellationToken);
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

        var userName = await GetUserNameAsync(userId);
        return Result.Success(new MovieReviewDto(
            review.Id,
            review.MovieId,
            movie.TMDB_Id,
            review.UserId,
            userName,
            review.Body,
            review.Sentiment,
            review.Timestamp));
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

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, syncCredits: false, cancellationToken);
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

        var userName = await GetUserNameAsync(userId);
        return Result.Success(new MovieReviewDto(
            existingReview.Id,
            existingReview.MovieId,
            movie.TMDB_Id,
            existingReview.UserId,
            userName,
            existingReview.Body,
            existingReview.Sentiment,
            existingReview.Timestamp));
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

        var ensureLocalMovieResult = await EnsureLocalMovieAsync(tmdbId, syncCredits: false, cancellationToken);
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

    public async Task<Result<IEnumerable<MovieListItemDto>>> GetRecommendedForMeAsync(
        long userId,
        int take = DefaultTake,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return Result.Failure<IEnumerable<MovieListItemDto>>(MovieError.UnauthorizedInteraction);
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result.Failure<IEnumerable<MovieListItemDto>>(MovieError.UnauthorizedInteraction);
        }

        var safeTake = take < 1 ? DefaultTake : take;
        var candidates = await _movieRepository.ListAsync(
            new RecommendedPlaceholderMoviesSpecification(safeTake * 6),
            cancellationToken);

        if (candidates.Count == 0)
        {
            candidates = await _movieRepository.ListAsync(
                new TrendingFallbackMoviesSpecification(safeTake * 6),
                cancellationToken);
        }

        if (candidates.Count == 0)
        {
            return Result.Success<IEnumerable<MovieListItemDto>>(Enumerable.Empty<MovieListItemDto>());
        }

        var ordered = candidates
            .OrderByDescending(x => x.TMDB_Rating ?? 0)
            .ThenByDescending(x => x.Popularity ?? 0)
            .ToList();

        IEnumerable<Movie> selected = user.PrimaryInterest switch
        {
            UserInterest.Movies => ordered.Take(safeTake),
            _ => ordered.Take(safeTake * 3).OrderBy(_ => Random.Shared.Next()).Take(safeTake)
        };

        var mapped = selected
            .Select(MapLocalMovieToListItem)
            .ToList();

        return Result.Success<IEnumerable<MovieListItemDto>>(mapped);
    }

    private async Task<Dictionary<int, Staff>> EnsureStaffMembersExistAsync(TmdbMovieCreditsResponse credits, CancellationToken cancellationToken)
    {
        var relevantCredits = BuildRelevantStaffCredits(credits);
        if (relevantCredits.Count == 0)
        {
            return new Dictionary<int, Staff>();
        }

        var localStaff = await _staffRepository.ListAllAsync(cancellationToken);

        var byTmdbId = localStaff
            .Where(x => x.TMDB_Id.HasValue)
            .GroupBy(x => x.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First());

        var byName = localStaff
            .GroupBy(x => x.Name.Trim().ToLowerInvariant())
            .ToDictionary(x => x.Key, x => x.First());

        var staffToAdd = new List<Staff>();
        var hasUpdates = false;

        foreach (var credit in relevantCredits)
        {
            if (byTmdbId.TryGetValue(credit.TmdbId, out var existingByTmdbId))
            {
                if (ApplyStaffMetadata(existingByTmdbId, credit.Department, credit.Gender, credit.ProfilePath))
                {
                    _staffRepository.Update(existingByTmdbId);
                    hasUpdates = true;
                }

                continue;
            }

            var normalizedName = credit.Name.Trim().ToLowerInvariant();
            if (byName.TryGetValue(normalizedName, out var existingByName) && !existingByName.TMDB_Id.HasValue)
            {
                existingByName.TMDB_Id = credit.TmdbId;
                ApplyStaffMetadata(existingByName, credit.Department, credit.Gender, credit.ProfilePath);
                _staffRepository.Update(existingByName);

                byTmdbId[credit.TmdbId] = existingByName;
                hasUpdates = true;
                continue;
            }

            var newStaff = new Staff
            {
                TMDB_Id = credit.TmdbId,
                Name = credit.Name,
                Department = credit.Department,
                Gender = MapGender(credit.Gender),
                Profile_Path = BuildImageUrl(credit.ProfilePath, "w185")
            };

            staffToAdd.Add(newStaff);
            byTmdbId[credit.TmdbId] = newStaff;
            byName[normalizedName] = newStaff;
        }

        if (staffToAdd.Count > 0)
        {
            await _staffRepository.AddRangeAsync(staffToAdd, cancellationToken);
            hasUpdates = true;
        }

        if (hasUpdates)
        {
            await _unitOfWork.CompleteAsync(cancellationToken);

            localStaff = await _staffRepository.ListAllAsync(cancellationToken);
            byTmdbId = localStaff
                .Where(x => x.TMDB_Id.HasValue)
                .GroupBy(x => x.TMDB_Id!.Value)
                .ToDictionary(x => x.Key, x => x.First());
        }

        return byTmdbId;
    }

    private async Task UpsertMovieStaffLinksAsync(
        int movieId,
        TmdbMovieCreditsResponse credits,
        IReadOnlyDictionary<int, Staff> staffByTmdbId,
        CancellationToken cancellationToken)
    {
        var relevantCredits = BuildRelevantStaffCredits(credits);
        if (relevantCredits.Count == 0)
        {
            return;
        }

        var existingLinks = await _movieStaffRepository.ListAsync(new MovieStaffByMovieIdSpecification(movieId), cancellationToken);
        var existingByStaffId = existingLinks.ToDictionary(x => x.Staff_Id, x => x);

        var linksToAdd = new List<Movie_Staff>();
        var hasUpdates = false;

        foreach (var credit in relevantCredits)
        {
            if (!staffByTmdbId.TryGetValue(credit.TmdbId, out var staff))
            {
                continue;
            }

            if (existingByStaffId.TryGetValue(staff.Staff_Id, out var existingLink))
            {
                if (!string.Equals(existingLink.Role, credit.Role, StringComparison.OrdinalIgnoreCase) &&
                    !string.IsNullOrWhiteSpace(credit.Role))
                {
                    existingLink.Role = credit.Role;
                    _movieStaffRepository.Update(existingLink);
                    hasUpdates = true;
                }

                continue;
            }

            linksToAdd.Add(new Movie_Staff
            {
                MovieId = movieId,
                Staff_Id = staff.Staff_Id,
                Role = credit.Role
            });
        }

        if (linksToAdd.Count > 0)
        {
            await _movieStaffRepository.AddRangeAsync(linksToAdd, cancellationToken);
            hasUpdates = true;
        }

        if (hasUpdates)
        {
            await _unitOfWork.CompleteAsync(cancellationToken);
        }
    }

    private async Task<List<TmdbMovieSummaryDto>> CollectMoviesAsync(
        Func<int, CancellationToken, Task<TmdbPagedMovieResponse?>> pageFetcher,
        int take,
        CancellationToken cancellationToken)
    {
        var results = new List<TmdbMovieSummaryDto>();
        var currentPage = 1;

        while (results.Count < take)
        {
            var response = await pageFetcher(currentPage, cancellationToken);
            if (response?.Results is null || response.Results.Count == 0)
            {
                break;
            }

            results.AddRange(response.Results);

            if (currentPage >= response.TotalPages)
            {
                break;
            }

            currentPage++;
        }

        return results.Take(take).ToList();
    }

    private static IEnumerable<TmdbMovieSummaryDto> ApplyPostSearchFilters(IEnumerable<TmdbMovieSummaryDto> source, MovieSpecParams parameters)
    {
        var query = source;

        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search.Trim();
            query = query.Where(x => x.Title?.Contains(search, StringComparison.OrdinalIgnoreCase) == true);
        }

        if (!string.IsNullOrWhiteSpace(parameters.Language))
        {
            var language = parameters.Language.Trim();
            query = query.Where(x => string.Equals(x.OriginalLanguage, language, StringComparison.OrdinalIgnoreCase));
        }

        if (parameters.MinRating.HasValue)
        {
            query = query.Where(x => (x.VoteAverage ?? 0) >= parameters.MinRating.Value);
        }

        if (parameters.MaxRating.HasValue)
        {
            query = query.Where(x => (x.VoteAverage ?? 0) <= parameters.MaxRating.Value);
        }

        if (parameters.Year.HasValue)
        {
            query = query.Where(x => ParseDate(x.ReleaseDate)?.Year == parameters.Year.Value);
        }

        if (parameters.GenreId.HasValue)
        {
            query = query.Where(x => x.GenreIds.Contains(parameters.GenreId.Value));
        }

        return query;
    }

    private static List<StaffCreditRecord> BuildRelevantStaffCredits(TmdbMovieCreditsResponse credits)
    {
        var byTmdbId = new Dictionary<int, StaffCreditRecord>();

        foreach (var cast in credits.Cast.Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Name)))
        {
            MergeCredit(byTmdbId, new StaffCreditRecord(
                cast.Id,
                cast.Name!.Trim(),
                cast.KnownForDepartment?.Trim() ?? "Acting",
                string.IsNullOrWhiteSpace(cast.Character) ? "Actor" : cast.Character.Trim(),
                cast.Gender,
                cast.ProfilePath));
        }

        foreach (var crew in credits.Crew.Where(x =>
                     x.Id > 0 &&
                     !string.IsNullOrWhiteSpace(x.Name) &&
                     string.Equals(x.Job, "Director", StringComparison.OrdinalIgnoreCase)))
        {
            MergeCredit(byTmdbId, new StaffCreditRecord(
                crew.Id,
                crew.Name!.Trim(),
                crew.Department?.Trim() ?? "Directing",
                "Director",
                crew.Gender,
                crew.ProfilePath));
        }

        return byTmdbId.Values.ToList();
    }

    private static void MergeCredit(IDictionary<int, StaffCreditRecord> map, StaffCreditRecord incoming)
    {
        if (!map.TryGetValue(incoming.TmdbId, out var existing))
        {
            map[incoming.TmdbId] = incoming;
            return;
        }

        var mergedRole = MergeRoles(existing.Role, incoming.Role);

        map[incoming.TmdbId] = existing with
        {
            Department = string.IsNullOrWhiteSpace(existing.Department) ? incoming.Department : existing.Department,
            Role = mergedRole,
            Gender = existing.Gender ?? incoming.Gender,
            ProfilePath = string.IsNullOrWhiteSpace(existing.ProfilePath) ? incoming.ProfilePath : existing.ProfilePath
        };
    }

    private static string MergeRoles(string? currentRole, string? newRole)
    {
        var roles = new[] { currentRole, newRole }
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return roles.Count == 0 ? "Actor" : string.Join(" | ", roles);
    }

    private bool ApplyStaffMetadata(Staff staff, string? department, int? gender, string? profilePath)
    {
        var changed = false;

        if (!string.IsNullOrWhiteSpace(department) && !string.Equals(staff.Department, department, StringComparison.Ordinal))
        {
            staff.Department = department;
            changed = true;
        }

        var mappedGender = MapGender(gender);
        if (!string.IsNullOrWhiteSpace(mappedGender) && !string.Equals(staff.Gender, mappedGender, StringComparison.Ordinal))
        {
            staff.Gender = mappedGender;
            changed = true;
        }

        var mappedProfile = BuildImageUrl(profilePath, "w185");
        if (!string.IsNullOrWhiteSpace(mappedProfile) && !string.Equals(staff.Profile_Path, mappedProfile, StringComparison.Ordinal))
        {
            staff.Profile_Path = mappedProfile;
            changed = true;
        }

        return changed;
    }

    private static string? MapGender(int? gender)
    {
        return gender switch
        {
            1 => "Female",
            2 => "Male",
            3 => "NonBinary",
            _ => null
        };
    }

    private async Task<Dictionary<int, string>> GetLocalGenreMapAsync(CancellationToken cancellationToken)
    {
        var localGenres = await _movieGenreRepository.ListAllAsync(cancellationToken);
        return localGenres
            .Where(x => x.TMDB_Id.HasValue)
            .GroupBy(x => x.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First().Name);
    }

    private async Task<Dictionary<int, MovieGenre>> EnsureGenresExistAsync(IEnumerable<TmdbGenreDto> tmdbGenres, CancellationToken cancellationToken)
    {
        var localGenres = await _movieGenreRepository.ListAllAsync(cancellationToken);

        var byTmdbId = localGenres
            .Where(x => x.TMDB_Id.HasValue)
            .GroupBy(x => x.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First());

        var byName = localGenres
            .GroupBy(x => x.Name.Trim().ToLowerInvariant())
            .ToDictionary(x => x.Key, x => x.First());

        var genresToAdd = new List<MovieGenre>();
        var hasUpdates = false;

        foreach (var tmdbGenre in tmdbGenres.Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Name)))
        {
            if (byTmdbId.ContainsKey(tmdbGenre.Id))
            {
                continue;
            }

            var normalizedName = tmdbGenre.Name.Trim().ToLowerInvariant();
            if (byName.TryGetValue(normalizedName, out var existingByName) && !existingByName.TMDB_Id.HasValue)
            {
                existingByName.TMDB_Id = tmdbGenre.Id;
                _movieGenreRepository.Update(existingByName);
                byTmdbId[tmdbGenre.Id] = existingByName;
                hasUpdates = true;
                continue;
            }

            var newGenre = new MovieGenre
            {
                Name = tmdbGenre.Name.Trim(),
                TMDB_Id = tmdbGenre.Id
            };

            genresToAdd.Add(newGenre);
            byName[normalizedName] = newGenre;
            byTmdbId[tmdbGenre.Id] = newGenre;
        }

        if (genresToAdd.Count > 0)
        {
            await _movieGenreRepository.AddRangeAsync(genresToAdd, cancellationToken);
            hasUpdates = true;
        }

        if (hasUpdates)
        {
            await _unitOfWork.CompleteAsync(cancellationToken);

            localGenres = await _movieGenreRepository.ListAllAsync(cancellationToken);
            byTmdbId = localGenres
                .Where(x => x.TMDB_Id.HasValue)
                .GroupBy(x => x.TMDB_Id!.Value)
                .ToDictionary(x => x.Key, x => x.First());
        }

        return byTmdbId;
    }

    private async Task<Dictionary<int, int>> BuildLocalMovieIdMapAsync(IEnumerable<int> tmdbIds, CancellationToken cancellationToken)
    {
        var ids = tmdbIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<int, int>();
        }

        var localMovies = await _movieRepository.ListAsync(new MoviesByTmdbIdsSpecification(ids), cancellationToken);

        return localMovies
            .Where(x => x.TMDB_Id.HasValue)
            .GroupBy(x => x.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First().MovieId);
    }

    private async Task<Result<Movie>> EnsureLocalMovieAsync(int tmdbId, bool syncCredits, CancellationToken cancellationToken)
    {
        var localMovie = await _movieRepository.GetEntityWithSpecAsync(new MovieDetailsByTmdbIdSpecification(tmdbId), cancellationToken);
        if (localMovie is not null)
        {
            return Result.Success(localMovie);
        }

        var tmdbDetails = await _tmdbService.GetMovieDetailsAsync(tmdbId, cancellationToken);
        if (tmdbDetails is null || string.IsNullOrWhiteSpace(tmdbDetails.Title))
        {
            return Result.Failure<Movie>(MovieError.NotFound);
        }

        var genreEntitiesByTmdbId = await EnsureGenresExistAsync(tmdbDetails.Genres, cancellationToken);

        var movie = new Movie
        {
            TMDB_Id = tmdbDetails.Id,
            IMDB_Id = tmdbDetails.ImdbId,
            Title = tmdbDetails.Title.Trim(),
            Overview = tmdbDetails.Overview,
            Runtime = tmdbDetails.Runtime,
            Popularity = tmdbDetails.Popularity,
            Poster_Url = BuildImageUrl(tmdbDetails.PosterPath, "w500"),
            Backdrop_Url = BuildImageUrl(tmdbDetails.BackdropPath, "w780"),
            Language = tmdbDetails.OriginalLanguage,
            Release_Date = ParseDate(tmdbDetails.ReleaseDate),
            TMDB_Rating = tmdbDetails.VoteAverage,
            TMDB_VoteCount = tmdbDetails.VoteCount,
            MovieGenres = tmdbDetails.Genres
                .Where(x => genreEntitiesByTmdbId.ContainsKey(x.Id))
                .Select(x => new Movie_MovieGenre
                {
                    GenreId = genreEntitiesByTmdbId[x.Id].GenreId,
                    CreatedAt = DateTime.UtcNow
                })
                .ToList()
        };

        await _movieRepository.AddAsync(movie, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);

        if (syncCredits)
        {
            var credits = await _tmdbService.GetMovieCreditsAsync(tmdbId, cancellationToken);
            if (credits is not null)
            {
                var staffByTmdbId = await EnsureStaffMembersExistAsync(credits, cancellationToken);
                await UpsertMovieStaffLinksAsync(movie.MovieId, credits, staffByTmdbId, cancellationToken);
            }
        }

        localMovie = await _movieRepository.GetEntityWithSpecAsync(new MovieDetailsByTmdbIdSpecification(tmdbId), cancellationToken);
        return localMovie is not null ? Result.Success(localMovie) : Result.Success(movie);
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

        return new MovieUserStatusDto(
            like is not null,
            watchlist is not null,
            rate?.Stars);
    }

    private async Task<MovieRatingSummaryDto> BuildRatingSummaryAsync(
        int? localMovieId,
        double? fallbackAverage,
        int? fallbackCount,
        CancellationToken cancellationToken)
    {
        if (!localMovieId.HasValue)
        {
            return new MovieRatingSummaryDto(fallbackAverage, fallbackCount ?? 0);
        }

        var rates = await _userMovieRateRepository.ListAsync(
            new UserMovieRatesByMovieIdSpecification(localMovieId.Value),
            cancellationToken);

        if (rates.Count == 0)
        {
            return new MovieRatingSummaryDto(fallbackAverage, fallbackCount ?? 0);
        }

        var average = Math.Round(rates.Average(x => x.Stars), 2, MidpointRounding.AwayFromZero);
        return new MovieRatingSummaryDto(average, rates.Count);
    }

    private async Task<IEnumerable<MovieListItemDto>> MapSimilarMoviesAsync(
        TmdbPagedMovieResponse? tmdbSimilar,
        CancellationToken cancellationToken)
    {
        if (tmdbSimilar?.Results is null || tmdbSimilar.Results.Count == 0)
        {
            return Enumerable.Empty<MovieListItemDto>();
        }

        var genreMap = await GetLocalGenreMapAsync(cancellationToken);
        var localMovieIdMap = await BuildLocalMovieIdMapAsync(tmdbSimilar.Results.Select(x => x.Id), cancellationToken);

        return tmdbSimilar.Results
            .Take(DefaultTake)
            .Select(x => MapLiveMovie(x, genreMap, localMovieIdMap))
            .ToList();
    }

    private static IEnumerable<string> ExtractGenreNames(Movie? localMovie, TmdbMovieDetailsResponse? tmdbDetails)
    {
        if (tmdbDetails?.Genres.Count > 0)
        {
            return tmdbDetails.Genres
                .Select(x => x.Name)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToList();
        }

        return localMovie?.MovieGenres
            .Select(x => x.Genre.Name)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct()
            .ToList() ?? Enumerable.Empty<string>();
    }

    private static IEnumerable<MovieStaffCreditDto> MapCastCredits(Movie? localMovie, TmdbMovieCreditsResponse? tmdbCredits)
    {
        var localStaffByTmdbId = localMovie?.MovieStaffs
            .Where(x => x.Staff.TMDB_Id.HasValue)
            .GroupBy(x => x.Staff.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First().Staff) ?? new Dictionary<int, Staff>();

        if (tmdbCredits?.Cast.Count > 0)
        {
            return tmdbCredits.Cast
                .Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Name))
                .Take(15)
                .Select(x => new MovieStaffCreditDto(
                    localStaffByTmdbId.TryGetValue(x.Id, out var localStaff) ? localStaff.Staff_Id : null,
                    x.Id,
                    x.Name!.Trim(),
                    x.KnownForDepartment,
                    x.Character,
                    BuildImageUrl(x.ProfilePath, "w185")))
                .DistinctBy(x => x.TmdbId)
                .ToList();
        }

        return (localMovie?.MovieStaffs ?? Enumerable.Empty<Movie_Staff>())
            .Where(x => x.Staff.TMDB_Id.HasValue)
            .Where(x => !IsCrewRole(x.Role))
            .Select(x => new MovieStaffCreditDto(
                x.Staff.Staff_Id,
                x.Staff.TMDB_Id!.Value,
                x.Staff.Name,
                x.Staff.Department,
                x.Role,
                x.Staff.Profile_Path))
            .DistinctBy(x => x.TmdbId)
            .Take(15)
            .ToList();
    }

    private static IEnumerable<MovieStaffCreditDto> MapCrewCredits(Movie? localMovie, TmdbMovieCreditsResponse? tmdbCredits)
    {
        var localStaffByTmdbId = localMovie?.MovieStaffs
            .Where(x => x.Staff.TMDB_Id.HasValue)
            .GroupBy(x => x.Staff.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First().Staff) ?? new Dictionary<int, Staff>();

        if (tmdbCredits?.Crew.Count > 0)
        {
            return tmdbCredits.Crew
                .Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Name) && IsCrewRole(x.Job))
                .Take(10)
                .Select(x => new MovieStaffCreditDto(
                    localStaffByTmdbId.TryGetValue(x.Id, out var localStaff) ? localStaff.Staff_Id : null,
                    x.Id,
                    x.Name!.Trim(),
                    x.Department,
                    x.Job,
                    BuildImageUrl(x.ProfilePath, "w185")))
                .DistinctBy(x => x.TmdbId)
                .ToList();
        }

        return (localMovie?.MovieStaffs ?? Enumerable.Empty<Movie_Staff>())
            .Where(x => x.Staff.TMDB_Id.HasValue)
            .Where(x => IsCrewRole(x.Role))
            .Select(x => new MovieStaffCreditDto(
                x.Staff.Staff_Id,
                x.Staff.TMDB_Id!.Value,
                x.Staff.Name,
                x.Staff.Department,
                x.Role,
                x.Staff.Profile_Path))
            .DistinctBy(x => x.TmdbId)
            .Take(10)
            .ToList();
    }

    private static string? ResolveTrailerUrl(TmdbMovieVideosResponse? videos)
    {
        var trailer = videos?.Results
            .Where(x =>
                !string.IsNullOrWhiteSpace(x.Key) &&
                string.Equals(x.Site, "YouTube", StringComparison.OrdinalIgnoreCase) &&
                (string.Equals(x.Type, "Trailer", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(x.Type, "Teaser", StringComparison.OrdinalIgnoreCase)))
            .OrderByDescending(x => x.Official == true)
            .ThenByDescending(x => string.Equals(x.Type, "Trailer", StringComparison.OrdinalIgnoreCase))
            .FirstOrDefault();

        return trailer is null ? null : $"https://www.youtube.com/watch?v={trailer.Key}";
    }

    private static MovieWatchProvidersDto? MapWatchProviders(TmdbMovieWatchProvidersResponse? providers)
    {
        if (providers?.Results is null || providers.Results.Count == 0)
        {
            return null;
        }

        TmdbWatchProviderRegionDto? selectedRegion = null;
        string? countryCode = null;

        if (providers.Results.TryGetValue("US", out var usRegion) && HasAnyProviders(usRegion))
        {
            selectedRegion = usRegion;
            countryCode = "US";
        }
        else
        {
            var firstRegion = providers.Results.FirstOrDefault(x => HasAnyProviders(x.Value));
            if (!string.IsNullOrWhiteSpace(firstRegion.Key))
            {
                selectedRegion = firstRegion.Value;
                countryCode = firstRegion.Key;
            }
        }

        if (selectedRegion is null || string.IsNullOrWhiteSpace(countryCode))
        {
            return null;
        }

        return new MovieWatchProvidersDto(
            countryCode,
            selectedRegion.Link,
            selectedRegion.Flatrate
                .OrderBy(x => x.DisplayPriority)
                .Select(MapWatchProvider)
                .ToList(),
            selectedRegion.Rent
                .OrderBy(x => x.DisplayPriority)
                .Select(MapWatchProvider)
                .ToList(),
            selectedRegion.Buy
                .OrderBy(x => x.DisplayPriority)
                .Select(MapWatchProvider)
                .ToList());
    }

    private static MovieWatchProviderItemDto MapWatchProvider(TmdbWatchProviderDto provider)
    {
        return new MovieWatchProviderItemDto(
            provider.ProviderId,
            provider.ProviderName ?? string.Empty,
            BuildImageUrl(provider.LogoPath, "w185"),
            provider.DisplayPriority);
    }

    private static bool HasAnyProviders(TmdbWatchProviderRegionDto region)
    {
        return region.Flatrate.Count > 0 || region.Rent.Count > 0 || region.Buy.Count > 0;
    }

    private static bool IsCrewRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return false;
        }

        var value = role.Trim();
        return value.Contains("Director", StringComparison.OrdinalIgnoreCase)
               || value.Contains("Writer", StringComparison.OrdinalIgnoreCase)
               || value.Contains("Producer", StringComparison.OrdinalIgnoreCase)
               || value.Contains("Screenplay", StringComparison.OrdinalIgnoreCase)
               || value.Contains("Cinematography", StringComparison.OrdinalIgnoreCase)
               || value.Contains("Composer", StringComparison.OrdinalIgnoreCase);
    }

    private static IEnumerable<StaffMovieCreditDto> BuildStaffMovieCredits(
        Staff? localStaff,
        TmdbPersonMovieCreditsResponse? personCredits)
    {
        var credits = new Dictionary<int, StaffMovieCreditDto>();

        if (localStaff is not null)
        {
            foreach (var item in localStaff.MovieStaffs.Where(x => x.Movie.TMDB_Id.HasValue))
            {
                var tmdbMovieId = item.Movie.TMDB_Id!.Value;
                credits[tmdbMovieId] = new StaffMovieCreditDto(
                    item.Movie.MovieId,
                    item.Movie.TMDB_Id,
                    item.Movie.Title,
                    item.Movie.Poster_Url,
                    item.Movie.Release_Date,
                    item.Role,
                    item.Movie.TMDB_Rating);
            }
        }

        if (personCredits is not null)
        {
            foreach (var cast in personCredits.Cast.Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Title)))
            {
                if (!credits.ContainsKey(cast.Id))
                {
                    credits[cast.Id] = new StaffMovieCreditDto(
                        null,
                        cast.Id,
                        cast.Title!,
                        BuildImageUrl(cast.PosterPath, "w500"),
                        ParseDate(cast.ReleaseDate),
                        cast.Character,
                        cast.VoteAverage);
                }
            }

            foreach (var crew in personCredits.Crew.Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Title)))
            {
                if (!credits.ContainsKey(crew.Id))
                {
                    credits[crew.Id] = new StaffMovieCreditDto(
                        null,
                        crew.Id,
                        crew.Title!,
                        BuildImageUrl(crew.PosterPath, "w500"),
                        ParseDate(crew.ReleaseDate),
                        crew.Job,
                        crew.VoteAverage);
                }
            }
        }

        return credits.Values
            .OrderByDescending(x => x.ReleaseDate ?? DateTime.MinValue)
            .ThenByDescending(x => x.TmdbRating ?? 0)
            .Take(20)
            .ToList();
    }

    private static MovieListItemDto MapLiveMovie(
        TmdbMovieSummaryDto movie,
        IReadOnlyDictionary<int, string> genreMap,
        IReadOnlyDictionary<int, int> localMovieIdMap)
    {
        var genreNames = movie.GenreIds
            .Where(genreMap.ContainsKey)
            .Select(genreId => genreMap[genreId])
            .Distinct()
            .ToList();

        return new MovieListItemDto(
            localMovieIdMap.TryGetValue(movie.Id, out var localMovieId) ? localMovieId : 0,
            movie.Id,
            movie.Title ?? string.Empty,
            BuildImageUrl(movie.PosterPath, "w500"),
            BuildImageUrl(movie.BackdropPath, "w780"),
            ParseDate(movie.ReleaseDate),
            movie.OriginalLanguage,
            null,
            movie.Popularity,
            movie.VoteAverage,
            movie.VoteCount,
            genreNames,
            Enumerable.Empty<string>());
    }

    private static MovieListItemDto MapLocalMovieToListItem(Movie movie)
    {
        var genres = movie.MovieGenres
            .Select(x => x.Genre.Name)
            .Distinct()
            .ToList();

        return new MovieListItemDto(
            movie.MovieId,
            movie.TMDB_Id,
            movie.Title,
            movie.Poster_Url,
            movie.Backdrop_Url,
            movie.Release_Date,
            movie.Language,
            movie.Mpa_Certification,
            movie.Popularity,
            movie.TMDB_Rating,
            movie.TMDB_VoteCount,
            genres,
            Enumerable.Empty<string>());
    }

    private static string? BuildImageUrl(string? imagePath, string size)
    {
        if (string.IsNullOrWhiteSpace(imagePath))
        {
            return null;
        }

        return $"https://image.tmdb.org/t/p/{size}{imagePath}";
    }

    private static DateTime? ParseDate(string? value)
    {
        return DateTime.TryParse(value, out var parsedDate) ? parsedDate : null;
    }

    private sealed record StaffCreditRecord(
        int TmdbId,
        string Name,
        string? Department,
        string? Role,
        int? Gender,
        string? ProfilePath);
}
