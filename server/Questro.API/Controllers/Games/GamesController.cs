using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Games;
using Questro.Shared.Contracts.Games;
using System.Security.Claims;

namespace Questro.API.Controllers.Games
{
    [Route("api/[controller]")]
    [ApiController]
    public class GamesController : ControllerBase
    {
        private readonly IGameCatalogServices _gamesServices;
        private readonly IGameDetailsService _gameDetailsService;
        public GamesController(IGameCatalogServices gamesServices, IGameDetailsService gameDetailsService)
        {
            _gamesServices = gamesServices;
            _gameDetailsService = gameDetailsService;
        }

        [HttpGet]
        public async Task<IActionResult> GetGames([FromQuery] GameSpecParams specParams, CancellationToken cancellationToken = default)
        {
            var userId = GetCurrentUserId();
            var result = await _gamesServices.GetGamesAsync(specParams, userId, cancellationToken);

            if (result.IsFailure)
            {
                var errorResponse = new
                {
                    code = result.Error.Code,
                    message = result.Error.en,
                    details = result.Details
                };
                return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
            }

            return Ok(result.Value);
        }

        [HttpGet("recently-added")]
        public async Task<IActionResult> GetRecentlyAdded([FromQuery] int take = 20, CancellationToken cancellationToken = default)
        {
            var userId = GetCurrentUserId();
            var result = await _gamesServices.GetRecentlyAddedAsync(take, userId, cancellationToken);

            if (result.IsFailure)
            {
                var errorResponse = new
                {
                    code = result.Error.Code,
                    message = result.Error.en,
                    details = result.Details
                };
                return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
            }

            return Ok(result.Value);
        }

        [HttpGet("trending")]
        public async Task<IActionResult> GetTrending([FromQuery] int take = 30, CancellationToken cancellationToken = default)
        {
            var userId = GetCurrentUserId();
            var result = await _gamesServices.GetTrendingAsync(take, userId, cancellationToken);

            if (result.IsFailure)
            {
                var errorResponse = new
                {
                    code = result.Error.Code,
                    message = result.Error.en,
                    details = result.Details
                };
                return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
            }

            return Ok(result.Value);
        }
        [HttpGet("genres")]
        public async Task<IActionResult> GetGenres(CancellationToken cancellationToken = default)
        {
            var result = await _gamesServices.GetGameGenresAsync(cancellationToken);
            if (result.IsFailure)
            {
                var errorResponse = new
                {
                    code = result.Error.Code,
                    message = result.Error.en,
                    details = result.Details
                };
                return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
            }
            return Ok(result.Value);
        }

       

        [HttpGet("platforms")]
        public async Task<IActionResult> GetPlatforms(CancellationToken cancellationToken = default)
        {
            var result = await _gamesServices.GetGamePlatformsAsync(cancellationToken);
            if (result.IsFailure)
            {
                var errorResponse = new
                {
                    code = result.Error.Code,
                    message = result.Error.en,
                    details = result.Details
                };
                return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
            }

            return Ok(result.Value);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetGameDetails([FromRoute] int id, CancellationToken cancellationToken = default)
        {
            var result = await _gameDetailsService.GetGameDetailsAsync(id, cancellationToken);
            if (result.IsFailure)
            {
                var errorResponse = new
                {
                    code = result.Error.Code,
                    message = result.Error.en,
                    details = result.Details
                };
                return StatusCode(result.Error.StatusCode ?? 500, errorResponse);
            }

            return Ok(result.Value);
        }
        [Authorize]
        [HttpGet("recommended-for-me")]
        public async Task<IActionResult> GetRecommendedForMe([FromQuery] int take = 20, CancellationToken cancellationToken = default)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized();
            }

            var result = await _gamesServices.GetRecommendedForMeAsync(userId.Value, take, cancellationToken);
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
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? User.FindFirstValue("sub");

            return long.TryParse(userIdValue, out var userId)
                ? userId
                : null;
        }
    }
}
