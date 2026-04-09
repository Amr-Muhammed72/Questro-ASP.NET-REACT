namespace Questro.Core.Entities.Games;

public class Game_GamePlatform
{
    public int GameId { get; set; }
    public int Platform_Id { get; set; }

    public virtual Game Game { get; set; } = null!;
    public virtual GamePlatform Platform { get; set; } = null!;
}
