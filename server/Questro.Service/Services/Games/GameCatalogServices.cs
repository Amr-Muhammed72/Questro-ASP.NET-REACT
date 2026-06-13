using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;
using Questro.Core.Entities.Games;
using Questro.Core.Entities.UserManagement;
using Questro.Core.Specifications.Family;
using System.Globalization;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.ExternalServices.RAWG.Contracts;
using Questro.Service.Abstractions.Games;
using Questro.Shared.Contracts.Common;
using Questro.Shared.Contracts.Games;
using Questro.Shared.ErrorHandle.Games;
using Questro.Shared.Result;

namespace Questro.Service.Services.Games
{
    public class GameCatalogServices : IGameCatalogServices
    {
        private const int SafeDiscoveryPages = 5;
        private static readonly TimeSpan SafeCacheExpiration = TimeSpan.FromMinutes(30);

        private readonly IRawgService _rawgservices;
        private readonly IGenericRepository<GameGenre> _gameGenreRepository;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IGenericRepository<ChildRestriction> _restrictionRepo;
        private readonly IMemoryCache _memoryCache;

        public GameCatalogServices(
            IRawgService rawgservices,
            IGenericRepository<GameGenre> gameGenreRepository,
            UserManager<ApplicationUser> userManager,
            IGenericRepository<ChildRestriction> restrictionRepo,
            IMemoryCache memoryCache)
        {
            _rawgservices = rawgservices;
            _gameGenreRepository = gameGenreRepository;
            _userManager = userManager;
            _restrictionRepo = restrictionRepo;
            _memoryCache = memoryCache;
        }

        // ── Discover / Search ───────────────────────────────────────────────

        public async Task<Result<PagedResponse<GameListItemDto>>> GetGamesAsync(
            GameSpecParams specParams, long? userId = null, CancellationToken cancellationToken = default)
        {
            var parameters = specParams ?? new GameSpecParams();
            var safePageIndex = parameters.PageIndex < 1 ? 1 : parameters.PageIndex;
            var safePageSize =20;

            if (GameGenreResponseFilter.IsHiddenGenreId(parameters.GenreId))
            {
                return Result.Success(EmptyPagedResponse<GameListItemDto>(safePageIndex, safePageSize));
            }

            var restriction = await GetChildRestrictionAsync(userId, cancellationToken);
            if (restriction is not null && HasActiveGameRestrictions(restriction))
            {
                return await GetDiscoverSafeAsync(parameters, restriction, userId!.Value, safePageIndex, safePageSize, cancellationToken);
            }

            // Standard discovery path
            var genreMap = await GetLocalGenreMapAsync(cancellationToken);
            RawgPagedGameResponse? rawgResponse = string.IsNullOrWhiteSpace(parameters.Search)
                ? await _rawgservices.DiscoverGamesAsync(parameters, cancellationToken)
                : await _rawgservices.SearchGamesAsync(parameters, cancellationToken);
            
            if (rawgResponse is null || !rawgResponse.Results.Any())
            {
                return Result.Success(EmptyPagedResponse<GameListItemDto>(safePageIndex, safePageSize));
            }

            var filteredResults = ApplySearch(rawgResponse.Results, parameters)
                .Where(GameGenreResponseFilter.IsGameVisible);
            var mappedGames = filteredResults.Take(safePageSize)
                .Select(x => MapToGameListItemDto(x, genreMap))
                .ToList();

            var totalCount = rawgResponse.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / safePageSize);

            return Result.Success(new PagedResponse<GameListItemDto>
            {
                Data = mappedGames,
                PageNumber = safePageIndex,
                PageSize = safePageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            });
        }

        // ── Recently Added ──────────────────────────────────────────────────

