using Questro.Shared.Contracts.Family;
using Questro.Shared.Result;

namespace Questro.Service.Abstractions.Users;

public interface IFamilyManagementService
{
	Task<Result<ChildAccountResponseDto>> CreateChildAccountAsync(
		long parentId, CreateChildAccountRequestDto request, CancellationToken cancellationToken = default);

	Task<Result<IEnumerable<ChildAccountResponseDto>>> GetChildrenAsync(
		long parentId, CancellationToken cancellationToken = default);

	Task<Result<ChildRestrictionDto>> UpdateChildRestrictionsAsync(
		long parentId, long childId, ChildRestrictionDto request, CancellationToken cancellationToken = default);

	Task<Result<ChildRestrictionDto?>> GetMyRestrictionsAsync(
		long userId, CancellationToken cancellationToken = default);
}
