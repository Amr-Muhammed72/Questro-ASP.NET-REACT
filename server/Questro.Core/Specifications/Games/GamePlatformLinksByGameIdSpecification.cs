using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class GamePlatformLinksByGameIdSpecification : BaseSpecification<Game_GamePlatform>
{
    public GamePlatformLinksByGameIdSpecification(int gameId)
        : base(x => x.GameId == gameId)
    {
    }
}
