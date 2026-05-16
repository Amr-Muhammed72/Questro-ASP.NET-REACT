using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Social;

namespace Questro.API.Controllers.Social;

[Route("api/users/{userId:long}")]
public class UserNetworkController : ApiControllerBase
{
    private readonly IUserNetworkService _networkService;

    public UserNetworkController(IUserNetworkService networkService)
    {
        _networkService = networkService;
    }

    [Authorize]
    [HttpPost("follow")]
    public async Task<IActionResult> Follow([FromRoute] long userId, CancellationToken cancellationToken = default)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue) return Unauthorized();

        var result = await _networkService.FollowAsync(currentUserId.Value, userId, cancellationToken);
        return HandleResult(result);
    }

    [Authorize]
    [HttpDelete("follow")]
    public async Task<IActionResult> Unfollow([FromRoute] long userId, CancellationToken cancellationToken = default)
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue) return Unauthorized();

        var result = await _networkService.UnfollowAsync(currentUserId.Value, userId, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("followers")]
    public async Task<IActionResult> GetFollowers(
        [FromRoute] long userId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _networkService.GetFollowersAsync(userId, pageIndex, pageSize, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("following")]
    public async Task<IActionResult> GetFollowing(
        [FromRoute] long userId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _networkService.GetFollowingAsync(userId, pageIndex, pageSize, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("follow-stats")]
    public async Task<IActionResult> GetFollowStats([FromRoute] long userId, CancellationToken cancellationToken = default)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _networkService.GetFollowStatsAsync(userId, currentUserId, cancellationToken);
        return HandleResult(result);
    }
}
