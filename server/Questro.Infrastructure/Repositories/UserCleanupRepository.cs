using Microsoft.EntityFrameworkCore;
using Questro.Core.Entities.Games;
using Questro.Core.Entities.Movies;
using Questro.Core.Entities.Social;
using Questro.Core.Entities.UserManagement;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Questro.Infrastructure.Repositories;

public class UserCleanupRepository : IUserCleanupRepository
{
    private readonly ApplicationDbContext _context;

    public UserCleanupRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task WipeUserFootprintAsync(long userId, CancellationToken cancellationToken = default)
    {
        await _context.Set<UserFollow>()
            .Where(f => f.FollowerId == userId || f.FolloweeId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await _context.Set<ChildRestriction>()
            .Where(r => r.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await _context.Set<UserMovieRate>()
            .Where(m => m.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await _context.Set<UserMovieWatchlist>()
            .Where(m => m.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await _context.Set<UserGameRate>()
            .Where(g => g.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await _context.Set<UserGameWishlist>()
            .Where(g => g.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);
    }
}
