namespace Questro.Shared.Contracts.Movies;

public sealed class MovieSpecParams
{
    private const int MaxPageSize = 50;
    private int _pageSize = 20;

    public string? Search { get; set; }
    public int? GenreId { get; set; }
    public string? Language { get; set; }
    public int? Year { get; set; }
    public double? MinRating { get; set; }
    public double? MaxRating { get; set; }
    public string? Quality { get; set; }
    public string? Sort { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }
}