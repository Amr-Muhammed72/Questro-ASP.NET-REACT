using Microsoft.AspNetCore.Identity;
using Questro.Core.Entities.Notifications;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Specifications.Auth;
using Questro.Core.Specifications.Notifications;
using Questro.Infrastructure.Abstractions;
using Questro.Service.Abstractions.Notifications;
using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Notifications;
using Questro.Shared.ErrorHandle.Notifications;
using Questro.Shared.Result;

namespace Questro.Service.Services.Notifications;

public class NotificationService : INotificationService
{
    private readonly IGenericRepository<UserNotification> _userNotificationRepo;
    private readonly IGenericRepository<Notification> _notificationRepo;
    private readonly IGenericRepository<ApplicationUser> _userRepo;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(
        IGenericRepository<UserNotification> userNotificationRepo,
        IGenericRepository<Notification> notificationRepo,
        IGenericRepository<ApplicationUser> userRepo,
        IUnitOfWork unitOfWork)
    {
        _userNotificationRepo = userNotificationRepo;
        _notificationRepo = notificationRepo;
        _userRepo = userRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PagedResponse<NotificationDto>>> GetUserNotificationsAsync(
        long userId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var safePageIndex = pageIndex < 1 ? 1 : pageIndex;
        var safePageSize = pageSize < 1 ? 20 : pageSize;

        var spec = new UserNotificationsByUserSpecification(userId, safePageIndex, safePageSize);
        var countSpec = new UserNotificationsCountByUserSpecification(userId);

        var items = await _userNotificationRepo.ListAsync(spec, cancellationToken);
        var totalCount = await _userNotificationRepo.CountAsync(countSpec, cancellationToken);

        var dtos = items.Select(un => new NotificationDto
        {
            Id = un.Id,
            Title = un.Notification.Title,
            Body = un.Notification.Body,
            Type = un.Notification.Type.ToString(),
            ReferenceId = un.Notification.ReferenceId,
            IsRead = un.IsRead,
            CreatedAt = un.Notification.CreatedAt,
            ReadAt = un.ReadAt
        }).ToList();

        var response = new PagedResponse<NotificationDto>
        {
            Data = dtos,
            PageNumber = safePageIndex,
            PageSize = safePageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)safePageSize)
        };

        return Result.Success(response);
    }

    public async Task<Result<bool>> MarkAsReadAsync(long userId, int notificationId, CancellationToken cancellationToken = default)
    {
        var spec = new UserNotificationByIdAndUserSpecification(notificationId, userId);
        var userNotification = await _userNotificationRepo.GetEntityWithSpecAsync(spec, cancellationToken);

        if (userNotification is null)
            return Result.Failure<bool>(NotificationError.NotificationNotFound);

        if (!userNotification.IsRead)
        {
            userNotification.IsRead = true;
            userNotification.ReadAt = DateTime.UtcNow;
            _userNotificationRepo.Update(userNotification);
            await _unitOfWork.CompleteAsync(cancellationToken);
        }

        return Result.Success(true);
    }

    public async Task<Result<bool>> MarkAllAsReadAsync(long userId, CancellationToken cancellationToken = default)
    {
        var spec = new UnreadUserNotificationsSpecification(userId);
        var unread = await _userNotificationRepo.ListAsync(spec, cancellationToken);

        foreach (var un in unread)
        {
            un.IsRead = true;
            un.ReadAt = DateTime.UtcNow;
            _userNotificationRepo.Update(un);
        }

        await _unitOfWork.CompleteAsync(cancellationToken);
        return Result.Success(true);
    }

    public async Task<Result<int>> GetUnreadCountAsync(long userId, CancellationToken cancellationToken = default)
    {
        var spec = new UnreadUserNotificationsSpecification(userId);
        var count = await _userNotificationRepo.CountAsync(spec, cancellationToken);
        return Result.Success(count);
    }

    public async Task CreateNotificationForAllUsersAsync(
        string title, string body, NotificationType type, int? referenceId, CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            Title = title,
            Body = body,
            Type = type,
            ReferenceId = referenceId,
            CreatedAt = DateTime.UtcNow
        };

        await _notificationRepo.AddAsync(notification, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);

        var allUsers = await _userRepo.ListAsync(new AllUsersSpecification(), cancellationToken);

        var userNotifications = allUsers.Select(u => new UserNotification
        {
            UserId = u.Id,
            NotificationId = notification.Id,
            IsRead = false
        });

        await _userNotificationRepo.AddRangeAsync(userNotifications, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);
    }
}
