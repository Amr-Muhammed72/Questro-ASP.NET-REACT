namespace Questro.Infrastructure.ExternalServices.Tmdb;

internal static class TmdbConstants
{
    internal static class Endpoints
    {
        public const string TrendingMovieWeek = "trending/movie/week";
        public const string NowPlayingMovie = "movie/now_playing";
        public const string DiscoverMovie = "discover/movie";
        public const string SearchMovie = "search/movie";
        public const string SearchPerson = "search/person";
        public const string GenreMovieList = "genre/movie/list";
        public const string Movie = "movie";
        public const string Person = "person";
        public const string Credits = "credits";
        public const string Videos = "videos";
        public const string Similar = "similar";
        public const string WatchProviders = "watch/providers";
    }

    internal static class QueryKeys
    {
        public const string ApiKey = "api_key";
        public const string Page = "page";
        public const string SortBy = "sort_by";
        public const string WithGenres = "with_genres";
        public const string WithOriginalLanguage = "with_original_language";
        public const string PrimaryReleaseYear = "primary_release_year";
        public const string VoteAverageGte = "vote_average.gte";
        public const string VoteAverageLte = "vote_average.lte";
        public const string IncludeAdult = "include_adult";
        public const string Query = "query";
        public const string Year = "year";
        // Child Shield — certification filter (Discover only)
        public const string CertificationCountry = "certification_country";
        public const string CertificationLte = "certification.lte";
        public const string WithoutKeywords = "without_keywords";
        public const string AppendToResponse = "append_to_response";
    }

    internal static class ContentSafety
    {
        public const string BannedKeywordIds = "156343|190453|161176|104514|163013|10036";
        public static readonly HashSet<string> BannedKeywordNames = new(StringComparer.OrdinalIgnoreCase)
        {
            "softcore",
            "intimacy",
            "unsimulated sex",
            "erotica",
            "porn",
            "pornography",
            "sex",
            "adult film"
        };

        public static readonly HashSet<int> BannedMovieIds = new()
        {
            259872,  // Skin. Like. Sun.
            15045,   // American Swing
            407806,  // Le Clitoris
            1228206, // 1000 Men and Me: The Bonnie Blue Story
            15024,   // Damage (1992)
            3284     // 9 Songs (2004)
        };
    }

    internal static class QueryValues
    {
        public const string False = "false";
        public const string True = "true";
        public const string CertificationCountryUs = "US";
    }

    internal static class SortValues
    {
        public const string PrimaryReleaseDateDesc = "primary_release_date.desc";
        public const string PrimaryReleaseDateAsc = "primary_release_date.asc";
        public const string PopularityDesc = "popularity.desc";
        public const string PopularityAsc = "popularity.asc";
        public const string VoteAverageDesc = "vote_average.desc";
        public const string VoteAverageAsc = "vote_average.asc";
    }
}
