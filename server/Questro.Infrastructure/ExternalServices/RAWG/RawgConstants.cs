namespace Questro.Infrastructure.ExternalServices.RAWG;

internal static class RawgConstants
{
    internal static class Endpoints
    {
        public const string Games = "games";
        public const string Genres = "genres";
        public const string Tags = "tags";
        public const string Platforms = "platforms";
        public const string Suggested = "suggested";
        public const string Movies = "movies";
        public const string Screenshots = "screenshots";
    }

    internal static class QueryKeys
    {
        public const string Key = "key";
        public const string Page = "page";
        public const string PageSize = "page_size";
        public const string Search = "search";
        public const string Ordering = "ordering";
        public const string Genres = "genres";
        public const string Platforms = "platforms";
        public const string Tags = "tags";
        public const string MetacriticGte = "metacritic_gte";   // kept for safety — not used
        public const string MetacriticLte = "metacritic_lte";   // kept for safety — not used
        public const string Metacritic = "metacritic";           // real RAWG param: "80,100"
        public const string Dates = "dates";                     // real RAWG param: "2010-01-01,2010-12-31"
        // Global Shield — always exclude explicit tags
        public const string ExcludeTags = "exclude_tags";
        // Child Shield — ESRB rating cap
        public const string EsrbRating = "esrb_rating";
    }

    internal static class QueryValues
    {
        public const int DefaultPageSize = 40;
    }

    internal static class SortValues
    {
        public const string ReleaseDateDesc = "-released";
        public const string ReleaseDateAsc = "released";
        public const string PopularityDesc = "-rating";
        public const string PopularityAsc = "rating";
        public const string TrendingDesc = "-added";
        public const string TrendingAsc = "added";
    }
}
