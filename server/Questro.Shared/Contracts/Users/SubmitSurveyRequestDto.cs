namespace Questro.Shared.Contracts.Users;

public sealed class SubmitSurveyRequestDto
{
    public string? Country { get; set; }
    public List<string>? LikedMovieGenres { get; set; }
    public List<string>? DislikedMovieGenres { get; set; }
    public List<string>? LikedGameGenres { get; set; }
    public List<string>? DislikedGameGenres { get; set; }
}
