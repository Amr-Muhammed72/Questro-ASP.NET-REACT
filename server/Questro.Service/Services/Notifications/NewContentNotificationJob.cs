using Questro.Core.Entities.Notifications;
using Questro.Service.Abstractions.Games;
using Questro.Service.Abstractions.Movies;
using Questro.Service.Abstractions.Notifications;

namespace Questro.Service.Services.Notifications;

public class NewContentNotificationJob
{
    private readonly IMovieCatalogService _movieCatalogService;
    private readonly IGameCatalogServices _gameCatalogService;
    private readonly INotificationService _notificationService;

    public NewContentNotificationJob(
        IMovieCatalogService movieCatalogService,
        IGameCatalogServices gameCatalogService,
        INotificationService notificationService)
    {
        _movieCatalogService = movieCatalogService;
        _gameCatalogService = gameCatalogService;
        _notificationService = notificationService;
    }

    public async Task ExecuteAsync()
    {
        var cutoff = DateTime.UtcNow.AddDays(-3);

        // Check TMDB for recently added movies
        var moviesResult = await _movieCatalogService.GetRecentlyAddedAsync(20);
        if (moviesResult.IsSuccess && moviesResult.Value is not null)
        {
            var newMovies = moviesResult.Value
                .Where(m => m.ReleaseDate.HasValue && m.ReleaseDate.Value >= cutoff)
                .ToList();

            foreach (var movie in newMovies)
            {
                await _notificationService.CreateNotificationForAllUsersAsync(
                    "New Movie Added",
                    $"{movie.Title} is now available to track!",
                    NotificationType.NewMovie,
                    movie.TmdbId, // Routes the user to /movies/{id}
                    movie.Title,   // Appears separated in frontend
                    movie.PosterUrl); // Mapped to our new ImageUrl property
            }
        }

        // Check RAWG for recently added games
        var gamesResult = await _gameCatalogService.GetRecentlyAddedAsync(20);
        if (gamesResult.IsSuccess && gamesResult.Value?.Data is not null)
        {
            var newGames = gamesResult.Value.Data
                .Where(g => g.ReleaseDate.HasValue && g.ReleaseDate.Value >= cutoff)
                .ToList();

            foreach (var game in newGames)
            {
                await _notificationService.CreateNotificationForAllUsersAsync(
                    "New Game Added",
                    $"{game.Title} is now available to track!",
                    NotificationType.NewGame,
                    game.RawgId, // Routes the user to /games/{id}
                    game.Title,  // Appears separated in frontend
                    game.PosterUrl); // Mapped to our new ImageUrl property
            }
        }
    }
}
