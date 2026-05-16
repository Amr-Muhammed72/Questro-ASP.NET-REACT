using Microsoft.AspNetCore.Mvc;
using Questro.Shared.Result;
using System.Security.Claims;

namespace Questro.API.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected long? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    protected IActionResult HandleResult<T>(Result<T> result)
    {
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

    protected IActionResult HandleResult(Result result)
    {
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

        return Ok();
    }
}
