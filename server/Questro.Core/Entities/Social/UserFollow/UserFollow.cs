using Questro.Core.Entities.UserManagement;

namespace Questro.Core.Entities.Social;

public class UserFollow
{
    public long FollowerId { get; set; }
    public long FolloweeId { get; set; }
    public DateTime Timestamp { get; set; }

    public virtual ApplicationUser Follower { get; set; } = null!;
    public virtual ApplicationUser Followee { get; set; } = null!;
}