        public async Task<Result<PagedResponse<GameListItemDto>>> GetRecentlyAddedAsync(
            int take = 20, long? userId = null, CancellationToken cancellationToken = default)
        {
            var safeTake = take < 1 ? 20 : take;

            var restriction = await GetChildRestrictionAsync(userId, cancellationToken);
            if (restriction is not null && HasActiveGameRestrictions(restriction))
            {
                return await GetRecentlyAddedSafeAsync(restriction, userId!.Value, safeTake, cancellationToken);
            }

            var genreMap = await GetLocalGenreMapAsync(cancellationToken);
            var oneMonthAgo = DateTime.UtcNow.Date.AddMonths(-1);
            var collectedGames = new List<RawgGameSummaryDto>();
            var page = 1;

            while (collectedGames.Count < safeTake)
            {
                var specParams = new GameSpecParams
                {
                    PageIndex = page,
                    PageSize = 40,
                    Sort = "latest"
                };

                var rawgResponse = await _rawgservices.DiscoverGamesAsync(specParams, cancellationToken);
                if (rawgResponse is null || !rawgResponse.Results.Any())
                    break;

                var filtered = rawgResponse.Results
                    .Where(x =>
                        GameGenreResponseFilter.IsGameVisible(x) &&
                        ParseDate(x.Released) is DateTime releaseDate &&
                        releaseDate.Date >= oneMonthAgo && releaseDate.Date <= DateTime.UtcNow.Date &&
                        !string.IsNullOrWhiteSpace(x.BackgroundImage))
                    .ToList();

                collectedGames.AddRange(filtered);
                page++;
            }

            var mappedGames = collectedGames
                .Take(safeTake)
                .Select(x => MapToGameListItemDto(x, genreMap))
                .ToList();

            return Result.Success(new PagedResponse<GameListItemDto>
            {
                Data = mappedGames,
                PageNumber = 1,
                PageSize = safeTake,
                TotalCount = mappedGames.Count,
                TotalPages = 1
            });
        }

        // ── Trending ────────────────────────────────────────────────────────

        public async Task<Result<PagedResponse<GameListItemDto>>> GetTrendingAsync(
            int take = 20, long? userId = null, CancellationToken cancellationToken = default)
        {
            var safeTake = take < 1 ? 20 : take;

            var restriction = await GetChildRestrictionAsync(userId, cancellationToken);
            if (restriction is not null && HasActiveGameRestrictions(restriction))
            {
                return await GetTrendingSafeAsync(restriction, userId!.Value, safeTake, cancellationToken);
            }

            var genreMap = await GetLocalGenreMapAsync(cancellationToken);
            var rawgResponse = await _rawgservices.GetTrendingGamesAsync(1, safeTake * 2, cancellationToken);

            if (rawgResponse is null || !rawgResponse.Results.Any())
            {
                return Result.Success(EmptyPagedResponse<GameListItemDto>(1, safeTake));
            }

            var mappedGames = rawgResponse.Results
                .Where(GameGenreResponseFilter.IsGameVisible)
                .OrderByDescending(x => x.Rating ?? 0)
                .ThenByDescending(x => x.RatingsCount ?? 0)
                .Take(safeTake)
                .Select(x => MapToGameListItemDto(x, genreMap))
                .ToList();

            return Result.Success(new PagedResponse<GameListItemDto>
            {
                Data = mappedGames,
                PageNumber = 1,
                PageSize = safeTake,
                TotalCount = mappedGames.Count,
                TotalPages = 1
            });
        }

        // ── Genres / Platforms / RecommendedForMe ───────────────────────────

