namespace Questro.Core.Entities.UserManagement;

// NOTE: Run EF Migration after this rename:
// dotnet ef migrations add RenameAllowedToBlockedGenreIds --project Questro.Infrastructure --startup-project Questro.API
public class ChildRestriction
{
	public long UserId { get; set; }
	public List<int> BlockedMovieGenreIds { get; set; } = new();
	public List<int> BlockedGameGenreIds { get; set; } = new();
	public string? MaxContentRating { get; set; }
	public int? MaxMetacriticRating { get; set; }

	public virtual ApplicationUser User { get; set; } = null!;
}
