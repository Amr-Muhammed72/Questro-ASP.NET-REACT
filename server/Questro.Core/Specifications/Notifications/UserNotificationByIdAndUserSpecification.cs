using Questro.Core.Entities.Notifications;

namespace Questro.Core.Specifications.Notifications;


public class UserNotificationByIdAndUserSpecification : BaseSpecification<UserNotification>
{
    public UserNotificationByIdAndUserSpecification(int notificationId, long userId)
        : base(un => un.Id == notificationId && un.UserId == userId)
    {
    }
}
