using Questro.Core.Entities.Games;
using Questro.Core.Specifications.Games;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.ExternalServices.RAWG.Contracts;
using Questro.Service.Abstractions.Games;
using Questro.Shared.Contracts.Games;
using Questro.Shared.ErrorHandle.Games;
using Questro.Shared.Result;

namespace Questro.Service.Services.Games;

public sealed class GameDetailsService : IGameDetailsService
{
    private const int DefaultTake = 20;

    private readonly IGenericRepository<Game> _gameRepository;
    private readonly IRawgService _rawgService;
    private readonly IGameSyncService _gameSyncService;

    public GameDetailsService(
        IGenericRepository<Game> gameRepository,
        IRawgService rawgService,
        IGameSyncService gameSyncService)
    {
        _gameRepository = gameRepository;
        _rawgService = rawgService;
        _gameSyncService = gameSyncService;
    }

    public async Task<Result<GameDetailsDto>> GetGameDetailsAsync(int rawgId, CancellationToken cancellationToken = default)
    {
        if (rawgId <= 0)
        {
            return Result.Failure<GameDetailsDto>(GameError.InvalidRawgId);
        }

        var localGame = await _gameRepository.GetEntityWithSpecAsync(
            new GameDetailsByRawgIdSpecification(rawgId),
            cancellationToken);

        if (localGame is null)
        {
            await _gameSyncService.FetchAndSaveGameByRawgIdAsync(rawgId, cancellationToken);
            localGame = await _gameRepository.GetEntityWithSpecAsync(
                new GameDetailsByRawgIdSpecification(rawgId),
                cancellationToken);
        }

        var rawgDetails = await _rawgService.GetGameDetailsAsync(rawgId, cancellationToken);
        if (rawgDetails is null && localGame is null)
        {
            return Result.Failure<GameDetailsDto>(GameError.NotFound);
        }

        var trailerUrl = await ResolveTrailerUrlAsync(rawgId, cancellationToken);
        var screenshots = await _rawgService.GetGameScreenshotsAsync(rawgId, cancellationToken);

        var similarGames = await MapSimilarGamesAsync(rawgId, localGame, rawgDetails, cancellationToken);
        GameDetailsDto? details = MapGameDetails(localGame, rawgDetails, trailerUrl, similarGames, screenshots);
        
        return Result.Success(details);
    }

    private async Task<IEnumerable<GameListItemDto>> MapSimilarGamesAsync(
        int rawgId,
        Game? localGame,
        RawgGameDetailsResponse? rawgDetails,
        CancellationToken cancellationToken)
    {
        var rawgSimilar = await _rawgService.GetSimilarGamesAsync(
            rawgId,
            pageSize: DefaultTake,
            cancellationToken: cancellationToken);

        if (rawgSimilar?.Results is null || rawgSimilar.Results.Count == 0)
        {
            rawgSimilar = await DiscoverSimilarGamesFallbackAsync(rawgId, localGame, rawgDetails, cancellationToken);
        }

        var rawgGames = rawgSimilar?.Results
            .Where(x => x.Id > 0 && x.Id != rawgId)
            .DistinctBy(x => x.Id)
            .Take(DefaultTake)
            .ToList() ?? new List<RawgGameSummaryDto>();

        if (rawgGames.Count == 0)
        {
            return Enumerable.Empty<GameListItemDto>();
        }

        var localGameIdMap = await BuildLocalGameIdMapAsync(
            rawgGames.Select(x => x.Id),
            cancellationToken);

        

        return rawgGames
            .Select(x => MapSimilarGame(x, localGameIdMap))
            .ToList();
    }

