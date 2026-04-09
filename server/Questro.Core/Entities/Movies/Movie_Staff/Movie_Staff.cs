namespace Questro.Core.Entities.Movies;

public class Movie_Staff
{
    public int MovieId { get; set; }
    public int Staff_Id { get; set; }
    public string? Role { get; set; }

    public virtual Movie Movie { get; set; } = null!;
    public virtual Staff Staff { get; set; } = null!;
}
