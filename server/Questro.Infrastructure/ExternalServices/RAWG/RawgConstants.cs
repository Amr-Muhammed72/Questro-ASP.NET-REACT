namespace Questro.Infrastructure.ExternalServices.RAWG;

internal static class RawgConstants
{
    internal static class Endpoints
    {
        public const string Games = "games";
        public const string Genres = "genres";
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
        public const string MetacriticGte = "metacritic_gte";
        public const string MetacriticLte = "metacritic_lte";
    }

    internal static class QueryValues
    {
        public const int DefaultPageSize = 20;
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