    private async Task<RawgPagedGameResponse?> DiscoverSimilarGamesFallbackAsync(
        int rawgId,
        Game? localGame,
        RawgGameDetailsResponse? rawgDetails,
        CancellationToken cancellationToken)
    {
        var genreId = rawgDetails?.Genres.FirstOrDefault()?.Id
                      ?? localGame?.GameGenres
                          .Select(x => x.Genre.RAWG_Id)
                          .FirstOrDefault(x => x.HasValue);

        var platformId = rawgDetails?.Platforms
            .FirstOrDefault(x => x.Platform is not null)
            ?.Platform!
            .Id;

        var attempts = new[]
        {
            new GameSpecParams
            {
                PageIndex = 1,
                PageSize = DefaultTake * 2,
                Sort = "popularity",
                GenreId = genreId,
                PlatformId = platformId
            },
            new GameSpecParams
            {
                PageIndex = 1,
                PageSize = DefaultTake * 2,
                Sort = "popularity",
                GenreId = genreId
            },
            new GameSpecParams
            {
                PageIndex = 1,
                PageSize = DefaultTake * 2,
                Sort = "popularity",
                PlatformId = platformId
            },
            new GameSpecParams
            {
                PageIndex = 1,
                PageSize = DefaultTake * 2,
                Sort = "trending"
            }
        };

        foreach (var specParams in attempts)
        {
            if (!specParams.GenreId.HasValue && !specParams.PlatformId.HasValue && specParams.Sort != "trending")
            {
                continue;
            }

            var response = await _rawgService.DiscoverGamesAsync(specParams, cancellationToken);
            if (response?.Results.Any(x => x.Id != rawgId) == true)
            {
                return response;
            }
        }

        return null;
    }

    private async Task<Dictionary<int, int>> BuildLocalGameIdMapAsync(IEnumerable<int> rawgIds, CancellationToken cancellationToken)
    {
        var ids = rawgIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<int, int>();
        }

        var localGames = await _gameRepository.ListAsync(new GamesByRawgIdsSpecification(ids), cancellationToken);

