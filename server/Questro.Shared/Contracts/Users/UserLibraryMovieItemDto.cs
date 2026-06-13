namespace Questro.Shared.Contracts.Users;

public sealed class UserLibraryMovieItemDto
{
    public int TmdbId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? PosterUrl { get; set; }
    public DateTime Timestamp { get; set; }
    public int? Rating { get; set; }
}
