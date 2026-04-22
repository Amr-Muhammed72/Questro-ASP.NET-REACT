using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Movies;
using Questro.Shared.Contracts.Movies;
using System.Security.Claims;

namespace Questro.API.Controllers.Movies;

[ApiController]
[Route("api/movie-reviews")]
public class MovieReviewsController : ControllerBase
{
    private readonly IMovieInteractionService _movieInteractionService;

    public MovieReviewsController(IMovieInteractionService movieInteractionService)
    {
        _movieInteractionService = movieInteractionService;
    }

    [HttpGet("{movieId:int}")]
    public async Task<IActionResult> GetReviews(
        [FromRoute] int movieId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _movieInteractionService.GetMovieReviewsAsync(movieId, pageIndex, pageSize, cancellationToken);
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

    [Authorize]
    [HttpPost("{movieId:int}")]
    public async Task<IActionResult> AddReview(
        [FromRoute] int movieId,
        [FromBody] CreateMovieReviewRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieInteractionService.AddReviewAsync(movieId, userId.Value, request.Body, cancellationToken);
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

    [Authorize]
    [HttpPut("{movieId:int}")]
    public async Task<IActionResult> UpdateReview(
        [FromRoute] int movieId,
        [FromBody] UpdateMovieReviewRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieInteractionService.UpdateReviewAsync(movieId, userId.Value, request.Body, cancellationToken);
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

    [Authorize]
    [HttpDelete("{movieId:int}")]
    public async Task<IActionResult> DeleteReview([FromRoute] int movieId, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieInteractionService.DeleteReviewAsync(movieId, userId.Value, cancellationToken);
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

        return Ok(new { deleted = result.Value });
    }

    private long? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
