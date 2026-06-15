namespace Questro.Shared.Contracts.Games;

public class GameDetailsDto
{
    public int GameId { get; set; }
    public int? RawgId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public double? Rating { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public string? PosterUrl { get; set; }
    public string? BackdropUrl { get; set; }
    public string? TrailerUrl { get; set; }
    public string? StoreUrl { get; set; }
    public int? NumberOfImages { get; set; }
    public IEnumerable<GameScreenshotDto> Screenshots { get; set; } = new List<GameScreenshotDto>();
    public IEnumerable<GameGenreDto> Genres { get; set; } = new List<GameGenreDto>();
    public IEnumerable<GameTagDto> Tags { get; set; } = new List<GameTagDto>();
    public IEnumerable<GamePlatformDto> Platforms { get; set; } = new List<GamePlatformDto>();
   
    public IEnumerable<GameDeveloperDto> Developers { get; set; } = new List<GameDeveloperDto>();
    public IEnumerable<GamePublisherDto> Publishers { get; set; } = new List<GamePublisherDto>();
    public IEnumerable<GameListItemDto> SimilarGames { get; set; } = new List<GameListItemDto>();
}

public class GameSystemRequirementDto
{
    public int PlatformId { get; set; }
    public string PlatformName { get; set; } = string.Empty;
    public string? Minimum { get; set; }
    public string? Recommended { get; set; }
}

public class GameDeveloperDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}

public class GamePublisherDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}

public sealed record GameTagDto(int Id, string Name);
