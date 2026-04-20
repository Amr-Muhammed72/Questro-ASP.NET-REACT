using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class MoviesByTmdbIdsSpecification : BaseSpecification<Movie>
{
    public MoviesByTmdbIdsSpecification(IEnumerable<int> tmdbIds)
        : base(m => m.TMDB_Id.HasValue && tmdbIds.Contains(m.TMDB_Id.Value))
    {
        AddInclude(x => x.MovieGenres);
        AddInclude("MovieGenres.Genre");
    }
}