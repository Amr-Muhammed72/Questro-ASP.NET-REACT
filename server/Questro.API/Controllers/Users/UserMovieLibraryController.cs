using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Users;

namespace Questro.API.Controllers.Users;

[Route("api/users/{userId:long}/movies")]
public class UserMovieLibraryController : ApiControllerBase
{
    private readonly IUserMovieLibraryService _movieLibraryService;

    public UserMovieLibraryController(IUserMovieLibraryService movieLibraryService)
    {
        _movieLibraryService = movieLibraryService;
    }

    [HttpGet("watchlist")]
    public async Task<IActionResult> GetWatchlist(
        [FromRoute] long userId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _movieLibraryService.GetWatchlistAsync(userId, currentUserId, pageIndex, pageSize, cancellationToken);
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
        var result = await _movieLibraryService.GetLikedAsync(userId, currentUserId, pageIndex, pageSize, cancellationToken);
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
        var result = await _movieLibraryService.GetRatedAsync(userId, currentUserId, pageIndex, pageSize, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("watched")]
    public async Task<IActionResult> GetWatched(
        [FromRoute] long userId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _movieLibraryService.GetWatchedAsync(userId, currentUserId, pageIndex, pageSize, cancellationToken);
        return HandleResult(result);
    }
}
