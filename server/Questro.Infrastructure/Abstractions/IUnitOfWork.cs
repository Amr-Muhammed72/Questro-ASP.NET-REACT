using Microsoft.EntityFrameworkCore.Storage;

namespace Questro.Infrastructure.Abstractions;

public interface IUnitOfWork
{
    Task<int> CompleteAsync(CancellationToken cancellationToken = default);
    Task<bool> TryCompleteWithConflictHandlingAsync(CancellationToken cancellationToken = default);
    void ClearTracking();
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}
