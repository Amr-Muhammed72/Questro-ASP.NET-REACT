using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Questro.Core.Entities.Games;
using Questro.Core.Entities.Movies;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Specifications.Family;
using Questro.Core.Specifications.Games;
using Questro.Core.Specifications.Movies;
using Questro.Infrastructure.Abstractions;
using Questro.Service.Abstractions.RAG;
using Questro.Shared.Contracts.RAG;

namespace Questro.Service.Services.RAG;

public sealed class RagService : IRagService
{
    private readonly IRagApiService _ragApiService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IGenericRepository<ChildRestriction> _restrictionRepo;
    private readonly IGenericRepository<GameGenre> _gameGenreRepo;
    private readonly IGenericRepository<MovieGenre> _movieGenreRepo;
    private readonly IGenericRepository<UserGameRate> _gameRateRepo;
    private readonly IGenericRepository<UserGameWishlist> _gameWishlistRepo;
    private readonly IGenericRepository<UserMovieRate> _movieRateRepo;
    private readonly IGenericRepository<UserMovieWatchlist> _movieWatchlistRepo;
    private readonly IGenericRepository<Game> _gameRepo;
    private readonly ITmdbService _tmdbService;
    private readonly ILogger<RagService> _logger;

    public RagService(
        IRagApiService ragApiService,
        UserManager<ApplicationUser> userManager,
        IGenericRepository<ChildRestriction> restrictionRepo,
        IGenericRepository<GameGenre> gameGenreRepo,
        IGenericRepository<MovieGenre> movieGenreRepo,
        IGenericRepository<UserGameRate> gameRateRepo,
        IGenericRepository<UserGameWishlist> gameWishlistRepo,
        IGenericRepository<UserMovieRate> movieRateRepo,
        IGenericRepository<UserMovieWatchlist> movieWatchlistRepo,
        IGenericRepository<Game> gameRepo,
        ITmdbService tmdbService,
        ILogger<RagService> logger)
    {
        _ragApiService = ragApiService;
        _userManager = userManager;
        _restrictionRepo = restrictionRepo;
        _gameGenreRepo = gameGenreRepo;
        _movieGenreRepo = movieGenreRepo;
        _gameRateRepo = gameRateRepo;
        _gameWishlistRepo = gameWishlistRepo;
        _movieRateRepo = movieRateRepo;
        _movieWatchlistRepo = movieWatchlistRepo;
        _gameRepo = gameRepo;
        _tmdbService = tmdbService;
        _logger = logger;
    }

