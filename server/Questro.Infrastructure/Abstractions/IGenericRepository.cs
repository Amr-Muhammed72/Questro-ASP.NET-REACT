using Questro.Core.Specifications;

namespace Questro.Infrastructure.Abstractions;

public interface IGenericRepository<T> where T : class
{
    Task<IReadOnlyList<T>> ListAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> ListAsync(ISpecification<T> specification, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> ListReadOnlyAsync(ISpecification<T> specification, CancellationToken cancellationToken = default);
    Task<T?> GetEntityWithSpecAsync(ISpecification<T> specification, CancellationToken cancellationToken = default);
    Task<T?> GetReadOnlyAsync(ISpecification<T> specification, CancellationToken cancellationToken = default);
    Task<int> CountAsync(ISpecification<T> specification, CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    void Update(T entity);
    void Remove(T entity);
}