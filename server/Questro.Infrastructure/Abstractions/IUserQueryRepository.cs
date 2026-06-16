using Questro.Shared.Contracts.Search;

namespace Questro.Infrastructure.Abstractions;

public interface IUserQueryRepository
{
    Task<IEnumerable<UserSummaryDto>> SearchUsersAsync(string query, int limit, CancellationToken ct);
}
