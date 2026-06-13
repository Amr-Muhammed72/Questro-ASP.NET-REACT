using Questro.Core.Entities.Games;

namespace Questro.Core.Specifications.Games;

public class GamePhotosByGameIdSpecification : BaseSpecification<GamePhoto>
{
    public GamePhotosByGameIdSpecification(int gameId)
        : base(x => x.GameId == gameId)
    {
    }
}
