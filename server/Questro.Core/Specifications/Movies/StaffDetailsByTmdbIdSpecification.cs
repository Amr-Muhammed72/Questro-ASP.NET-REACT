using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class StaffDetailsByTmdbIdSpecification : BaseSpecification<Staff>
{
    public StaffDetailsByTmdbIdSpecification(int tmdbId)
        : base(s => s.TMDB_Id == tmdbId)
    {
        AddInclude(x => x.MovieStaffs);
        AddInclude("MovieStaffs.Movie");
    }
}
