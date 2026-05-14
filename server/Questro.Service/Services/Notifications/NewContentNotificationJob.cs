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
            var newMoviesCount = moviesResult.Value
                .Count(m => m.ReleaseDate.HasValue && m.ReleaseDate.Value >= cutoff);

            if (newMoviesCount > 0)
            {
                await _notificationService.CreateNotificationForAllUsersAsync(
                    "New Movies Available!",
                    $"{newMoviesCount} new movie(s) have been released recently. Check them out!",
                    NotificationType.NewMovie,
                    null);
            }
        }

        // Check RAWG for recently added games
        var gamesResult = await _gameCatalogService.GetRecentlyAddedAsync(20);
        if (gamesResult.IsSuccess && gamesResult.Value?.Data is not null)
        {
            var newGamesCount = gamesResult.Value.Data
                .Count(g => g.ReleaseDate.HasValue && g.ReleaseDate.Value >= cutoff);

            if (newGamesCount > 0)
            {
                await _notificationService.CreateNotificationForAllUsersAsync(
                    "New Games Available!",
                    $"{newGamesCount} new game(s) have been released recently. Check them out!",
                    NotificationType.NewGame,
                    null);
            }
        }
    }
}
