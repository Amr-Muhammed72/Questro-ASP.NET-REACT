using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Movies;
using Questro.Shared.Contracts.Movies;
using System.Security.Claims;

namespace Questro.API.Controllers.Movies;

[ApiController]
[Route("api/[controller]")]
public class MoviesController : ControllerBase
{
    private readonly IMovieService _movieService;

    public MoviesController(IMovieService movieService)
    {
        _movieService = movieService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMovies([FromQuery] MovieSpecParams specParams, CancellationToken cancellationToken)
    {
        var result = await _movieService.GetMoviesAsync(specParams, cancellationToken);
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

    [HttpGet("recently-added")]
    public async Task<IActionResult> GetRecentlyAdded([FromQuery] int take = 20, CancellationToken cancellationToken = default)
    {
        var result = await _movieService.GetRecentlyAddedAsync(take, cancellationToken);
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

    [HttpGet("trending")]
    public async Task<IActionResult> GetTrending([FromQuery] int take = 20, CancellationToken cancellationToken = default)
    {
        var result = await _movieService.GetTrendingAsync(take, cancellationToken);
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

    [HttpGet("genres")]
    public async Task<IActionResult> GetGenres(CancellationToken cancellationToken = default)
    {
        var result = await _movieService.GetGenresAsync(cancellationToken);
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

    [HttpGet("recommended")]
    public async Task<IActionResult> GetRecommended([FromQuery] int take = 20, CancellationToken cancellationToken = default)
    {
        var result = await _movieService.GetRecommendedAsync(take, cancellationToken);
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
    [HttpGet("recommended-for-me")]
    public async Task<IActionResult> GetRecommendedForMe([FromQuery] int take = 20, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieService.GetRecommendedForMeAsync(userId.Value, take, cancellationToken);
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

    [HttpPost("fetch/{tmdbId:int}")]
    public async Task<IActionResult> FetchByTmdbId([FromRoute] int tmdbId, CancellationToken cancellationToken = default)
    {
        var result = await _movieService.FetchAndSaveMovieByTmdbIdAsync(tmdbId, cancellationToken);
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

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetMovieDetails([FromRoute] int id, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await _movieService.GetMovieDetailsAsync(id, userId, cancellationToken);
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
    [HttpPost("{id:int}/like")]
    public async Task<IActionResult> ToggleLike([FromRoute] int id, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieService.ToggleLikeAsync(id, userId.Value, cancellationToken);
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
    [HttpPost("{id:int}/rate")]
    public async Task<IActionResult> SetRating(
        [FromRoute] int id,
        [FromBody] SetMovieRatingRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieService.SetRatingAsync(id, userId.Value, request.Stars, cancellationToken);
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
    [HttpPost("{id:int}/watchlist")]
    public async Task<IActionResult> ToggleWatchlist([FromRoute] int id, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieService.ToggleWatchlistAsync(id, userId.Value, cancellationToken);
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

    [HttpGet("{id:int}/reviews")]
    public async Task<IActionResult> GetReviews(
        [FromRoute] int id,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _movieService.GetMovieReviewsAsync(id, pageIndex, pageSize, cancellationToken);
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
    [HttpPost("{id:int}/reviews")]
    public async Task<IActionResult> AddReview(
        [FromRoute] int id,
        [FromBody] CreateMovieReviewRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieService.AddReviewAsync(id, userId.Value, request.Body, cancellationToken);
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
    [HttpPut("{id:int}/reviews")]
    public async Task<IActionResult> UpdateReview(
        [FromRoute] int id,
        [FromBody] UpdateMovieReviewRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieService.UpdateReviewAsync(id, userId.Value, request.Body, cancellationToken);
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
    [HttpDelete("{id:int}/reviews")]
    public async Task<IActionResult> DeleteReview([FromRoute] int id, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieService.DeleteReviewAsync(id, userId.Value, cancellationToken);
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

    [Authorize]
    [HttpPost("{id:int}/watched")]
    public async Task<IActionResult> MarkWatched([FromRoute] int id, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var result = await _movieService.MarkWatchedAsync(id, userId.Value, cancellationToken);
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
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? User.FindFirstValue("sub");

        return long.TryParse(userIdValue, out var userId)
            ? userId
            : null;
    }
}