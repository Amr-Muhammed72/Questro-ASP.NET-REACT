using Questro.Core.Entities.UserManagement;

namespace Questro.Core.Entities.Games;

public class UserGameRate
{
    public int Id { get; set; }
    public long UserId { get; set; }
    public int GameId { get; set; }
    public int Stars { get; set; }
    public DateTime Timestamp { get; set; }

    public virtual ApplicationUser User { get; set; } = null!;
    public virtual Game Game { get; set; } = null!;
}
