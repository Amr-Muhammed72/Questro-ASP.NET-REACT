namespace Questro.Shared.Contracts.Family;

public sealed class ChildRestrictionDto
{
	public List<int> BlockedMovieGenreIds { get; set; } = new();
	public List<int> BlockedGameGenreIds { get; set; } = new();
}
