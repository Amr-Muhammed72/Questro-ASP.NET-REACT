namespace Questro.Shared.Contracts.Users;

public sealed class UserLibraryGameItemDto
{
    public int RawgId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? BackgroundImage { get; set; }
    public DateTime Timestamp { get; set; }
    public int? Rating { get; set; }
}
