using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.RAG;
using Questro.Shared.Contracts.RAG;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace Questro.API.Controllers.RAG;

[Route("api/[controller]")]
public class RagController : ApiControllerBase
{
    private readonly IRagService _ragService;

    public RagController(IRagService ragService)
    {
        _ragService = ragService;
    }

    /// <summary>
    /// Get AI-powered recommendations using natural language.
    /// Authenticated users get personalized results via ML re-ranking.
    /// </summary>
    [Authorize]
    [HttpPost("recommend")]
    public async Task<IActionResult> GetRecommendations(
        [FromBody] RagRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.query))
        {
            return BadRequest(new { error = "Missing required field: 'query'" });
        }

        var userId = GetCurrentUserId();

        RagRecommendationResponse? result = await _ragService.GetRecommendationsAsync(request.query,5, userId, cancellationToken);

        if (result.Status == "error")
        {
            return StatusCode(500, new { error = result.Error });
        }

        if (result.Status == "initializing")
        {
            return StatusCode(503, new
            {
                status = "initializing",
                error = result.Error
            });
        }
        RagResponseDto response = new RagResponseDto(
            query: result.Query,
            status: result.Status,
            error: result.Error,
            llmResponse: result.LlmResponse
        );
        return Ok(response);
    }
}
