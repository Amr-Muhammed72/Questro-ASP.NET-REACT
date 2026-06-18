namespace Questro.Shared.Contracts.Users;

public class SurveyCompletionStatusDto
{
    /// <summary>
    /// True if user has completed survey (has game or movie genres selected), false otherwise
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// List of favorite game genres
    /// </summary>
    public List<string> GameGenresFav { get; set; } = new();

    /// <summary>
    /// List of favorite movie genres
    /// </summary>
    public List<string> MovieGenresFav { get; set; } = new();

    /// <summary>
    /// Status message
    /// </summary>
    public string Message { get; set; } = string.Empty;
}
