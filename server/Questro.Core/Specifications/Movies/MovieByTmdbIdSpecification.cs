using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class MovieByTmdbIdSpecification : BaseSpecification<Movie>
{
    public MovieByTmdbIdSpecification(int tmdbId)
        : base(m => m.TMDB_Id == tmdbId)
    {
        AddInclude(x => x.MovieGenres);
        AddInclude("MovieGenres.Genre");
    }
}
