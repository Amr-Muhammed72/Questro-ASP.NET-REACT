using Questro.Shared.Contracts.RAG;

namespace Questro.Infrastructure.Abstractions;

public interface IRagApiService
{
    Task<RagRecommendationResponse?> GetRecommendationsAsync(
        RagRecommendationRequest request,
        CancellationToken cancellationToken = default);
}
