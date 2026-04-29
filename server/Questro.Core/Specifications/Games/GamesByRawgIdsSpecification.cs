using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class GamesByRawgIdsSpecification : BaseSpecification<Game>
{
    public GamesByRawgIdsSpecification(IEnumerable<int> rawgIds)
        : base(g => g.RAWG_Id.HasValue && rawgIds.Contains(g.RAWG_Id.Value))
    {
        AddInclude(x => x.GameGenres);
        AddInclude("GameGenres.Genre");
        AddInclude(x => x.GamePlatforms);
        AddInclude("GamePlatforms.Platform");
    }
}
