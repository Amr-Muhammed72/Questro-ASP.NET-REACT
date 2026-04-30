using Questro.Core.Entities.Games;
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
        private readonly IRawgService _rawgservices;
        private readonly IGenericRepository<GameGenre> _gameGenreRepository;
        public GameCatalogServices(
            IRawgService rawgservices,
            IGenericRepository<GameGenre> gameGenreRepository)
        {
            _rawgservices = rawgservices;
            _gameGenreRepository = gameGenreRepository;
        }
        public async Task<Result<PagedResponse<GameListItemDto>>> GetGamesAsync(GameSpecParams specParams, CancellationToken cancellationToken = default)
        {
            var parameters = specParams ?? new GameSpecParams();
            var safePageIndex = parameters.PageIndex < 1 ? 1 : parameters.PageIndex;
            var safePageSize = parameters.PageSize < 1 ? 20 : parameters.PageSize;

            var genreMap = await GetLocalGenreMapAsync(cancellationToken);
            RawgPagedGameResponse? rawgResponse = string.IsNullOrWhiteSpace(parameters.Search)
                ? await _rawgservices.DiscoverGamesAsync(parameters, cancellationToken)
                : await _rawgservices.SearchGamesAsync(parameters, cancellationToken);
            
            if (rawgResponse is null || !rawgResponse.Results.Any())
            {
                return Result.Success(
                    new PagedResponse<GameListItemDto>
                    {
                        Data = Enumerable.Empty<GameListItemDto>(),
                        PageNumber = safePageIndex,
                        PageSize = safePageSize,
                        TotalCount = 0,
                        TotalPages = 0
                    }
                );
            }

            var filteredResults = ApplySearch(rawgResponse.Results, parameters);
            var mappedGames = filteredResults.Take(safePageSize)
                .Select(x => MapToGameListItemDto(x, genreMap))
                .ToList();

            var totalCount = rawgResponse.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / safePageSize);

            return Result.Success(
                new PagedResponse<GameListItemDto>
                {
                    Data = mappedGames,
                    PageNumber = safePageIndex,
                    PageSize = safePageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages
                }
            );
        }
        public async Task<Result<PagedResponse<GameListItemDto>>> GetRecentlyAddedAsync(int take = 20, CancellationToken cancellationToken = default)
        {
            var safeTake = take < 1 ? 20 : take;
            var genreMap = await GetLocalGenreMapAsync(cancellationToken);

            var specParams = new GameSpecParams
            {
                PageIndex = 1,
                PageSize = safeTake * 2,
                Sort = "latest"
            };

            var rawgResponse = await _rawgservices.DiscoverGamesAsync(specParams, cancellationToken);

            if (rawgResponse is null || !rawgResponse.Results.Any())
            {
                return Result.Success(
                    new PagedResponse<GameListItemDto>
                    {
                        Data = Enumerable.Empty<GameListItemDto>(),
                        PageNumber = 1,
                        PageSize = safeTake,
                        TotalCount = 0,
                        TotalPages = 0
                    }
                );
            }

            var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-30);
            var recentOnly = rawgResponse.Results
                .Where(x => ParseDate(x.Released) is DateTime releaseDate && releaseDate.Date >= thirtyDaysAgo)
                .ToList();

            if (recentOnly.Count == 0)
            {
                recentOnly = rawgResponse.Results.Take(safeTake).ToList();
            }

            var mappedGames = recentOnly
                .Take(safeTake)
                .Select(x => MapToGameListItemDto(x, genreMap))
                .ToList();

            return Result.Success(
                new PagedResponse<GameListItemDto>
                {
                    Data = mappedGames,
                    PageNumber = 1,
                    PageSize = safeTake,
                    TotalCount = mappedGames.Count,
                    TotalPages = 1
                }
            );
        }

        public async Task<Result<PagedResponse<GameListItemDto>>> GetTrendingAsync(int take = 30, CancellationToken cancellationToken = default)
        {
            var safeTake = take < 1 ? 20 : take;
            var genreMap = await GetLocalGenreMapAsync(cancellationToken);

            var rawgResponse = await _rawgservices.GetTrendingGamesAsync(1, safeTake * 2, cancellationToken);

            if (rawgResponse is null || !rawgResponse.Results.Any())
            {
                return Result.Success(
                    new PagedResponse<GameListItemDto>
                    {
                        Data = Enumerable.Empty<GameListItemDto>(),
                        PageNumber = 1,
                        PageSize = safeTake,
                        TotalCount = 0,
                        TotalPages = 0
                    }
                );
            }

            var mappedGames = rawgResponse.Results
                .OrderByDescending(x => x.Rating ?? 0)
                .ThenByDescending(x => x.RatingsCount ?? 0)
                .Take(safeTake)
                .Select(x => MapToGameListItemDto(x, genreMap))
                .ToList();

            return Result.Success(
                new PagedResponse<GameListItemDto>
                {
                    Data = mappedGames,
                    PageNumber = 1,
                    PageSize = safeTake,
                    TotalCount = mappedGames.Count,
                    TotalPages = 1
                }
            );
        }
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
                .Where(x => !string.IsNullOrWhiteSpace(x.Name))
                .OrderBy(x => x.Name)
                .Select(x => new GameGenreDto(x.Id, x.Name ?? string.Empty))
                .ToList();

            return Result.Success<IEnumerable<GameGenreDto>>(ans);
        }

      

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
                .Select(g => new GameGenreDto (  g.Id,  g.Name ?? string.Empty ))
                .ToList();

            var platforms = result.Platforms?
                .Where(p => p.Platform is not null)
                .Select(p => new GamePlatformDto ( p.Platform!.Id,p.Platform!.Name ?? string.Empty ))
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

