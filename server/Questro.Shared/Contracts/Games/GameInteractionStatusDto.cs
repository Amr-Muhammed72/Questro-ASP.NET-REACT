namespace Questro.Shared.Contracts.Games;

public class  GameInteractionStatusDto
{
    public long GameId { get; set; }
    public int? RawgId { get; set; }
    public bool IsLiked { get; set; }
    public double? Rating { get; set; }
    public bool IsInWishlist { get; set; }
    public int? UserRating { get; set; }
}
