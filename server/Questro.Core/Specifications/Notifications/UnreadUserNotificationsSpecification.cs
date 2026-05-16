using Questro.Core.Entities.Notifications;

namespace Questro.Core.Specifications.Notifications;


public class UnreadUserNotificationsSpecification : BaseSpecification<UserNotification>
{
    public UnreadUserNotificationsSpecification(long userId)
        : base(un => un.UserId == userId && !un.IsRead)
    {
    }
}
