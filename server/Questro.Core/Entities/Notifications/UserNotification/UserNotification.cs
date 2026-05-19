using Questro.Core.Entities.UserManagement;

namespace Questro.Core.Entities.Notifications;

public class UserNotification
{
    public int Id { get; set; }
    public long UserId { get; set; }
    public int NotificationId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }

    public virtual ApplicationUser User { get; set; } = null!;
    public virtual Notification Notification { get; set; } = null!;
}
