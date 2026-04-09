namespace Questro.Core.Entities.Movies;

public class MovieGenre
{
    public int GenreId { get; set; }
    public string Name { get; set; } = null!;

    public virtual ICollection<Movie_MovieGenre> MovieMovieGenres { get; set; } = new HashSet<Movie_MovieGenre>();
}
