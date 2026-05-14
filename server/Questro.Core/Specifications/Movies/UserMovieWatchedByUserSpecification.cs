using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieWatchedByUserSpecification : BaseSpecification<UserMovieWatched>
{
    public UserMovieWatchedByUserSpecification(long userId, int pageIndex, int pageSize)
        : base(x => x.UserId == userId)
    {
        AddInclude(x => x.Movie);
        AddOrderByDescending(x => x.Timestamp);

        var safePageIndex = pageIndex < 1 ? 1 : pageIndex;
        var safePageSize = pageSize < 1 ? 20 : pageSize;
        var skip = (safePageIndex - 1) * safePageSize;

        ApplyPaging(skip, safePageSize);
    }
}
