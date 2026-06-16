using Questro.Shared.Contracts.Search;

namespace Questro.Service.Abstractions.Search;

public interface IGlobalSearchService
{
    Task<GlobalSearchResultDto> SearchAsync(string query, bool isChildAccount, int limit = 5, CancellationToken cancellationToken = default);
}
