using Questro.Shared.Contracts.RAG;

namespace Questro.Service.Abstractions.RAG;

public interface IRagService
{
    Task<RagRecommendationResponse> GetRecommendationsAsync(
        string query,
        int k,
        long? userId,
        CancellationToken cancellationToken = default);
}
