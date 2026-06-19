using Questro.Shared.Contracts.RAG;

namespace Questro.Service.Abstractions.RAG;

/// <summary>
/// Service abstraction for RAG (Retrieval-Augmented Generation) recommendations
/// Provides natural language-based content recommendations using vector search and LLM
/// </summary>
public interface IRagService
{
    /// <summary>
    /// Get RAG-based recommendations for a natural language query
    /// </summary>
    /// <param name="request">The recommendation request with query and filters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>RAG recommendation response with retrieved items and LLM response</returns>
    Task<RagRecommendationResponse> GetRecommendationsAsync(
        RagRecommendationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Health check to verify RAG service availability
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if service is available and ready</returns>
    Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default);
}
