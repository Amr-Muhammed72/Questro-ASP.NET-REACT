using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class TrendingFallbackMoviesSpecification : BaseSpecification<Movie>
{
    public TrendingFallbackMoviesSpecification(int take)
        : base(m => m.Popularity.HasValue || m.TMDB_Rating.HasValue)
    {
        AddInclude(x => x.MovieGenres);
        AddInclude("MovieGenres.Genre");
        AddInclude(x => x.MovieStaffs);
        AddInclude("MovieStaffs.Staff");

        AddOrderByDescending(m => (m.Popularity ?? 0) + (m.TMDB_Rating ?? 0));

        var safeTake = take < 1 ? 20 : take;
        ApplyPaging(0, safeTake);
    }
}