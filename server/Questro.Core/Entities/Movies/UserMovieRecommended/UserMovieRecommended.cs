using Questro.Core.Entities.UserManagement;

namespace Questro.Core.Entities.Movies;

public class UserMovieRecommended
{
    public int Id { get; set; }
    public long UserId { get; set; }
    public int MovieId { get; set; }
    public string? ModelVersion { get; set; }
    public double? Score { get; set; }
    public DateTime Timestamp { get; set; }

    public virtual ApplicationUser User { get; set; } = null!;
    public virtual Movie Movie { get; set; } = null!;
}
