using Microsoft.EntityFrameworkCore;
using Questro.Core.Entities.UserManagement;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.Data;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Questro.Infrastructure.Repositories;

public class FamilyRepository : IFamilyRepository
{
    private readonly ApplicationDbContext _context;

    public FamilyRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ApplicationUser>> GetChildrenByParentIdAsync(long parentId, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Where(u => u.ParentId == parentId)
            .ToListAsync(cancellationToken);
    }
}
