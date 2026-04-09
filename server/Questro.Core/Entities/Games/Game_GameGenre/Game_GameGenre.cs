namespace Questro.Core.Entities.Games;

public class Game_GameGenre
{
    public int GameId { get; set; }
    public int GenreId { get; set; }

    public virtual Game Game { get; set; } = null!;
    public virtual GameGenre Genre { get; set; } = null!;
}
