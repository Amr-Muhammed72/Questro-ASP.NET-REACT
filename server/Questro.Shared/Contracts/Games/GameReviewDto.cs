namespace Questro.Shared.Contracts.Games;

public class GameReviewDto
{
    public int ReviewId { get; set; }
    public int GameId { get; set; }
    public long UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateGameReviewRequestDto
{
    public string Content { get; set; } = string.Empty;
}

public class UpdateGameReviewRequestDto
{
    public string Content { get; set; } = string.Empty;
}
