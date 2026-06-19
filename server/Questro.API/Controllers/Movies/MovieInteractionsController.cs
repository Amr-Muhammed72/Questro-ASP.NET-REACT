using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Movies;
using Questro.Shared.Contracts.Movies;
using System.Security.Claims;

namespace Questro.API.Controllers.Movies;

[ApiController]
[Route("api/movie-interactions")]
[Authorize]
public class MovieInteractionsController : ControllerBase
{
    private readonly IMovieInteractionService _movieInteractionService;

    public MovieInteractionsController(IMovieInteractionService movieInteractionService)
    {
        _movieInteractionService = movieInteractionService;
    }

    [HttpPost("{movieId:int}/like")]
    public async Task<IActionResult> ToggleLike([FromRoute] int movieId, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieInteractionService.ToggleLikeAsync(movieId, userId.Value, cancellationToken);
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

    [HttpPost("{movieId:int}/rate")]
    public async Task<IActionResult> SetRating(
        [FromRoute] int movieId,
        [FromBody] SetMovieRatingRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieInteractionService.SetRatingAsync(movieId, userId.Value, request.Stars, cancellationToken);
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

    [HttpPost("{movieId:int}/watchlist")]
    public async Task<IActionResult> ToggleWatchlist([FromRoute] int movieId, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieInteractionService.ToggleWatchlistAsync(movieId, userId.Value, cancellationToken);
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

    [HttpPost("{movieId:int}/watched")]
    public async Task<IActionResult> ToggleWatched([FromRoute] int movieId, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieInteractionService.ToggleWatchedAsync(movieId, userId.Value, cancellationToken);
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