        return localGames
            .Where(x => x.RAWG_Id.HasValue)
            .GroupBy(x => x.RAWG_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First().GameId);
    }


    private async Task<string?> ResolveTrailerUrlAsync(int rawgId, CancellationToken cancellationToken)
    {
        var trailers = await _rawgService.GetGameTrailersAsync(rawgId, cancellationToken);
        var mainTrailer = trailers?.Results?
        .Select(x => x.Data?.Max ?? x.Data?.Sd ?? x.Preview)
        .FirstOrDefault(url => !string.IsNullOrWhiteSpace(url));
        return mainTrailer;
    }

    private static GameDetailsDto MapGameDetails(
        Game? localGame,
        RawgGameDetailsResponse? rawgDetails,
        string? trailerUrl,
        IEnumerable<GameListItemDto> similarGames,
        RawgGameScreenshotsResponse? screenshots
        )
    {
        return new GameDetailsDto
        {
            GameId = localGame?.GameId ?? 0,
            RawgId = rawgDetails?.Id ?? localGame?.RAWG_Id,
            Title = rawgDetails?.Name ?? localGame?.Title ?? string.Empty,
            Description = rawgDetails?.Description ?? localGame?.Overview,
            Rating = rawgDetails?.Rating ?? localGame?.Rating,
            ReleaseDate = ParseDate(rawgDetails?.Released) ?? localGame?.Release_Date,
            PosterUrl = rawgDetails?.BackgroundImage ?? localGame?.Poster_Url,
            BackdropUrl = rawgDetails?.BackgroundImageAdditional ?? rawgDetails?.BackgroundImage ?? localGame?.Backdrop_Url,
            TrailerUrl = trailerUrl,
            StoreUrl = rawgDetails?.Stores.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x.Url))?.Url
                ?? rawgDetails?.Website
                ?? localGame?.Store_Url,
            NumberOfImages = screenshots?.Count ?? localGame?.Photos.Count,
            Screenshots = ExtractPhotos(localGame, screenshots),
            Genres = ExtractGenres(localGame, rawgDetails),
            Platforms = ExtractPlatforms(localGame, rawgDetails),
            Developers = ExtractDevelopers(rawgDetails),
            Publishers = ExtractPublishers(rawgDetails),
            SimilarGames = similarGames
        };
    }
    private static IEnumerable<GameScreenshotDto> ExtractPhotos(Game? localGame, RawgGameScreenshotsResponse? screenshots)
    {
        if (screenshots?.Results.Count > 0)
        {
            return screenshots.Results
                .Where(x => !string.IsNullOrWhiteSpace(x.Image))
                .Select(x => new GameScreenshotDto
                {
                    Id = x.Id,
                    ImageUrl = x.Image!,
                    width = x.Width,
                    height = x.Height
                })
                .ToList();
        }

        return localGame?.Photos
            .Where(x => !string.IsNullOrWhiteSpace(x.Image_Url))
            .Select(x => new GameScreenshotDto
            {
                Id = x.RAWG_Id ?? x.GamePhotoId,
                ImageUrl = x.Image_Url,
                width = x.Width,
                height = x.Height
            })
            .ToList() ?? Enumerable.Empty<GameScreenshotDto>();
    }
    private static IEnumerable<GameGenreDto> ExtractGenres(Game? localGame, RawgGameDetailsResponse? rawgDetails)
    {
        if (rawgDetails?.Genres.Count > 0)
        {
            return rawgDetails.Genres
                .Select(x => new GameGenreDto(x.Id, x.Name ?? string.Empty))
                .ToList();
        }

        return localGame?.GameGenres
            .Select(x => new GameGenreDto(x.Genre.RAWG_Id ?? x.GenreId, x.Genre.Name))
            .ToList() ?? Enumerable.Empty<GameGenreDto>();
    }

    private static IEnumerable<GamePlatformDto> ExtractPlatforms(Game? localGame, RawgGameDetailsResponse? rawgDetails)
    {
        if (rawgDetails?.Platforms.Count > 0)
        {
            return rawgDetails.Platforms
                .Where(x => x.Platform is not null)
                .Select(x => new GamePlatformDto(x.Platform!.Id, x.Platform!.Name ?? string.Empty))
                .ToList();
        }

        return localGame?.GamePlatforms
            .Select(x => new GamePlatformDto(x.Platform_Id, x.Platform.Name))
            .ToList() ?? Enumerable.Empty<GamePlatformDto>();
    }

    private static IEnumerable<GameDeveloperDto> ExtractDevelopers(RawgGameDetailsResponse? rawgDetails)
    {
        return rawgDetails?.Developers
            .Select(x => new GameDeveloperDto
            {
                Id = x.Id,
                Name = x.Name ?? string.Empty,
                ImageUrl = x.ImageBackground
            })
            .ToList() ?? Enumerable.Empty<GameDeveloperDto>();
    }

    private static IEnumerable<GamePublisherDto> ExtractPublishers(RawgGameDetailsResponse? rawgDetails)
    {
        return rawgDetails?.Publishers
            .Select(x => new GamePublisherDto
            {
                Id = x.Id,
                Name = x.Name ?? string.Empty,
                ImageUrl = x.ImageBackground
            })
            .ToList() ?? Enumerable.Empty<GamePublisherDto>();
    }

    private static GameListItemDto MapSimilarGame(
        RawgGameSummaryDto game,
        IReadOnlyDictionary<int, int> localGameIdMap)
    {
        return new GameListItemDto
        {
            GameId = localGameIdMap.TryGetValue(game.Id, out var localGameId) ? localGameId : 0,
            RawgId = game.Id,
            Title = game.Name ?? string.Empty,
            Rating = game.Rating,
            ReleaseDate = ParseDate(game.Released),
            PosterUrl = game.BackgroundImage,
            TrailerUrl = null,
            Genres = game.Genres
                .Select(x => new GameGenreDto(x.Id, x.Name ?? string.Empty))
                .ToList(),
            Platforms = game.Platforms
                .Where(x => x.Platform is not null)
                .Select(x => new GamePlatformDto(x.Platform!.Id, x.Platform!.Name ?? string.Empty))
                .ToList()
        };
    }

    private static DateTime? ParseDate(string? value)
    {
        return DateTime.TryParse(value, out var parsedDate) ? parsedDate : null;
    }
}
