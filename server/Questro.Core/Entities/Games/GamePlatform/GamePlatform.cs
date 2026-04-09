namespace Questro.Core.Entities.Games;

public class GamePlatform
{
    public int Platform_Id { get; set; }
    public string Name { get; set; } = null!;

    public virtual ICollection<Game_GamePlatform> GameGamePlatforms { get; set; } = new HashSet<Game_GamePlatform>();
}
