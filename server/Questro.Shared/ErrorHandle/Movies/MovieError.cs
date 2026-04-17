using static Questro.Shared.ErrorHandle.Error;

namespace Questro.Shared.ErrorHandle.Movies;

public static class MovieError
{
    public static readonly Errors NotFound =
        new("Movie.NotFound", "No movies found.", 404);

    public static readonly Errors InvalidTmdbId =
        new("Movie.InvalidTmdbId", "TMDB id must be greater than zero.", 400);

    public static readonly Errors GenresNotFound =
        new("Movie.GenresNotFound", "No movie genres found.", 404);

    public static readonly Errors TrendingUnavailable =
        new("Movie.TrendingUnavailable", "Trending movies are currently unavailable.", 503);

    public static readonly Errors RecentlyAddedUnavailable =
        new("Movie.RecentlyAddedUnavailable", "Recently added movies are currently unavailable.", 503);

    public static readonly Errors CreditsUnavailable =
        new("Movie.CreditsUnavailable", "Movie credits are currently unavailable.", 503);

    public static readonly Errors StaffNotFound =
        new("Movie.StaffNotFound", "Staff member was not found.", 404);

    public static readonly Errors InvalidRating =
        new("Movie.InvalidRating", "Rating must be between 1 and 5.", 400);

    public static readonly Errors UnauthorizedInteraction =
        new("Movie.UnauthorizedInteraction", "You must be signed in to perform this action.", 401);

    public static readonly Errors ReviewNotFound =
        new("Movie.ReviewNotFound", "Movie review was not found.", 404);

    public static readonly Errors ReviewAlreadyExists =
        new("Movie.ReviewAlreadyExists", "You have already submitted a review for this movie.", 409);

    public static readonly Errors ReviewBodyInvalid =
        new("Movie.ReviewBodyInvalid", "Review text is required.", 400);

    public static readonly Errors ReviewBodyTooLong =
        new("Movie.ReviewBodyTooLong", "Review text is too long.", 400);
}