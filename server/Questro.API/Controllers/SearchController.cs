using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Search;
using Questro.Shared.Contracts.Search;

namespace Questro.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class SearchController : ApiControllerBase
{
    private readonly IGlobalSearchService _searchService;

    public SearchController(IGlobalSearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet]
    public async Task<ActionResult<GlobalSearchResultDto>> GlobalSearch([FromQuery] string q, [FromQuery] int limit = 5, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(new GlobalSearchResultDto());
        }

        var isChildAccountClaim = User.FindFirst("IsChildAccount")?.Value;
        var isChildAccount = isChildAccountClaim == "true";

        var result = await _searchService.SearchAsync(q, isChildAccount, limit, cancellationToken);
        return Ok(result);
    }
}
