using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class GameGenreLinksByGameIdSpecification : BaseSpecification<Game_GameGenre>
{
    public GameGenreLinksByGameIdSpecification(int gameId)
        : base(x => x.GameId == gameId)
    {
    }
}
