using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class GameDetailsByRawgIdSpecification : BaseSpecification<Game>
{
    public GameDetailsByRawgIdSpecification(int rawgId)
        : base(g => g.RAWG_Id == rawgId)
    {
        AddInclude(x => x.GameGenres);
        AddInclude("GameGenres.Genre");
        AddInclude(x => x.GamePlatforms);
        AddInclude("GamePlatforms.Platform");
        AddInclude(x => x.Photos);
        
    }
}
