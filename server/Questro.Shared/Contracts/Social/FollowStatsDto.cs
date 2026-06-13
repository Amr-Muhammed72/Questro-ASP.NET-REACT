namespace Questro.Shared.Contracts.Social;

public sealed class FollowStatsDto
{
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public bool IsFollowedByCurrentUser { get; set; }
}
