using Questro.Core.Entities.Movies;

namespace Questro.Core.Specifications.Movies;

public class MovieWithFiltersSpecification : BaseSpecification<Movie>
{
    public MovieWithFiltersSpecification(MovieSpecCriteria specParams)
        : base(MovieSpecificationCriteriaBuilder.Build(specParams))
    {
        AddInclude(x => x.MovieGenres);
        AddInclude("MovieGenres.Genre");
        AddInclude(x => x.MovieStaffs);
        AddInclude("MovieStaffs.Staff");

        ApplySorting(specParams);

        var safePageIndex = specParams.PageIndex < 1 ? 1 : specParams.PageIndex;
        var safePageSize = specParams.PageSize < 1 ? 20 : specParams.PageSize;
        var skip = (safePageIndex - 1) * safePageSize;

        ApplyPaging(skip, safePageSize);
    }

    private void ApplySorting(MovieSpecCriteria specParams)
    {
        switch (specParams.Sort?.Trim().ToLower())
        {
            case "latest":
                AddOrderByDescending(m => m.Release_Date ?? DateTime.MinValue);
                break;
            case "oldest":
                AddOrderBy(m => m.Release_Date ?? DateTime.MinValue);
                break;
            case "popularity":
                AddOrderByDescending(m => m.Popularity ?? 0);
                break;
            case "popularityasc":
                AddOrderBy(m => m.Popularity ?? 0);
                break;
            case "rating":
                AddOrderByDescending(m => m.TMDB_Rating ?? 0);
                break;
            case "ratingasc":
                AddOrderBy(m => m.TMDB_Rating ?? 0);
                break;
            default:
                AddOrderByDescending(m => m.Release_Date ?? DateTime.MinValue);
                break;
        }
    }
}