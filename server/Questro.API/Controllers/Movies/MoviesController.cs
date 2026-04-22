using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Movies;
using Questro.Shared.Contracts.Movies;
using System.Security.Claims;

namespace Questro.API.Controllers.Movies;

[ApiController]
[Route("api/movies")]
public class MoviesController : ControllerBase
{
    private readonly IMovieCatalogService _movieCatalogService;
    private readonly IMovieDetailsService _movieDetailsService;

    public MoviesController(IMovieCatalogService movieCatalogService, IMovieDetailsService movieDetailsService)
    {
        _movieCatalogService = movieCatalogService;
        _movieDetailsService = movieDetailsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMovies([FromQuery] MovieSpecParams specParams, CancellationToken cancellationToken)
    {
        var result = await _movieCatalogService.GetMoviesAsync(specParams, cancellationToken);
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
        var result = await _movieCatalogService.GetRecentlyAddedAsync(take, cancellationToken);
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
        var result = await _movieCatalogService.GetTrendingAsync(take, cancellationToken);
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
        var result = await _movieCatalogService.GetGenresAsync(cancellationToken);
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
        var result = await _movieCatalogService.GetRecommendedAsync(take, cancellationToken);
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

        var result = await _movieCatalogService.GetRecommendedForMeAsync(userId.Value, take, cancellationToken);
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
        var result = await _movieDetailsService.GetMovieDetailsAsync(id, userId, cancellationToken);
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