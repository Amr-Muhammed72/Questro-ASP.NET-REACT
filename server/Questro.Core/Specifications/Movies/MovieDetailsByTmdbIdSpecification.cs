using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class MovieDetailsByTmdbIdSpecification : BaseSpecification<Movie>
{
    public MovieDetailsByTmdbIdSpecification(int tmdbId)
        : base(m => m.TMDB_Id == tmdbId)
    {
        AddInclude(x => x.MovieGenres);
        AddInclude("MovieGenres.Genre");
        AddInclude(x => x.MovieStaffs);
        AddInclude("MovieStaffs.Staff");
    }
}
