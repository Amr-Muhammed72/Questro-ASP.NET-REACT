using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Notifications;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Notifications;

public interface INotificationService
{
    Task<Result<PagedResponse<NotificationDto>>> GetUserNotificationsAsync(long userId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<Result<bool>> MarkAsReadAsync(long userId, int notificationId, CancellationToken cancellationToken = default);
    Task<Result<bool>> MarkAllAsReadAsync(long userId, CancellationToken cancellationToken = default);
    Task<Result<int>> GetUnreadCountAsync(long userId, CancellationToken cancellationToken = default);
    Task CreateNotificationForAllUsersAsync(string title, string body, Core.Entities.Notifications.NotificationType type, int? referenceId, CancellationToken cancellationToken = default);
}
