namespace Questro.Shared.Contracts.Movies;

public sealed record MovieStaffCreditDto(
    int? StaffId,
    int TmdbId,
    string Name,
    string? Department,
    string? Role,
    string? ProfileUrl);
