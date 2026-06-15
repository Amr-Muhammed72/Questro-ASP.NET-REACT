using static Questro.Shared.ErrorHandle.Error;

namespace Questro.Shared.ErrorHandle.Family;

public static class FamilyError
{
	public static readonly Errors NotAParent =
		new("Family.NotAParent", "Only parent accounts can manage children.", 403);

	public static readonly Errors ChildNotFound =
		new("Family.ChildNotFound", "Child account not found.", 404);

	public static readonly Errors ChildNotOwned =
		new("Family.ChildNotOwned", "This child does not belong to your account.", 403);

	public static readonly Errors ChildCannotHaveChildren =
		new("Family.ChildCannotHaveChildren", "Child accounts cannot create sub-accounts.", 403);

	public static readonly Errors CreateChildFailed =
		new("Family.CreateChildFailed", "Failed to create child account.", 500);

	public static readonly Errors RestrictionsNotFound =
		new("Family.RestrictionsNotFound", "Restrictions record not found for this child.", 404);

	public static readonly Errors ChangePasswordFailed =
		new("Family.ChangePasswordFailed", "Failed to change child password.", 500);

	public static readonly Errors DeleteChildFailed =
		new("Family.DeleteChildFailed", "Failed to delete child account.", 500);
}
