namespace Questro.Shared.Contracts.Users;

public sealed class UpdateProfileRequestDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Bio { get; set; }
    public string? Gender { get; set; }
    public DateTime? BirthDate { get; set; }
    public int? PrimaryInterest { get; set; }
    public bool? IsHistoryPublic { get; set; }
}
