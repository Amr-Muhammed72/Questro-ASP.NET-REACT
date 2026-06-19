using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.RAG;
using Questro.Shared.Contracts.RAG;

namespace Questro.API.Controllers;

/// <summary>
/// Controller for content recommendations using RAG (Retrieval-Augmented Generation)
/// </summary>
[Authorize]
[Route("api/[controller]")]
[ApiController]
public class RecommendationsController : ApiControllerBase
{
    private readonly IRagService _ragService;
    private readonly ILogger<RecommendationsController> _logger;

    public RecommendationsController(
        IRagService ragService,
        ILogger<RecommendationsController> logger)
    {
        _ragService = ragService;
        _logger = logger;
    }

    /// <summary>
    /// Get content recommendations using natural language query
    /// </summary>
    /// <param name="request">The RAG recommendation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>RAG recommendation response with retrieved items and LLM analysis</returns>
    /// <remarks>
    /// This endpoint uses vector search and LLM to generate personalized recommendations
    /// based on a natural language query. Optionally includes user profile data for better results.
    /// 
    /// Example request:
    /// POST /api/recommendations/query
    /// {
    ///   "query": "games with strategic combat in fantasy worlds",
    ///   "k": 5,
    ///   "allow_adult": false,
    ///   "blocked_genres": ["Horror"],
    ///   "user": { "age": 25, "game_genres_fav": "Action|RPG" }
    /// }
    /// </remarks>
    [HttpPost("query")]
    [ProducesResponseType(typeof(RagRecommendationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RagRecommendationResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(RagRecommendationResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<RagRecommendationResponse>> GetRecommendations(
        [FromBody] RagRecommendationRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Query))
        {
            return BadRequest(new RagRecommendationResponse
            {
                Status = "error",
                Error = "Query parameter is required"
            });
        }

        _logger.LogInformation(
            "User {UserId} requested recommendations for query: {Query}",
            GetCurrentUserId(),
            request.Query);

        var response = await _ragService.GetRecommendationsAsync(request, cancellationToken);

        // Return service unavailable if RAG service is initializing
        if (response.Status == "initializing")
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, response);
        }

        // Return bad request if there was an error
        if (response.Status == "error" && !string.IsNullOrEmpty(response.Error))
        {
            return BadRequest(response);
        }

        return Ok(response);
    }

    /// <summary>
    /// Health check for RAG service
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Health status</returns>
    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> HealthCheck(CancellationToken cancellationToken = default)
    {
        var isHealthy = await _ragService.IsHealthyAsync(cancellationToken);

        if (!isHealthy)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "unhealthy",
                message = "RAG service is not available"
            });
        }

        return Ok(new
        {
            status = "healthy",
            message = "RAG service is ready"
        });
    }
}
