using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Movies;

namespace Questro.API.Controllers.Movies;

[ApiController]
[Route("api/movie-sync")]
public class MovieSyncController : ControllerBase
{
    private readonly IMovieSyncService _movieSyncService;

    public MovieSyncController(IMovieSyncService movieSyncService)
    {
        _movieSyncService = movieSyncService;
    }

    [HttpPost("{tmdbId:int}")]
    public async Task<IActionResult> FetchByTmdbId([FromRoute] int tmdbId, CancellationToken cancellationToken = default)
    {
        var result = await _movieSyncService.FetchAndSaveMovieByTmdbIdAsync(tmdbId, cancellationToken);
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
}
