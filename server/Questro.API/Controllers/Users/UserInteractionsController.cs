using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Questro.Service.Abstractions.Interactions;

namespace Questro.API.Controllers.Users;

[Route("api")]
[ApiController]
[Authorize]
public class UserInteractionsController : ControllerBase
{
    private readonly IUserInteractionService _interactionService;

    public UserInteractionsController(IUserInteractionService interactionService)
    {
        _interactionService = interactionService;
    }

    [HttpGet("movies/{tmdbId}/interaction-status")]
    public async Task<IActionResult> GetMovieInteractionStatus(int tmdbId, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var result = await _interactionService.GetMovieInteractionStatusAsync(userId, tmdbId, cancellationToken);
        if (result.IsFailure)
        {
            return BadRequest(result.Error);
        }

        return Ok(result.Value);
    }

    [HttpGet("games/{rawgId}/interaction-status")]
    public async Task<IActionResult> GetGameInteractionStatus(int rawgId, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var result = await _interactionService.GetGameInteractionStatusAsync(userId, rawgId, cancellationToken);
        if (result.IsFailure)
        {
            return BadRequest(result.Error);
        }

        return Ok(result.Value);
    }
}
