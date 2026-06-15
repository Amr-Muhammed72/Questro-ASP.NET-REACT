namespace Questro.Shared.Contracts.Family;

public sealed class ChildAccountResponseDto
{
	public long UserId { get; set; }
	public string UserName { get; set; } = string.Empty;
	public string? FirstName { get; set; }
	public string? LastName { get; set; }
	public DateTime? BirthDate { get; set; }
	public ChildRestrictionDto? Restrictions { get; set; }
}
