namespace Questro.Shared.Contracts.Movies;

public sealed record StaffDetailsDto(
    int? StaffId,
    int? TmdbId,
    string Name,
    string? Biography,
    DateTime? BirthDate,
    string? PlaceOfBirth,
    string? Gender,
    string? Department,
    string? ProfileUrl,
    IEnumerable<StaffMovieCreditDto> KnownForMovies);
