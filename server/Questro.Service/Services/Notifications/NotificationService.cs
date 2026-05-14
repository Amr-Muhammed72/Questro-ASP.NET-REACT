using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Questro.Core.Entities.Notifications;
using Questro.Core.Entities.UserManagement;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.Data;
using Questro.Service.Abstractions.Notifications;
using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Notifications;
using Questro.Shared.ErrorHandle.Notifications;
using Questro.Shared.Result;

namespace Questro.Service.Services.Notifications;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(ApplicationDbContext dbContext, IUnitOfWork unitOfWork)
    {
        _dbContext = dbContext;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PagedResponse<NotificationDto>>> GetUserNotificationsAsync(
        long userId, int pageIndex = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var safePageIndex = pageIndex < 1 ? 1 : pageIndex;
        var safePageSize = pageSize < 1 ? 20 : pageSize;
        var skip = (safePageIndex - 1) * safePageSize;

        var query = _dbContext.Set<UserNotification>()
            .Where(un => un.UserId == userId)
            .Include(un => un.Notification)
            .OrderByDescending(un => un.Notification.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip(skip)
            .Take(safePageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

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
        var userNotification = await _dbContext.Set<UserNotification>()
            .FirstOrDefaultAsync(un => un.Id == notificationId && un.UserId == userId, cancellationToken);

        if (userNotification is null)
            return Result.Failure<bool>(NotificationError.NotificationNotFound);

        if (!userNotification.IsRead)
        {
            userNotification.IsRead = true;
            userNotification.ReadAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return Result.Success(true);
    }

    public async Task<Result<bool>> MarkAllAsReadAsync(long userId, CancellationToken cancellationToken = default)
    {
        var unread = await _dbContext.Set<UserNotification>()
            .Where(un => un.UserId == userId && !un.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var un in unread)
        {
            un.IsRead = true;
            un.ReadAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success(true);
    }

    public async Task<Result<int>> GetUnreadCountAsync(long userId, CancellationToken cancellationToken = default)
    {
        var count = await _dbContext.Set<UserNotification>()
            .CountAsync(un => un.UserId == userId && !un.IsRead, cancellationToken);

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

        await _dbContext.Set<Notification>().AddAsync(notification, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var userIds = await _dbContext.Users
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        var userNotifications = userIds.Select(uid => new UserNotification
        {
            UserId = uid,
            NotificationId = notification.Id,
            IsRead = false
        }).ToList();

        await _dbContext.Set<UserNotification>().AddRangeAsync(userNotifications, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
