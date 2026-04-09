using Questro.Core.Entities.UserManagement;

namespace Questro.Core.Entities.Games;

public class UserGameRecommended
{
    public int Id { get; set; }
    public long UserId { get; set; }
    public int GameId { get; set; }
    public string? ModelVersion { get; set; }
    public double? Score { get; set; }
    public DateTime Timestamp { get; set; }

    public virtual ApplicationUser User { get; set; } = null!;
    public virtual Game Game { get; set; } = null!;
}
