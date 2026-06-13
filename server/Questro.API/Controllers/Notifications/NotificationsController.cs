using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Notifications;

namespace Questro.API.Controllers.Notifications;

[Route("api/notifications")]
[Authorize]
public class NotificationsController : ApiControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _notificationService.GetUserNotificationsAsync(userId.Value, pageIndex, pageSize, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{notificationId:int}/read")]
    public async Task<IActionResult> MarkAsRead([FromRoute] int notificationId, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _notificationService.MarkAsReadAsync(userId.Value, notificationId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _notificationService.MarkAllAsReadAsync(userId.Value, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _notificationService.GetUnreadCountAsync(userId.Value, cancellationToken);
        return HandleResult(result);
    }
}
