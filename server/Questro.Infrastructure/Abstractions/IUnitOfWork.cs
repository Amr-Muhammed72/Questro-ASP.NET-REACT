namespace Questro.Infrastructure.Abstractions;

public interface IUnitOfWork
{
    Task<int> CompleteAsync(CancellationToken cancellationToken = default);
}
