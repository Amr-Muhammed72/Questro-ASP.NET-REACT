using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Users;
using Questro.Shared.Contracts.Users;

namespace Questro.API.Controllers.Users;

[Route("api/users")]
public class UserProfileController : ApiControllerBase
{
    private readonly IUserProfileService _userProfileService;
    private readonly IFamilyManagementService _familyManagementService;

    public UserProfileController(
        IUserProfileService userProfileService,
        IFamilyManagementService familyManagementService)
    {
        _userProfileService = userProfileService;
        _familyManagementService = familyManagementService;
    }

    [HttpGet("{userId:long}/profile")]
    public async Task<IActionResult> GetProfile([FromRoute] long userId, CancellationToken cancellationToken = default)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _userProfileService.GetProfileAsync(userId, currentUserId, cancellationToken);
        return HandleResult(result);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _userProfileService.UpdateProfileAsync(userId.Value, request, cancellationToken);
        return HandleResult(result);
    }

    [Authorize]
    [HttpPost("profile/picture")]
    public async Task<IActionResult> UpdateProfilePicture(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        if (file is null || file.Length == 0)
            return BadRequest(new { code = "File.Empty", en = "No file was uploaded." });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { code = "File.TooLarge", en = "File size must not exceed 5 MB." });

        using var stream = file.OpenReadStream();
        var result = await _userProfileService.UpdateProfilePictureAsync(userId.Value, stream, file.FileName, cancellationToken);
        return HandleResult(result);
    }

    [Authorize]
    [HttpPost("survey")]
    public async Task<IActionResult> SubmitSurvey(
        [FromBody] SubmitSurveyRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _userProfileService.SubmitSurveyAsync(userId.Value, request, cancellationToken);
        return HandleResult(result);
    }

    [Authorize]
    [HttpGet("me/restrictions")]
    public async Task<IActionResult> GetMyRestrictions(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _familyManagementService.GetMyRestrictionsAsync(userId.Value, cancellationToken);
        return HandleResult(result);
    }

    [Authorize]
    [HttpGet("survey/completion-status")]
    public async Task<IActionResult> GetSurveyCompletionStatus(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var result = await _userProfileService.GetSurveyCompletionStatusAsync(userId.Value, cancellationToken);
        return HandleResult(result);
    }
}
