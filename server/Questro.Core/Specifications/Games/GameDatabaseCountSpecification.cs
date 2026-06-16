using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class GameDatabaseCountSpecification : BaseSpecification<Game>
{
    public GameDatabaseCountSpecification(
        double? minRating, 
        double? maxRating, 
        int? year, 
        int? genreId, 
        int? platformId)
        : base(x =>
            (!minRating.HasValue || x.Rating >= minRating.Value) &&
            (!maxRating.HasValue || x.Rating <= maxRating.Value) &&
            (!year.HasValue || (x.Release_Date.HasValue && x.Release_Date.Value.Year == year.Value)) &&
            (!genreId.HasValue || x.GameGenres.Any(g => g.Genre.RAWG_Id == genreId.Value || g.Genre.GenreId == genreId.Value)) &&
            (!platformId.HasValue || x.GamePlatforms.Any(p => p.Platform.Platform_Id == platformId.Value))
        )
    {
    }
}
