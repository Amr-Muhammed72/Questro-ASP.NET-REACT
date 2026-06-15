namespace Questro.Core.Entities.Notifications;

public class Notification
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public int? ReferenceId { get; set; }
    public string? ReferenceName { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }

    public virtual ICollection<UserNotification> UserNotifications { get; set; } = new HashSet<UserNotification>();
}
