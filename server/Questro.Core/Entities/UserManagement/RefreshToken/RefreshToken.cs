namespace Questro.Core.Entities.UserManagement;

public class RefreshToken
{
    public int Id { get; set; }
    public long UserId { get; set; }
    public string Token { get; set; } = null!;
    public DateTime CreatedOnUtc { get; set; }
    public DateTime ExpiresOnUtc { get; set; }
    public DateTime? RevokedOnUtc { get; set; }

    public virtual ApplicationUser User { get; set; } = null!;
}