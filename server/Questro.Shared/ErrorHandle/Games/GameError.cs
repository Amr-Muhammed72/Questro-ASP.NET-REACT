using static Questro.Shared.ErrorHandle.Error;

namespace Questro.Shared.ErrorHandle.Games;

public static class GameError
{
    public static readonly Errors NotFound =
        new("Game.NotFound", "No games found.", 404);

    public static readonly Errors InvalidRawgId =
        new("Game.InvalidRawgId", "RAWG id must be greater than zero.", 400);

    public static readonly Errors GenresNotFound =
        new("Game.GenresNotFound", "No game genres found.", 404);

    public static readonly Errors TagsNotFound =
        new("Game.TagsNotFound", "No game tags found.", 404);

    public static readonly Errors PlatformsNotFound =
        new("Game.PlatformsNotFound", "No game platforms found.", 404);

    public static readonly Errors TrendingUnavailable =
        new("Game.TrendingUnavailable", "Trending games are currently unavailable.", 503);

    public static readonly Errors RecentlyAddedUnavailable =
        new("Game.RecentlyAddedUnavailable", "Recently added games are currently unavailable.", 503);

    public static readonly Errors InvalidRating =
        new("Game.InvalidRating", "Rating must be between 1 and 5.", 400);

    public static readonly Errors UnauthorizedInteraction =
        new("Game.UnauthorizedInteraction", "You must be signed in to perform this action.", 401);

    public static readonly Errors ReviewNotFound =
        new("Game.ReviewNotFound", "Game review was not found.", 404);

    public static readonly Errors ReviewAlreadyExists =
        new("Game.ReviewAlreadyExists", "You have already submitted a review for this game.", 409);

    public static readonly Errors ReviewBodyInvalid =
        new("Game.ReviewBodyInvalid", "Review text is required.", 400);

    public static readonly Errors ReviewBodyTooLong =
        new("Game.ReviewBodyTooLong", "Review text is too long.", 400);
}
