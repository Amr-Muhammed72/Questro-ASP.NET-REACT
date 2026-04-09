namespace Questro.Core.Entities.Movies;

public class Staff
{
    public int Staff_Id { get; set; }
    public string Name { get; set; } = null!;
    public DateTime? BirthDate { get; set; }
    public string? Gender { get; set; }
    public string? Profile_Path { get; set; }
    public string? Department { get; set; }

    public virtual ICollection<Movie_Staff> MovieStaffs { get; set; } = new HashSet<Movie_Staff>();
}
