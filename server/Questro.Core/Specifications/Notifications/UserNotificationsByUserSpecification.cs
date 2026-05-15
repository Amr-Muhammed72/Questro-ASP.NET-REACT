using Questro.Core.Entities.Notifications;

namespace Questro.Core.Specifications.Notifications;


public class UserNotificationsByUserSpecification : BaseSpecification<UserNotification>
{
    public UserNotificationsByUserSpecification(long userId, int pageIndex, int pageSize)
        : base(un => un.UserId == userId)
    {
        AddInclude(un => un.Notification);
        AddOrderByDescending(un => un.Notification.CreatedAt);

        var safePageIndex = pageIndex < 1 ? 1 : pageIndex;
        var safePageSize = pageSize < 1 ? 20 : pageSize;
        var skip = (safePageIndex - 1) * safePageSize;

        ApplyPaging(skip, safePageSize);
    }
}