        public Task<Result<PagedResponse<GameListItemDto>>> GetRecommendedForMeAsync(long userId, int take = 30, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public async Task<Result<IEnumerable<GameGenreDto>>> GetGameGenresAsync(CancellationToken cancellationToken = default)
        {
            var rawgGenres = await _rawgservices.GetGameGenresAsync(cancellationToken);
            if (rawgGenres?.Results is null)
            {
                return Result.Failure<IEnumerable<GameGenreDto>>(GameError.GenresNotFound);
            }

            var ans = rawgGenres.Results
                .Where(x => !string.IsNullOrWhiteSpace(x.Name) && GameGenreResponseFilter.IsVisible(x))
                .OrderBy(x => x.Name)
                .Select(x => new GameGenreDto(x.Id, x.Name ?? string.Empty))
                .ToList();

            return Result.Success<IEnumerable<GameGenreDto>>(ans);
        }

        public async Task<Result<IEnumerable<GamePlatformDto>>> GetGamePlatformsAsync(CancellationToken cancellationToken = default)
        {
            var rawgPlatforms = await _rawgservices.GetGamePlatformsAsync(cancellationToken);
            if (rawgPlatforms?.Results is null)
            {
                return Result.Failure<IEnumerable<GamePlatformDto>>(GameError.PlatformsNotFound);
            }

            var ans = rawgPlatforms.Results
                .Where(x => !string.IsNullOrWhiteSpace(x.Name))
                .OrderBy(x => x.Name)
                .Select(x => new GamePlatformDto(x.Id, x.Name ?? string.Empty))
                .ToList();

            return Result.Success<IEnumerable<GamePlatformDto>>(ans);
        }

        // ═══════════════════════════════════════════════════════════════════
        //  SAFE METHODS (Child Accounts — Blacklist Filtering)
        // ═══════════════════════════════════════════════════════════════════

        private async Task<Result<PagedResponse<GameListItemDto>>> GetDiscoverSafeAsync(
            GameSpecParams parameters,
            ChildRestriction restriction,
            long userId,
            int pageIndex,
            int pageSize,
            CancellationToken cancellationToken)
        {
            var isSearch = !string.IsNullOrWhiteSpace(parameters.Search);
            var cacheKey = isSearch
                ? BuildSafeCacheKey($"SafeSearch_Games_{parameters.Search}", userId, restriction)
                : BuildSafeCacheKey("SafeDiscover_Games", userId, restriction);

            if (!_memoryCache.TryGetValue(cacheKey, out List<RawgGameSummaryDto>? cachedGames) || cachedGames is null)
            {
                var tasks = new List<Task<RawgPagedGameResponse?>>(SafeDiscoveryPages);
                for (var page = 1; page <= SafeDiscoveryPages; page++)
                {
                    var fetchParams = new GameSpecParams
                    {
                        Search = parameters.Search,
                        Sort = parameters.Sort,
                        PlatformId = parameters.PlatformId,
                        Year = parameters.Year,
                        MinRating = parameters.MinRating,
                        MaxRating = parameters.MaxRating,
                        PageIndex = page,
                        PageSize = parameters.PageSize
                    };

                    tasks.Add(isSearch
                        ? _rawgservices.SearchGamesAsync(fetchParams, cancellationToken)
                        : _rawgservices.DiscoverGamesAsync(fetchParams, cancellationToken));
                }

                var responses = await Task.WhenAll(tasks);
                cachedGames = FilterGamesByBlacklist(responses, restriction);
                _memoryCache.Set(cacheKey, cachedGames, SafeCacheExpiration);
            }

            return await PaginateGamesFromCache(cachedGames, pageIndex, pageSize, cancellationToken);
        }

        private async Task<Result<PagedResponse<GameListItemDto>>> GetTrendingSafeAsync(
            ChildRestriction restriction,
            long userId,
            int take,
            CancellationToken cancellationToken)
        {
            var cacheKey = BuildSafeCacheKey("SafeTrending_Games", userId, restriction);

            if (!_memoryCache.TryGetValue(cacheKey, out List<RawgGameSummaryDto>? cachedGames) || cachedGames is null)
            {
                var tasks = Enumerable.Range(1, SafeDiscoveryPages)
                    .Select(page => _rawgservices.GetTrendingGamesAsync(page, 40, cancellationToken))
                    .ToList();

                var responses = await Task.WhenAll(tasks);
                cachedGames = FilterGamesByBlacklist(responses, restriction);
                _memoryCache.Set(cacheKey, cachedGames, SafeCacheExpiration);
            }

            var genreMap = await GetLocalGenreMapAsync(cancellationToken);
            var mapped = cachedGames
                .OrderByDescending(x => x.Rating ?? 0)
                .ThenByDescending(x => x.RatingsCount ?? 0)
                .Take(take)
                .Select(x => MapToGameListItemDto(x, genreMap))
                .ToList();

            return Result.Success(new PagedResponse<GameListItemDto>
            {
                Data = mapped,
                PageNumber = 1,
                PageSize = take,
                TotalCount = mapped.Count,
                TotalPages = 1
            });
        }

        private async Task<Result<PagedResponse<GameListItemDto>>> GetRecentlyAddedSafeAsync(
            ChildRestriction restriction,
            long userId,
            int take,
            CancellationToken cancellationToken)
        {
            var cacheKey = BuildSafeCacheKey("SafeRecentlyAdded_Games", userId, restriction);

            if (!_memoryCache.TryGetValue(cacheKey, out List<RawgGameSummaryDto>? cachedGames) || cachedGames is null)
            {
                var tasks = Enumerable.Range(1, SafeDiscoveryPages)
                    .Select(page =>
                    {
                        var fetchParams = new GameSpecParams
                        {
                            PageIndex = page,
                            PageSize = 40,
                            Sort = "latest"
                        };
                        return _rawgservices.DiscoverGamesAsync(fetchParams, cancellationToken);
                    })
                    .ToList();

                var responses = await Task.WhenAll(tasks);

                // Apply blacklist filter + recency + image requirement
                var oneMonthAgo = DateTime.UtcNow.Date.AddMonths(-1);
                var blockedSet = new HashSet<int>(restriction.BlockedGameGenreIds);

                cachedGames = responses
                    .Where(r => r?.Results is not null)
                    .SelectMany(r => r!.Results)
                    .Where(GameGenreResponseFilter.IsGameVisible)
                    .Where(g => !g.Genres.Any(genre => blockedSet.Contains(genre.Id)))
                    .Where(g => ParseDate(g.Released) is DateTime rd &&
                                rd.Date >= oneMonthAgo && rd.Date <= DateTime.UtcNow.Date)
                    .Where(g => !string.IsNullOrWhiteSpace(g.BackgroundImage))
                    .ToList();

                // Apply metacritic cap if set
                if (restriction.MaxMetacriticRating.HasValue)
                {
                    cachedGames = cachedGames
                        .Where(g => (g.Rating ?? 0) <= restriction.MaxMetacriticRating.Value)
                        .ToList();
                }

                _memoryCache.Set(cacheKey, cachedGames, SafeCacheExpiration);
            }

            var genreMap = await GetLocalGenreMapAsync(cancellationToken);
            var mapped = cachedGames.Take(take)
                .Select(x => MapToGameListItemDto(x, genreMap))
                .ToList();

            return Result.Success(new PagedResponse<GameListItemDto>
            {
                Data = mapped,
                PageNumber = 1,
                PageSize = take,
                TotalCount = mapped.Count,
                TotalPages = 1
            });
        }

        // ═══════════════════════════════════════════════════════════════════
        //  SHARED HELPERS
        // ═══════════════════════════════════════════════════════════════════

        /// <summary>
        /// Core blacklist filter: a game is safe ONLY IF it does NOT contain ANY blocked genres.
        /// </summary>
        private static List<RawgGameSummaryDto> FilterGamesByBlacklist(
            RawgPagedGameResponse?[] responses, ChildRestriction restriction)
        {
            var blockedSet = new HashSet<int>(restriction.BlockedGameGenreIds);

            var result = responses
                .Where(r => r?.Results is not null)
                .SelectMany(r => r!.Results)
                .Where(GameGenreResponseFilter.IsGameVisible)
                .Where(g => !g.Genres.Any(genre => blockedSet.Contains(genre.Id)))
                .ToList();

            // Apply metacritic cap if set
            if (restriction.MaxMetacriticRating.HasValue)
            {
                result = result
                    .Where(g => (g.Rating ?? 0) <= restriction.MaxMetacriticRating.Value)
                    .ToList();
            }

            return result;
        }

        private async Task<Result<PagedResponse<GameListItemDto>>> PaginateGamesFromCache(
            List<RawgGameSummaryDto> cachedGames,
            int pageIndex,
            int pageSize,
            CancellationToken cancellationToken)
        {
            var totalCount = cachedGames.Count;
            var skip = (pageIndex - 1) * pageSize;
            var pageSlice = cachedGames.Skip(skip).Take(pageSize).ToList();

            var genreMap = await GetLocalGenreMapAsync(cancellationToken);
            var mapped = pageSlice.Select(x => MapToGameListItemDto(x, genreMap)).ToList();

            return Result.Success(new PagedResponse<GameListItemDto>
            {
                Data = mapped,
                PageNumber = pageIndex,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }

        private static bool HasActiveGameRestrictions(ChildRestriction r) =>
            r.BlockedGameGenreIds.Count > 0 || r.MaxMetacriticRating.HasValue;

        private async Task<ChildRestriction?> GetChildRestrictionAsync(long? userId, CancellationToken cancellationToken)
        {
            if (!userId.HasValue)
                return null;

            var user = await _userManager.FindByIdAsync(userId.Value.ToString());
            if (user is null || !user.IsChildAccount)
                return null;

            var spec = new ChildRestrictionByUserIdSpecification(userId.Value);
            return await _restrictionRepo.GetEntityWithSpecAsync(spec, cancellationToken);
        }

        private static string BuildSafeCacheKey(string prefix, long userId, ChildRestriction restriction)
        {
            var genreHash = string.Join(",", restriction.BlockedGameGenreIds.OrderBy(x => x));
            var ratingHash = restriction.MaxMetacriticRating?.ToString(CultureInfo.InvariantCulture) ?? "none";
            return $"{prefix}_{userId}_{genreHash}_{ratingHash}";
        }

        private static PagedResponse<T> EmptyPagedResponse<T>(int pageIndex, int pageSize) => new()
        {
            Data = Enumerable.Empty<T>(),
            PageNumber = pageIndex,
            PageSize = pageSize,
            TotalCount = 0,
            TotalPages = 0
        };

        private async Task<Dictionary<int, string>> GetLocalGenreMapAsync(CancellationToken cancellationToken)
        {
            var localGenres = await _gameGenreRepository.ListAllAsync(cancellationToken);
            return localGenres
                .Where(x => x.RAWG_Id.HasValue)
                .GroupBy(x => x.RAWG_Id!.Value)
                .ToDictionary(x => x.Key, x => x.First().Name);
        }

        private static GameListItemDto MapToGameListItemDto(RawgGameSummaryDto result, Dictionary<int, string> genreMap)
        {
            var genres = result.Genres
                .Select(g => new GameGenreDto(g.Id, g.Name ?? string.Empty))
                .Where(GameGenreResponseFilter.IsVisible)
                .ToList();

            var platforms = result.Platforms?
                .Where(p => p.Platform is not null)
                .Select(p => new GamePlatformDto(p.Platform!.Id, p.Platform!.Name ?? string.Empty))
                .ToList();

            return new GameListItemDto
            {
                GameId = 0,
                RawgId = result.Id,
                Title = result.Name ?? string.Empty,
                ReleaseDate = DateTime.TryParse(result.Released, out var releaseDate) ? releaseDate : null,
                Rating = result.Rating,
                PosterUrl = result.BackgroundImage,
                Genres = genres,
                Platforms = platforms ?? Enumerable.Empty<GamePlatformDto>()
            };
        }

        private static IEnumerable<RawgGameSummaryDto> ApplySearch(IEnumerable<RawgGameSummaryDto> source, GameSpecParams parameters)
        {
            var query = source;

            if (!string.IsNullOrWhiteSpace(parameters.Search))
            {
                var search = parameters.Search.Trim();
                query = query.Where(x => x.Name?.Contains(search, StringComparison.OrdinalIgnoreCase) == true);
            }

            if (parameters.MinRating.HasValue)
            {
                query = query.Where(x => (x.Rating ?? 0) >= parameters.MinRating.Value);
            }

            if (parameters.MaxRating.HasValue)
            {
                query = query.Where(x => (x.Rating ?? 0) <= parameters.MaxRating.Value);
            }

            if (parameters.Year.HasValue)
            {
                query = query.Where(x => ParseDate(x.Released)?.Year == parameters.Year.Value);
            }

            if (parameters.GenreId.HasValue)
            {
                query = query.Where(x => x.Genres.Any(g => g.Id == parameters.GenreId.Value));
            }

            return query;
        }

        private static IReadOnlyCollection<string> SplitTags(string? tags)
        {
            if (string.IsNullOrWhiteSpace(tags))
            {
                return Array.Empty<string>();
            }

            return tags
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

        private static bool MatchesTags(RawgGameSummaryDto game, IReadOnlyCollection<string> tags)
        {
            var gameTags = game.Tags
                .SelectMany(x => new[]
                {
                    x.Id.ToString(CultureInfo.InvariantCulture),
                    x.Slug,
                    x.Name
                })
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            return tags.All(gameTags.Contains);
        }

        private static DateTime? ParseDate(string? dateString)
        {
            if (string.IsNullOrWhiteSpace(dateString))
            {
                return null;
            }

            if (DateTime.TryParse(dateString, out var result))
            {
                return result;
            }

            return null;
        }
    }
}
