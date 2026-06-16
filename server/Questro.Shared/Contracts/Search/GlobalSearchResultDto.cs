namespace Questro.Shared.Contracts.Search;

public class GlobalSearchResultDto
{
    public IEnumerable<MovieSummaryDto> Movies { get; set; } = new List<MovieSummaryDto>();
    public IEnumerable<GameSummaryDto> Games { get; set; } = new List<GameSummaryDto>();
    public IEnumerable<ActorSummaryDto> Actors { get; set; } = new List<ActorSummaryDto>();
    public IEnumerable<UserSummaryDto> Users { get; set; } = new List<UserSummaryDto>();
}

public class MovieSummaryDto
{
    public int TmdbId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? PosterUrl { get; set; }
    public DateTime? ReleaseDate { get; set; }
}

public class GameSummaryDto
{
    public int RawgId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? BackgroundImageUrl { get; set; }
    public DateTime? Released { get; set; }
}

public class ActorSummaryDto
{
    public int TmdbId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ProfileUrl { get; set; }
}

public class UserSummaryDto
{
    public long Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
}
