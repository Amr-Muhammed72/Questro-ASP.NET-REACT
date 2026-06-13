using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Questro.Service.Abstractions.Users;
using Questro.Shared.Contracts.Family;

namespace Questro.API.Controllers.Users;

[Route("api/family")]
[Authorize]
public class FamilyController : ApiControllerBase
{
	private readonly IFamilyManagementService _familyManagementService;

	public FamilyController(IFamilyManagementService familyManagementService)
	{
		_familyManagementService = familyManagementService;
	}

	[HttpPost("children")]
	public async Task<IActionResult> CreateChildAccount(
		[FromBody] CreateChildAccountRequestDto request,
		CancellationToken cancellationToken = default)
	{
		var parentId = GetCurrentUserId();
		if (!parentId.HasValue) return Unauthorized();

		var result = await _familyManagementService.CreateChildAccountAsync(parentId.Value, request, cancellationToken);
		return HandleResult(result);
	}

	[HttpGet("children")]
	public async Task<IActionResult> GetChildren(CancellationToken cancellationToken = default)
	{
		var parentId = GetCurrentUserId();
		if (!parentId.HasValue) return Unauthorized();

		var result = await _familyManagementService.GetChildrenAsync(parentId.Value, cancellationToken);
		return HandleResult(result);
	}

	[HttpPut("children/{childId:long}/restrictions")]
	public async Task<IActionResult> UpdateChildRestrictions(
		[FromRoute] long childId,
		[FromBody] ChildRestrictionDto request,
		CancellationToken cancellationToken = default)
	{
		var parentId = GetCurrentUserId();
		if (!parentId.HasValue) return Unauthorized();

		var result = await _familyManagementService.UpdateChildRestrictionsAsync(parentId.Value, childId, request, cancellationToken);
		return HandleResult(result);
	}
}
