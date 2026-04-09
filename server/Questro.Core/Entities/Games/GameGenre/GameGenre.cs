namespace Questro.Core.Entities.Games;

public class GameGenre
{
    public int GenreId { get; set; }
    public string Name { get; set; } = null!;

    public virtual ICollection<Game_GameGenre> GameGameGenres { get; set; } = new HashSet<Game_GameGenre>();
}
