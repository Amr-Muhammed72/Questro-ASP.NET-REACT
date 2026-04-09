namespace Questro.Core.Entities.Movies;

public class Movie_MovieGenre
{
    public int MovieId { get; set; }
    public int GenreId { get; set; }
    public DateTime? CreatedAt { get; set; }

    public virtual Movie Movie { get; set; } = null!;
    public virtual MovieGenre Genre { get; set; } = null!;
}
