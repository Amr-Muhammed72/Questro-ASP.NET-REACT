namespace Questro.Shared.Contracts.Auth;

public sealed class CompleteProfileRequestDto
{
    public string UserName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime BirthDate { get; set; }
}
