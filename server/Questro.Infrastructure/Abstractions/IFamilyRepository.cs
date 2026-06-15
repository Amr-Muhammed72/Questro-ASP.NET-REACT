using Questro.Core.Entities.UserManagement;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Questro.Infrastructure.Abstractions;

public interface IFamilyRepository
{
    Task<List<ApplicationUser>> GetChildrenByParentIdAsync(long parentId, CancellationToken cancellationToken = default);
}
