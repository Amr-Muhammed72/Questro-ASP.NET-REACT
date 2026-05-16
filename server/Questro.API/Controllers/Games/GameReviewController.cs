using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Games;
using Questro.Shared.Contracts.Games;
using System.Security.Claims;

namespace Questro.API.Controllers.Games
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GameReviewController : ControllerBase
    {
        private readonly IGameInteractionService _gameInteractionService;
        public GameReviewController(IGameInteractionService gameInteractionService)
        {
            _gameInteractionService = gameInteractionService;
        }
        [HttpGet("{rawgId:int}/reviews")]
        [AllowAnonymous ]
        public async Task<IActionResult> GetReviews(
      [FromRoute] int rawgId,
      [FromQuery] int pageIndex = 1,
      [FromQuery] int pageSize = 20,
      CancellationToken cancellationToken = default)
        {
            var result = await _gameInteractionService.GetGameReviewsAsync(rawgId, pageIndex, pageSize, cancellationToken);
            if (result.IsFailure)
            {
                var errorResponse = new
                {
                    code = result.Error.Code,
                    en = result.Error.en,
                    Details = result.Details
                };

                return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
            }

            return Ok(result.Value);
        }

        [HttpPost("{rawgId:int}/add-review")]
        public async Task<IActionResult> AddReview(
            [FromRoute] int rawgId,
            [FromBody] CreateGameReviewRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var result = await _gameInteractionService.AddReviewAsync(rawgId, userId.Value, request.Content, cancellationToken);
            if (result.IsFailure)
            {
                var errorResponse = new
                {
                    code = result.Error.Code,
                    en = result.Error.en,
                    Details = result.Details
                };

                return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
            }

            return Ok(result.Value);
        }

        [HttpPut("{rawgId:int}/update-review")]
        public async Task<IActionResult> UpdateReview(
            [FromRoute] int rawgId,
            [FromBody] UpdateGameReviewRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var result = await _gameInteractionService.UpdateReviewAsync(rawgId, userId.Value, request.Content, cancellationToken);
            if (result.IsFailure)
            {
                var errorResponse = new
                {
                    code = result.Error.Code,
                    en = result.Error.en,
                    Details = result.Details
                };

                return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
            }

            return Ok(result.Value);
        }

        [HttpDelete("{rawgId:int}/delete-review")]
        public async Task<IActionResult> DeleteReview([FromRoute] int rawgId, CancellationToken cancellationToken = default)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var result = await _gameInteractionService.DeleteReviewAsync(rawgId, userId.Value, cancellationToken);
            if (result.IsFailure)
            {
                var errorResponse = new
                {
                    code = result.Error.Code,
                    en = result.Error.en,
                    Details = result.Details
                };

                return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
            }

            return Ok(result.Value);
        }

        private long? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }
}
