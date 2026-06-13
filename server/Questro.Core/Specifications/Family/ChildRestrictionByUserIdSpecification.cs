using Questro.Core.Entities.UserManagement;

namespace Questro.Core.Specifications.Family;

public class ChildRestrictionByUserIdSpecification : BaseSpecification<ChildRestriction>
{
	public ChildRestrictionByUserIdSpecification(long userId)
		: base(x => x.UserId == userId)
	{
	}
}
