using Questro.Core.Entities.Notifications;

namespace Questro.Core.Specifications.Notifications;


public class UserNotificationsCountByUserSpecification : BaseSpecification<UserNotification>
{
    public UserNotificationsCountByUserSpecification(long userId)
        : base(un => un.UserId == userId)
    {
    }
}
