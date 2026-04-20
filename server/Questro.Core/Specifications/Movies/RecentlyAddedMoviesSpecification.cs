using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class RecentlyAddedMoviesSpecification : BaseSpecification<Movie>
{
    public RecentlyAddedMoviesSpecification(int take)
        : base(m => m.Release_Date.HasValue)
    {
        AddInclude(x => x.MovieGenres);
        AddInclude("MovieGenres.Genre");
        AddInclude(x => x.MovieStaffs);
        AddInclude("MovieStaffs.Staff");

        AddOrderByDescending(m => m.Release_Date ?? DateTime.MinValue);

        var safeTake = take < 1 ? 20 : take;
        ApplyPaging(0, safeTake);
    }
}