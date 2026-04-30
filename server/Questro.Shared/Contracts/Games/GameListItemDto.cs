namespace Questro.Shared.Contracts.Games;

public class GameListItemDto
{
    public int GameId { get; set; }
    public int? RawgId { get; set; }
    public string Title { get; set; } = string.Empty;
 
    public double? Rating { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public string? PosterUrl { get; set; }
    public string? TrailerUrl { get; set; }
    
    public IEnumerable<GameGenreDto> Genres { get; set; } = new List<GameGenreDto>();
    public IEnumerable<GamePlatformDto> Platforms { get; set; } = new List<GamePlatformDto>();
}
