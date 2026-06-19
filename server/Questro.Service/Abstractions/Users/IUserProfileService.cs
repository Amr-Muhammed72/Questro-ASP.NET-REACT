using Questro.Shared.Contracts.Users;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Users;

public interface IUserProfileService
{
    Task<Result<UserProfileDto>> GetProfileAsync(long targetUserId, long? currentUserId, CancellationToken cancellationToken = default);
    Task<Result<UserProfileDto>> UpdateProfileAsync(long userId, UpdateProfileRequestDto request, CancellationToken cancellationToken = default);
    Task<Result<string>> UpdateProfilePictureAsync(long userId, Stream fileStream, string fileName, CancellationToken cancellationToken = default);
    Task<Result<UserProfileDto>> SubmitSurveyAsync(long userId, SubmitSurveyRequestDto request, CancellationToken cancellationToken = default);
    Task<Result<SurveyCompletionStatusDto>> GetSurveyCompletionStatusAsync(long userId, CancellationToken cancellationToken = default);
}
