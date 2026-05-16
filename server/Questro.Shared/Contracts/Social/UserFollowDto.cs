namespace Questro.Shared.Contracts.Social;

public sealed class UserFollowDto
{
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? ProfilePicUrl { get; set; }
    public DateTime FollowedAt { get; set; }
}