    public async Task<RagRecommendationResponse> GetRecommendationsAsync(
        string query,
        int k,
        long? userId,
        CancellationToken cancellationToken = default)
    {
        var finalRequest = new RagRecommendationRequest
        {
            Query = query,
            K = Math.Clamp(k, 1, 50),
            AllowAdult = true,
            BlockedGenres = new List<string>(),
            User = null
        };

        if (userId.HasValue)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId.Value.ToString());
                if (user is not null)
                {
                    finalRequest.User = BuildUserProfile(user);

                    // 1. Content restrictions (allow_adult / blocked_genres)
                    if (user.IsChildAccount)
                    {
                        finalRequest.AllowAdult = false;

                        var restrictionSpec = new ChildRestrictionByUserIdSpecification(userId.Value);
                        var restriction = await _restrictionRepo.GetEntityWithSpecAsync(restrictionSpec, cancellationToken);

                        if (restriction is not null)
                        {
                            var blockedGenres = new List<string>();

                            if (restriction.BlockedGameGenreIds.Any())
                            {
                                var gameGenres = await _gameGenreRepo.ListAllAsync(cancellationToken);
                                var gameGenreMap = gameGenres
                                    .Where(x => x.RAWG_Id.HasValue)
                                    .GroupBy(x => x.RAWG_Id!.Value)
                                    .ToDictionary(x => x.Key, x => x.First().Name);

                                var gameBlocked = restriction.BlockedGameGenreIds
                                    .Where(gameGenreMap.ContainsKey)
                                    .Select(id => gameGenreMap[id]);

                                blockedGenres.AddRange(gameBlocked);
                            }

                            if (restriction.BlockedMovieGenreIds.Any())
                            {
                                var movieGenres = await _movieGenreRepo.ListAllAsync(cancellationToken);
                                var movieGenreMap = movieGenres
                                    .Where(x => x.TMDB_Id.HasValue)
                                    .GroupBy(x => x.TMDB_Id!.Value)
                                    .ToDictionary(x => x.Key, x => x.First().Name);

                                var movieBlocked = restriction.BlockedMovieGenreIds
                                    .Where(movieGenreMap.ContainsKey)
                                    .Select(id => movieGenreMap[id]);

                                blockedGenres.AddRange(movieBlocked);
                            }

                            finalRequest.BlockedGenres = blockedGenres.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                        }
                    }

                    // 2. Load and enrich User Ratings/signals
                    await EnrichUserRatingsAsync(finalRequest.User, userId.Value, cancellationToken);

                    _logger.LogDebug(
                        "Enriched RAG request with profile and ratings for userId={UserId}",
                        userId.Value);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to load user profile/ratings for RAG enrichment (userId={UserId}). Proceeding without full profile/restrictions.",
                    userId.Value);
            }
        }

        var response = await _ragApiService.GetRecommendationsAsync(finalRequest, cancellationToken);

        if (response is null)
        {
            _logger.LogWarning("RAG API returned null for query={Query}", query);

            return new RagRecommendationResponse
            {
                Status = "error",
                Query = query,
                Error = "An error occurred while processing your recommendation request. Please try again."
            };
        }

        
        return response;
    }

    private static RagUserProfile BuildUserProfile(ApplicationUser user)
    {
        return new RagUserProfile
        {
            Age = user.Age,
            Gender = user.Gender,
            Profession = user.Profession,
            Country = user.Country,
            MovieGenresFav = user.MovieGenresFav?.Count > 0
                ? string.Join("|", user.MovieGenresFav) : null,
            MovieGenresDisliked = user.MovieGenresDisliked?.Count > 0
                ? string.Join("|", user.MovieGenresDisliked) : null,
            GameGenresFav = user.GameGenresFav?.Count > 0
                ? string.Join("|", user.GameGenresFav) : null,
            GameGenresDisliked = user.GameGenresDisliked?.Count > 0
                ? string.Join("|", user.GameGenresDisliked) : null
        };
    }

    private async Task EnrichUserRatingsAsync(
        RagUserProfile profile,
        long userId,
        CancellationToken cancellationToken)
    {
        var ratings = new List<RagUserRating>();

        // 1. Movie rates
        var movieRateSpec = new UserMovieRatesByUserSpecification(userId, 1, 50);
        var movieRates = await _movieRateRepo.ListReadOnlyAsync(movieRateSpec, cancellationToken);
        foreach (var rate in movieRates)
        {
            ratings.Add(new RagUserRating
            {
                ItemId = $"movie_{rate.Movie.TMDB_Id}",
                Stars = rate.Stars
            });
        }

        // 2. Movie watchlists
        var movieWatchlistSpec = new UserMovieWatchlistByUserSpecification(userId, 1, 50);
        var movieWatchlists = await _movieWatchlistRepo.ListReadOnlyAsync(movieWatchlistSpec, cancellationToken);
        foreach (var watchlist in movieWatchlists)
        {
            ratings.Add(new RagUserRating
            {
                ItemId = $"movie_{watchlist.Movie.TMDB_Id}",
                Stars = null
            });
        }

        // 3. Game rates
        var gameRateSpec = new UserGameRatesByUserSpecification(userId, 1, 50);
        var gameRates = await _gameRateRepo.ListReadOnlyAsync(gameRateSpec, cancellationToken);
        foreach (var rate in gameRates)
        {
            ratings.Add(new RagUserRating
            {
                ItemId = $"game_{rate.Game.RAWG_Id}",
                Stars = rate.Stars
            });
        }

        // 4. Game wishlists
        var gameWishlistSpec = new UserGameWishlistByUserSpecification(userId, 1, 50);
        var gameWishlists = await _gameWishlistRepo.ListReadOnlyAsync(gameWishlistSpec, cancellationToken);
        foreach (var wishlist in gameWishlists)
        {
            ratings.Add(new RagUserRating
            {
                ItemId = $"game_{wishlist.Game.RAWG_Id}",
                Stars = null
            });
        }

        profile.Ratings = ratings;
    }

    private static string? BuildImageUrl(string? imagePath, string size)
    {
        if (string.IsNullOrWhiteSpace(imagePath))
        {
            return null;
        }

        return $"https://image.tmdb.org/t/p/{size}{imagePath}";
    }
}
