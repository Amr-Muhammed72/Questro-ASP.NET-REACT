namespace Questro.Shared.Contracts.Users;

public sealed class UserProfileDto
{
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Bio { get; set; }
    public string? Gender { get; set; }
    public string? ProfilePicUrl { get; set; }
    public DateTime? JoinDate { get; set; }
    public string PrimaryInterest { get; set; } = string.Empty;
    public bool IsHistoryPublic { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public bool IsFollowedByCurrentUser { get; set; }
}
