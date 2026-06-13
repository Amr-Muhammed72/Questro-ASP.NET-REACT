using static Questro.Shared.ErrorHandle.Error;

namespace Questro.Shared.ErrorHandle.Notifications;

public static class NotificationError
{
    public static readonly Errors NotificationNotFound =
        new("Notification.NotFound", "Notification was not found.", 404);

    public static readonly Errors Unauthorized =
        new("Notification.Unauthorized", "You are not authorized to access this notification.", 403);
}
