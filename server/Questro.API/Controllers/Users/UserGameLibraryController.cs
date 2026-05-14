using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Users;

namespace Questro.API.Controllers.Users;

[Route("api/users/{userId:long}/games")]
public class UserGameLibraryController : ApiControllerBase
{
    private readonly IUserGameLibraryService _gameLibraryService;

    public UserGameLibraryController(IUserGameLibraryService gameLibraryService)
    {
        _gameLibraryService = gameLibraryService;
    }

    [HttpGet("wishlist")]
    public async Task<IActionResult> GetWishlist(
        [FromRoute] long userId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _gameLibraryService.GetWishlistAsync(userId, currentUserId, pageIndex, pageSize, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("liked")]
    public async Task<IActionResult> GetLiked(
        [FromRoute] long userId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _gameLibraryService.GetLikedAsync(userId, currentUserId, pageIndex, pageSize, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("rated")]
    public async Task<IActionResult> GetRated(
        [FromRoute] long userId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _gameLibraryService.GetRatedAsync(userId, currentUserId, pageIndex, pageSize, cancellationToken);
        return HandleResult(result);
    }
}
