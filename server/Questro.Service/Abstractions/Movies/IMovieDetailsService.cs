using Questro.Shared.Contracts.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Movies;

public interface IMovieDetailsService
{
    Task<Result<MovieDetailsDto>> GetMovieDetailsAsync(int tmdbId, long? userId = null, CancellationToken cancellationToken = default);
    Task<Result<StaffDetailsDto>> GetStaffDetailsAsync(int tmdbId, CancellationToken cancellationToken = default);
}
