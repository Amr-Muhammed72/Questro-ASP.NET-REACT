using Microsoft.EntityFrameworkCore;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.Data;
using Questro.Shared.Contracts.Search;

namespace Questro.Infrastructure.Repositories;

public class UserQueryRepository : IUserQueryRepository
{
    private readonly ApplicationDbContext _context;

    public UserQueryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<UserSummaryDto>> SearchUsersAsync(string query, int limit, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Enumerable.Empty<UserSummaryDto>();
        }

        var normalizedQuery = query.ToLower();

        return await _context.Users
            .Where(u => (u.UserName != null && u.UserName.ToLower().Contains(normalizedQuery)) || 
                        (u.FirstName != null && u.FirstName.ToLower().Contains(normalizedQuery)) ||
                        (u.LastName != null && u.LastName.ToLower().Contains(normalizedQuery)))
            .Select(u => new UserSummaryDto
            {
                Id = u.Id,
                Username = u.UserName ?? string.Empty,
                ProfilePictureUrl = u.ProfilePic
            })
            .Take(limit)
            .ToListAsync(ct);
    }
}
