using Microsoft.EntityFrameworkCore;
using Questro.Core.Entities.Notifications;
using Questro.Infrastructure.Data;
using Questro.Service.Abstractions.Notifications;

namespace Questro.Service.Services.Notifications;

public class NewContentNotificationJob
{
    private readonly ApplicationDbContext _dbContext;
    private readonly INotificationService _notificationService;

    public NewContentNotificationJob(ApplicationDbContext dbContext, INotificationService notificationService)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
    }

    public async Task ExecuteAsync()
    {
        var since = DateTime.UtcNow.AddHours(-24);

        // Check for new movies added in the last 24 hours
        var newMoviesCount = await _dbContext.Movies
            .CountAsync(m => m.Release_Date.HasValue && m.Release_Date.Value >= since);

        if (newMoviesCount > 0)
        {
            await _notificationService.CreateNotificationForAllUsersAsync(
                "New Movies Available!",
                $"{newMoviesCount} new movie(s) have been added to the catalog. Check them out!",
                NotificationType.NewMovie,
                null);
        }

        // Check for new games added in the last 24 hours
        var newGamesCount = await _dbContext.Games
            .CountAsync(g => g.Release_Date.HasValue && g.Release_Date.Value >= since);

        if (newGamesCount > 0)
        {
            await _notificationService.CreateNotificationForAllUsersAsync(
                "New Games Available!",
                $"{newGamesCount} new game(s) have been added to the catalog. Check them out!",
                NotificationType.NewGame,
                null);
        }
    }
}
