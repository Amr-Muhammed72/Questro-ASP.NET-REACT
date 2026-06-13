using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Games;

namespace Questro.API.Controllers.Games;

[ApiController]
[Route("api/game-sync")]
public class GameSyncController : ControllerBase
{
    private readonly IGameSyncService _gameSyncService;

    public GameSyncController(IGameSyncService gameSyncService)
    {
        _gameSyncService = gameSyncService;
    }

    [HttpPost("{rawgId:int}")]
    public async Task<IActionResult> FetchByRawgId([FromRoute] int rawgId, CancellationToken cancellationToken = default)
    {
        var result = await _gameSyncService.FetchAndSaveGameByRawgIdAsync(rawgId, cancellationToken);
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
}
