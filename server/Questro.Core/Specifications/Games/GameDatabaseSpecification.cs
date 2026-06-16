using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class GameDatabaseSpecification : BaseSpecification<Game>
{
    public GameDatabaseSpecification(
        double? minRating, 
        double? maxRating, 
        int? year, 
        int? genreId, 
        int? platformId, 
        int pageIndex, 
        int pageSize, 
        string? sort)
        : base(x =>
            (!minRating.HasValue || x.Rating >= minRating.Value) &&
            (!maxRating.HasValue || x.Rating <= maxRating.Value) &&
            (!year.HasValue || (x.Release_Date.HasValue && x.Release_Date.Value.Year == year.Value)) &&
            (!genreId.HasValue || x.GameGenres.Any(g => g.Genre.RAWG_Id == genreId.Value || g.Genre.GenreId == genreId.Value)) &&
            (!platformId.HasValue || x.GamePlatforms.Any(p => p.Platform.Platform_Id == platformId.Value))
        )
    {
        AddInclude(x => x.GameGenres);
        AddInclude("GameGenres.Genre");
        AddInclude(x => x.GamePlatforms);
        AddInclude("GamePlatforms.Platform");

        var safePageIndex = pageIndex < 1 ? 1 : pageIndex;
        var safePageSize = pageSize < 1 ? 20 : pageSize;
        var skip = (safePageIndex - 1) * safePageSize;

        ApplyPaging(skip, safePageSize);

        switch (sort?.ToLower())
        {
            case "rating":
                AddOrderByDescending(x => x.Rating ?? 0);
                break;
            case "releasedate":
                AddOrderByDescending(x => x.Release_Date);
                break;
            default:
                AddOrderByDescending(x => x.Popularity ?? 0);
                break;
        }
    }
}
