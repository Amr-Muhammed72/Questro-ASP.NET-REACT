namespace Questro.Shared.Contracts.Games;

public class GameSpecParams
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? Sort { get; set; }
    public int? GenreId { get; set; }
    public int? PlatformId { get; set; }
    public string? Tags { get; set; }
    public double? MinRating { get; set; }
    public double? MaxRating { get; set; }
    public int? Year { get; set; }
}
