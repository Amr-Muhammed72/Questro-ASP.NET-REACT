using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Movies;

namespace Questro.API.Controllers.Movies;

[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly IMovieService _movieService;

    public StaffController(IMovieService movieService)
    {
        _movieService = movieService;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetStaffDetails([FromRoute] int id, CancellationToken cancellationToken = default)
    {
        var result = await _movieService.GetStaffDetailsAsync(id, cancellationToken);
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
