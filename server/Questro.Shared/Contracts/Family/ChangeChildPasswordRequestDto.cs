namespace Questro.Shared.Contracts.Family;

public sealed class ChangeChildPasswordRequestDto
{
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmNewPassword { get; set; } = string.Empty;
}
