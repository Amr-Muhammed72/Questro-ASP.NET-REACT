using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Games;
using Questro.Shared.Contracts.Games;
using System.Security.Claims;

namespace Questro.API.Controllers.Games;

[ApiController]
[Route("api/game-interactions")]
[Authorize]
public class GameInteractionsController : ControllerBase
{
    private readonly IGameInteractionService _gameInteractionService;

    public GameInteractionsController(IGameInteractionService gameInteractionService)
    {
        _gameInteractionService = gameInteractionService;
    }

    [HttpPost("{rawgId:int}/like")]
    public async Task<IActionResult> ToggleLike([FromRoute] int rawgId, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _gameInteractionService.ToggleLikeAsync(rawgId, userId.Value, cancellationToken);
        if (result.IsFailure)
        {
            var errorResponse = new
            {
                code = result.Error.Code,
                en = result.Error.en,
                Details = result.Details
            };

            return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
        }

        return Ok(result.Value);
    }

    [HttpPost("{rawgId:int}/rate")]
    public async Task<IActionResult> SetRating(
        [FromRoute] int rawgId,
        [FromBody] SetGameRatingRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _gameInteractionService.SetRatingAsync(rawgId, userId.Value, request.Stars, cancellationToken);
        if (result.IsFailure)
        {
            var errorResponse = new
            {
                code = result.Error.Code,
                en = result.Error.en,
                Details = result.Details
            };

            return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
        }

        return Ok(result.Value);
    }

    [HttpPost("{rawgId:int}/wishlist")]
    public async Task<IActionResult> ToggleWishlist([FromRoute] int rawgId, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _gameInteractionService.ToggleWishlistAsync(rawgId, userId.Value, cancellationToken);
        if (result.IsFailure)
        {
            var errorResponse = new
            {
                code = result.Error.Code,
                en = result.Error.en,
                Details = result.Details
            };

            return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
        }

        return Ok(result.Value);
    }

  
    private long? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
