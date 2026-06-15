namespace Questro.Shared.Contracts.Family;

public sealed class CreateChildAccountRequestDto
{
	public string UserName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public string Password { get; set; } = string.Empty;
	public string ConfirmPassword { get; set; } = string.Empty;
	public string? FirstName { get; set; }
	public string? LastName { get; set; }
	public DateTime? BirthDate { get; set; }
	public List<int>? BlockedMovieGenreIds { get; set; }
	public List<int>? BlockedGameGenreIds { get; set; }
	public string? MaxContentRating { get; set; }
	public int? MaxMetacriticRating { get; set; }
}
