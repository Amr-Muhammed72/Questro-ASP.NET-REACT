namespace Questro.Core.Entities.UserManagement;

public class ChildRestriction
{
	public long UserId { get; set; }
	public List<int> BlockedMovieGenreIds { get; set; } = new();
	public List<int> BlockedGameGenreIds { get; set; } = new();

	public virtual ApplicationUser User { get; set; } = null!;
}
