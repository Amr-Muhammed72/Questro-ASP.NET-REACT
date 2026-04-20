using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class UserMovieReviewsByMovieIdSpecification : BaseSpecification<UserMovieReview>
{
    public UserMovieReviewsByMovieIdSpecification(int movieId, int pageIndex, int pageSize)
        : base(x => x.MovieId == movieId)
    {
        AddInclude(x => x.User);
        AddOrderByDescending(x => x.Timestamp);

        var safePageIndex = pageIndex < 1 ? 1 : pageIndex;
        var safePageSize = pageSize < 1 ? 20 : pageSize;
        var skip = (safePageIndex - 1) * safePageSize;

        ApplyPaging(skip, safePageSize);
    }
}
