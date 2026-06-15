using Questro.Shared.Contracts.Recommender;

namespace Questro.Infrastructure.Abstractions;

public interface IRecommenderService
{
    Task<RecommenderResponse?> GetRecommendationsAsync(
        RecommenderRequest request,
        CancellationToken cancellationToken = default);
}
