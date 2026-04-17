using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class RecommendedPlaceholderMoviesSpecification : BaseSpecification<Movie>
{
    public RecommendedPlaceholderMoviesSpecification(int take)
        : base(m => m.TMDB_Rating.HasValue || m.Popularity.HasValue)
    {
        AddInclude(x => x.MovieGenres);
        AddInclude("MovieGenres.Genre");

        AddOrderByDescending(m => m.TMDB_Rating ?? 0);

        var safeTake = take < 1 ? 20 : take;
        ApplyPaging(0, safeTake);
    }
}