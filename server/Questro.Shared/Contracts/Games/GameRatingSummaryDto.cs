namespace Questro.Shared.Contracts.Games;

public class GameRatingSummaryDto
{
    public int GameId { get; set; }
    public double AverageRating { get; set; }
    public int RatingCount { get; set; }
}
