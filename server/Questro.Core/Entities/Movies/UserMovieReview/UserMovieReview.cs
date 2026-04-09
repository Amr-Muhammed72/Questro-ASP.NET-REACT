using Questro.Core.Entities.UserManagement;

namespace Questro.Core.Entities.Movies;

public class UserMovieReview
{
    public int Id { get; set; }
    public long UserId { get; set; }
    public int MovieId { get; set; }
    public string Body { get; set; } = null!;
    public DateTime Timestamp { get; set; }

    public virtual ApplicationUser User { get; set; } = null!;
    public virtual Movie Movie { get; set; } = null!;
}
