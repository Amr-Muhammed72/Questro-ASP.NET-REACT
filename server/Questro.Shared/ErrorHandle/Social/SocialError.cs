using static Questro.Shared.ErrorHandle.Error;

namespace Questro.Shared.ErrorHandle.Social;

public static class SocialError
{
    public static readonly Errors AlreadyFollowing =
        new("Social.AlreadyFollowing", "You are already following this user.", 409);

    public static readonly Errors CannotFollowSelf =
        new("Social.CannotFollowSelf", "You cannot follow yourself.", 400);

    public static readonly Errors NotFollowing =
        new("Social.NotFollowing", "You are not following this user.", 404);

    public static readonly Errors UserNotFound =
        new("Social.UserNotFound", "The specified user was not found.", 404);

    public static readonly Errors HistoryIsPrivate =
        new("Social.HistoryIsPrivate", "This user's history is private.", 403);
}
