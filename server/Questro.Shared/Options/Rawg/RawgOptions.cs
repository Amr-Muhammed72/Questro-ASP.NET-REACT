namespace Questro.Shared.Options.Rawg;

public sealed class RawgOptions
{
    public const string SectionName = "Rawg";

    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.rawg.io/api";
}
