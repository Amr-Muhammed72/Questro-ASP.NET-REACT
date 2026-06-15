using System.Threading;
using System.Threading.Tasks;

namespace Questro.Infrastructure.Abstractions;

public interface IUserCleanupRepository
{
    Task WipeUserFootprintAsync(long userId, CancellationToken cancellationToken = default);
}
