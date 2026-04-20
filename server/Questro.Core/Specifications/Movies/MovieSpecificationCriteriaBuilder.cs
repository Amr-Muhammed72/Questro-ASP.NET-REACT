using Questro.Core.Entities.Movies;
using System.Linq.Expressions;

namespace Questro.Core.Specifications.Movies;

internal static class MovieSpecificationCriteriaBuilder
{
    public static Expression<Func<Movie, bool>> Build(MovieSpecCriteria specParams)
    {
        var search = specParams.Search?.Trim().ToLower();
        var language = specParams.Language?.Trim().ToLower();

        return movie =>
            (string.IsNullOrWhiteSpace(search) ||
             movie.Title.ToLower().Contains(search) ||
             movie.MovieStaffs.Any(ms =>
                 ms.Staff.Name.ToLower().Contains(search) ||
                 (ms.Role != null && ms.Role.ToLower().Contains(search)) ||
                 (ms.Staff.Department != null && ms.Staff.Department.ToLower().Contains(search)))) &&
            (!specParams.GenreId.HasValue || movie.MovieGenres.Any(g => g.GenreId == specParams.GenreId.Value)) &&
            (string.IsNullOrWhiteSpace(language) || (movie.Language != null && movie.Language.ToLower() == language)) &&
            (!specParams.Year.HasValue || (movie.Release_Date.HasValue && movie.Release_Date.Value.Year == specParams.Year.Value)) &&
            (!specParams.MinRating.HasValue || (movie.TMDB_Rating.HasValue && movie.TMDB_Rating.Value >= specParams.MinRating.Value)) &&
            (!specParams.MaxRating.HasValue || (movie.TMDB_Rating.HasValue && movie.TMDB_Rating.Value <= specParams.MaxRating.Value));
    }
}