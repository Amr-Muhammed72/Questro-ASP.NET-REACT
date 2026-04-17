namespace Questro.Core.Specifications.Movies;

public sealed class MovieSpecCriteria
{
    public string? Search { get; set; }
    public int? GenreId { get; set; }
    public string? Language { get; set; }
    public int? Year { get; set; }
    public double? MinRating { get; set; }
    public double? MaxRating { get; set; }
    public string? Sort { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}