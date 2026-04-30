using Questro.Core.Entities.Games;
using Questro.Core.Specifications.Games;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.ExternalServices.RAWG.Contracts;
using Questro.Service.Abstractions.Games;
using Questro.Shared.Contracts.Games;
using Questro.Shared.ErrorHandle.Games;
using Questro.Shared.Result;

namespace Questro.Service.Services.Games;

public sealed class GameSyncService : IGameSyncService
{
    private readonly IGenericRepository<Game> _gameRepository;
    private readonly IGenericRepository<GameGenre> _gameGenreRepository;
    private readonly IGenericRepository<GamePlatform> _gamePlatformRepository;
    private readonly IGenericRepository<GamePhoto> _gamePhotoRepository;
    private readonly IGenericRepository<Game_GameGenre> _gameGenreLinkRepository;
    private readonly IGenericRepository<Game_GamePlatform> _gamePlatformLinkRepository;
    private readonly IRawgService _rawgService;
    private readonly IUnitOfWork _unitOfWork;

    public GameSyncService(
        IGenericRepository<Game> gameRepository,
        IGenericRepository<GameGenre> gameGenreRepository,
        IGenericRepository<GamePlatform> gamePlatformRepository,
        IGenericRepository<GamePhoto> gamePhotoRepository,
        IGenericRepository<Game_GameGenre> gameGenreLinkRepository,
        IGenericRepository<Game_GamePlatform> gamePlatformLinkRepository,
        IRawgService rawgService,
        IUnitOfWork unitOfWork)
    {
        _gameRepository = gameRepository;
        _gameGenreRepository = gameGenreRepository;
        _gamePlatformRepository = gamePlatformRepository;
        _gamePhotoRepository = gamePhotoRepository;
        _gameGenreLinkRepository = gameGenreLinkRepository;
        _gamePlatformLinkRepository = gamePlatformLinkRepository;
        _rawgService = rawgService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<GameListItemDto>> FetchAndSaveGameByRawgIdAsync(int rawgId, CancellationToken cancellationToken = default)
    {
        if (rawgId <= 0)
        {
            return Result.Failure<GameListItemDto>(GameError.InvalidRawgId);
        }

        var existingGame = await _gameRepository.GetEntityWithSpecAsync(
            new GameDetailsByRawgIdSpecification(rawgId),
            cancellationToken);

        var rawgDetails = await _rawgService.GetGameDetailsAsync(rawgId, cancellationToken);
        if (rawgDetails is null || string.IsNullOrWhiteSpace(rawgDetails.Name))
        {
            return existingGame is null
                ? Result.Failure<GameListItemDto>(GameError.NotFound)
                : Result.Success(MapLocalGameToListItem(existingGame));
        }

        var screenshots = await _rawgService.GetGameScreenshotsAsync(rawgId, cancellationToken);
        var trailers = await _rawgService.GetGameTrailersAsync(rawgId, cancellationToken);
        var genreEntitiesByRawgId = await EnsureGenresExistAsync(rawgDetails.Genres, cancellationToken);
        var platformEntitiesByRawgId = await EnsurePlatformsExistAsync(rawgDetails.Platforms, cancellationToken);

        if (existingGame is not null)
        {
            var updatedGame = BuildGameFromRawgDetails(rawgDetails, trailers, existingGame);
            _gameRepository.Update(updatedGame);

            await UpsertGameGenreLinksAsync(existingGame.GameId, rawgDetails.Genres, genreEntitiesByRawgId, cancellationToken);
            await UpsertGamePlatformLinksAsync(existingGame.GameId, rawgDetails.Platforms, platformEntitiesByRawgId, cancellationToken);
            await UpsertGamePhotosAsync(existingGame.GameId, screenshots, cancellationToken);
            await _unitOfWork.CompleteAsync(cancellationToken);

            var reloadedGame = await _gameRepository.GetEntityWithSpecAsync(
                new GameDetailsByRawgIdSpecification(rawgId),
                cancellationToken);

            return Result.Success(MapLocalGameToListItem(reloadedGame ?? existingGame, rawgDetails));
        }

        var game = BuildGameFromRawgDetails(rawgDetails, trailers);
        game.GameGenres = rawgDetails.Genres
            .Where(x => genreEntitiesByRawgId.ContainsKey(x.Id))
            .Select(x => new Game_GameGenre
            {
                GenreId = genreEntitiesByRawgId[x.Id].GenreId
            })
            .ToList();

        game.GamePlatforms = ExtractPlatforms(rawgDetails.Platforms)
            .Where(x => platformEntitiesByRawgId.ContainsKey(x.Id))
            .Select(x => new Game_GamePlatform
            {
                Platform_Id = platformEntitiesByRawgId[x.Id].Platform_Id
            })
            .ToList();

        game.Photos = BuildGamePhotos(screenshots).ToList();

        await _gameRepository.AddAsync(game, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);

        return Result.Success(MapLocalGameToListItem(game, rawgDetails));
    }

    private async Task<Dictionary<int, GameGenre>> EnsureGenresExistAsync(
        IEnumerable<RawgGenreDto> rawgGenres,
        CancellationToken cancellationToken)
    {
        var incomingGenres = rawgGenres
            .Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Name))
            .DistinctBy(x => x.Id)
            .ToList();

        var localGenres = await _gameGenreRepository.ListAllAsync(cancellationToken);

        var byRawgId = localGenres
            .Where(x => x.RAWG_Id.HasValue)
            .GroupBy(x => x.RAWG_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First());

        var byName = localGenres
            .Where(x => !string.IsNullOrWhiteSpace(x.Name))
            .GroupBy(x => NormalizeName(x.Name))
            .ToDictionary(x => x.Key, x => x.First());

        var genresToAdd = new List<GameGenre>();
        var hasUpdates = false;

        foreach (var rawgGenre in incomingGenres)
        {
            if (byRawgId.ContainsKey(rawgGenre.Id))
            {
                continue;
            }

            var normalizedName = NormalizeName(rawgGenre.Name!);
            if (byName.TryGetValue(normalizedName, out var existingByName))
            {
                if (!existingByName.RAWG_Id.HasValue)
                {
                    existingByName.RAWG_Id = rawgGenre.Id;
                    _gameGenreRepository.Update(existingByName);
                    hasUpdates = true;
                }

                byRawgId[rawgGenre.Id] = existingByName;
                continue;
            }

            var newGenre = new GameGenre
            {
                Name = rawgGenre.Name!.Trim(),
                RAWG_Id = rawgGenre.Id
            };

            genresToAdd.Add(newGenre);
            byName[normalizedName] = newGenre;
            byRawgId[rawgGenre.Id] = newGenre;
        }

        if (genresToAdd.Count > 0)
        {
            await _gameGenreRepository.AddRangeAsync(genresToAdd, cancellationToken);
            hasUpdates = true;
        }

        if (hasUpdates)
        {
            await _unitOfWork.CompleteAsync(cancellationToken);

            localGenres = await _gameGenreRepository.ListAllAsync(cancellationToken);
            byRawgId = localGenres
                .Where(x => x.RAWG_Id.HasValue)
                .GroupBy(x => x.RAWG_Id!.Value)
                .ToDictionary(x => x.Key, x => x.First());

            byName = localGenres
                .Where(x => !string.IsNullOrWhiteSpace(x.Name))
                .GroupBy(x => NormalizeName(x.Name))
                .ToDictionary(x => x.Key, x => x.First());

            foreach (var rawgGenre in incomingGenres.Where(x => !byRawgId.ContainsKey(x.Id)))
            {
                var normalizedName = NormalizeName(rawgGenre.Name!);
                if (byName.TryGetValue(normalizedName, out var existingByName))
                {
                    byRawgId[rawgGenre.Id] = existingByName;
                }
            }
        }

        return byRawgId;
    }

    private async Task<Dictionary<int, GamePlatform>> EnsurePlatformsExistAsync(
        IEnumerable<RawgPlatformWithReleaseDateDto> rawgPlatforms,
        CancellationToken cancellationToken)
    {
        var incomingPlatforms = ExtractPlatforms(rawgPlatforms).ToList();
        if (incomingPlatforms.Count == 0)
        {
            return new Dictionary<int, GamePlatform>();
        }

        var localPlatforms = await _gamePlatformRepository.ListAllAsync(cancellationToken);
        var byName = localPlatforms
            .Where(x => !string.IsNullOrWhiteSpace(x.Name))
            .GroupBy(x => NormalizeName(x.Name))
            .ToDictionary(x => x.Key, x => x.First());

        var platformsToAdd = new List<GamePlatform>();
        foreach (var platform in incomingPlatforms)
        {
            var normalizedName = NormalizeName(platform.Name!);
            if (byName.ContainsKey(normalizedName))
            {
                continue;
            }

            var newPlatform = new GamePlatform
            {
                Name = platform.Name!.Trim()
            };

            platformsToAdd.Add(newPlatform);
            byName[normalizedName] = newPlatform;
        }

        if (platformsToAdd.Count > 0)
        {
            await _gamePlatformRepository.AddRangeAsync(platformsToAdd, cancellationToken);
            await _unitOfWork.CompleteAsync(cancellationToken);

            localPlatforms = await _gamePlatformRepository.ListAllAsync(cancellationToken);
            byName = localPlatforms
                .Where(x => !string.IsNullOrWhiteSpace(x.Name))
                .GroupBy(x => NormalizeName(x.Name))
                .ToDictionary(x => x.Key, x => x.First());
        }

        return incomingPlatforms
            .Where(x => byName.ContainsKey(NormalizeName(x.Name!)))
            .GroupBy(x => x.Id)
            .ToDictionary(x => x.Key, x => byName[NormalizeName(x.First().Name!)]);
    }

    private async Task UpsertGameGenreLinksAsync(
        int gameId,
        IEnumerable<RawgGenreDto> rawgGenres,
        IReadOnlyDictionary<int, GameGenre> genreEntitiesByRawgId,
        CancellationToken cancellationToken)
    {
        var existingLinks = await _gameGenreLinkRepository.ListAsync(
            new GameGenreLinksByGameIdSpecification(gameId),
            cancellationToken);

        var existingGenreIds = existingLinks
            .Select(x => x.GenreId)
            .ToHashSet();

        var linksToAdd = rawgGenres
            .Where(x => genreEntitiesByRawgId.ContainsKey(x.Id))
            .Select(x => genreEntitiesByRawgId[x.Id].GenreId)
            .Where(x => !existingGenreIds.Contains(x))
            .Distinct()
            .Select(genreId => new Game_GameGenre
            {
                GameId = gameId,
                GenreId = genreId
            })
            .ToList();

        if (linksToAdd.Count > 0)
        {
            await _gameGenreLinkRepository.AddRangeAsync(linksToAdd, cancellationToken);
        }
    }

    private async Task UpsertGamePlatformLinksAsync(
        int gameId,
        IEnumerable<RawgPlatformWithReleaseDateDto> rawgPlatforms,
        IReadOnlyDictionary<int, GamePlatform> platformEntitiesByRawgId,
        CancellationToken cancellationToken)
    {
        var existingLinks = await _gamePlatformLinkRepository.ListAsync(
            new GamePlatformLinksByGameIdSpecification(gameId),
            cancellationToken);

        var existingPlatformIds = existingLinks
            .Select(x => x.Platform_Id)
            .ToHashSet();

        var linksToAdd = ExtractPlatforms(rawgPlatforms)
            .Where(x => platformEntitiesByRawgId.ContainsKey(x.Id))
            .Select(x => platformEntitiesByRawgId[x.Id].Platform_Id)
            .Where(x => !existingPlatformIds.Contains(x))
            .Distinct()
            .Select(platformId => new Game_GamePlatform
            {
                GameId = gameId,
                Platform_Id = platformId
            })
            .ToList();

        if (linksToAdd.Count > 0)
        {
            await _gamePlatformLinkRepository.AddRangeAsync(linksToAdd, cancellationToken);
        }
    }

    private async Task UpsertGamePhotosAsync(
        int gameId,
        RawgGameScreenshotsResponse? screenshots,
        CancellationToken cancellationToken)
    {
        var incomingPhotos = BuildGamePhotos(screenshots).ToList();
        if (incomingPhotos.Count == 0)
        {
            return;
        }

        var existingPhotos = await _gamePhotoRepository.ListAsync(
            new GamePhotosByGameIdSpecification(gameId),
            cancellationToken);

        var existingByRawgId = existingPhotos
            .Where(x => x.RAWG_Id.HasValue)
            .GroupBy(x => x.RAWG_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First());

        var existingByUrl = existingPhotos
            .Where(x => !string.IsNullOrWhiteSpace(x.Image_Url))
            .GroupBy(x => x.Image_Url.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

        var photosToAdd = new List<GamePhoto>();

        foreach (var incomingPhoto in incomingPhotos)
        {
            incomingPhoto.GameId = gameId;

            if (incomingPhoto.RAWG_Id.HasValue &&
                existingByRawgId.TryGetValue(incomingPhoto.RAWG_Id.Value, out var existingByRawgIdPhoto))
            {
                if (ApplyPhotoMetadata(existingByRawgIdPhoto, incomingPhoto))
                {
                    _gamePhotoRepository.Update(existingByRawgIdPhoto);
                }

                continue;
            }

            if (existingByUrl.TryGetValue(incomingPhoto.Image_Url.Trim(), out var existingByUrlPhoto))
            {
                if (ApplyPhotoMetadata(existingByUrlPhoto, incomingPhoto))
                {
                    _gamePhotoRepository.Update(existingByUrlPhoto);
                }

                continue;
            }

            photosToAdd.Add(incomingPhoto);
        }

        if (photosToAdd.Count > 0)
        {
            await _gamePhotoRepository.AddRangeAsync(photosToAdd, cancellationToken);
        }
    }

    private static Game BuildGameFromRawgDetails(RawgGameDetailsResponse rawgDetails, RawgGameTrailersResponse? trailers = null, Game? existingGame = null)
    {
        return new Game
        {
            GameId = existingGame?.GameId ?? 0,
            RAWG_Id = rawgDetails.Id > 0 ? rawgDetails.Id : existingGame?.RAWG_Id,
            Title = rawgDetails.Name?.Trim() ?? existingGame?.Title ?? string.Empty,
            Overview = string.IsNullOrWhiteSpace(rawgDetails.Description)
                ? existingGame?.Overview
                : rawgDetails.Description,
            Popularity = rawgDetails.RatingsCount ?? existingGame?.Popularity,
            Rating = rawgDetails.Rating ?? existingGame?.Rating,
            Release_Date = ParseDate(rawgDetails.Released) ?? existingGame?.Release_Date,
            Poster_Url = rawgDetails.BackgroundImage ?? existingGame?.Poster_Url,
            Backdrop_Url = rawgDetails.BackgroundImageAdditional
                ?? rawgDetails.BackgroundImage
                ?? existingGame?.Backdrop_Url,
            Trailer_Url = ExtractTrailerUrl(trailers) ?? existingGame?.Trailer_Url,
            Store_Url = ResolveStoreUrl(rawgDetails) ?? existingGame?.Store_Url
        };

    }

    private static string? ExtractTrailerUrl(RawgGameTrailersResponse? trailers)
    {
        if (trailers?.Results == null || trailers.Results.Count == 0)
        {
            return null;
        }

        var trailer = trailers.Results.FirstOrDefault(x => x.Data != null);
        if (trailer?.Data == null)
        {
            return null;
        }

        return !string.IsNullOrWhiteSpace(trailer.Data.Max)
            ? trailer.Data.Max
            : !string.IsNullOrWhiteSpace(trailer.Data.Sd)
                ? trailer.Data.Sd
                : null;
    }

    private static IEnumerable<GamePhoto> BuildGamePhotos(RawgGameScreenshotsResponse? screenshots)
    {
        return screenshots?.Results
            .Where(x => !string.IsNullOrWhiteSpace(x.Image))
            .DistinctBy(x => x.Id > 0 ? $"rawg:{x.Id}" : $"url:{x.Image!.Trim().ToLowerInvariant()}")
            .Select(x => new GamePhoto
            {
                RAWG_Id = x.Id > 0 ? x.Id : null,
                Image_Url = x.Image!.Trim(),
                Width = x.Width > 0 ? x.Width : null,
                Height = x.Height > 0 ? x.Height : null
            })
            .ToList() ?? Enumerable.Empty<GamePhoto>();
    }

    private static bool ApplyPhotoMetadata(GamePhoto existingPhoto, GamePhoto incomingPhoto)
    {
        var changed = false;

        if (incomingPhoto.RAWG_Id.HasValue && existingPhoto.RAWG_Id != incomingPhoto.RAWG_Id)
        {
            existingPhoto.RAWG_Id = incomingPhoto.RAWG_Id;
            changed = true;
        }

        if (!string.Equals(existingPhoto.Image_Url, incomingPhoto.Image_Url, StringComparison.Ordinal))
        {
            existingPhoto.Image_Url = incomingPhoto.Image_Url;
            changed = true;
        }

        if (existingPhoto.Width != incomingPhoto.Width)
        {
            existingPhoto.Width = incomingPhoto.Width;
            changed = true;
        }

        if (existingPhoto.Height != incomingPhoto.Height)
        {
            existingPhoto.Height = incomingPhoto.Height;
            changed = true;
        }

        return changed;
    }

    private static GameListItemDto MapLocalGameToListItem(Game game, RawgGameDetailsResponse? rawgDetails = null)
    {
        return new GameListItemDto
        {
            GameId = game.GameId,
            RawgId = rawgDetails?.Id ?? game.RAWG_Id,
            Title = rawgDetails?.Name ?? game.Title,
            Rating = rawgDetails?.Rating ?? game.Rating,
            ReleaseDate = ParseDate(rawgDetails?.Released) ?? game.Release_Date,
            PosterUrl = rawgDetails?.BackgroundImage ?? game.Poster_Url,
            TrailerUrl = null,
            Genres = rawgDetails?.Genres.Count > 0
                ? rawgDetails.Genres.Select(x => new GameGenreDto(x.Id, x.Name ?? string.Empty)).ToList()
                : game.GameGenres.Select(x => new GameGenreDto(x.Genre.RAWG_Id ?? x.GenreId, x.Genre.Name)).ToList(),
            Platforms = rawgDetails?.Platforms.Count > 0
                ? ExtractPlatforms(rawgDetails.Platforms).Select(x => new GamePlatformDto(x.Id, x.Name ?? string.Empty)).ToList()
                : game.GamePlatforms.Select(x => new GamePlatformDto(x.Platform_Id, x.Platform.Name)).ToList()
        };
    }

    private static IEnumerable<RawgPlatformDto> ExtractPlatforms(IEnumerable<RawgPlatformWithReleaseDateDto> rawgPlatforms)
    {
        return rawgPlatforms
            .Where(x => x.Platform is not null && x.Platform.Id > 0 && !string.IsNullOrWhiteSpace(x.Platform.Name))
            .Select(x => x.Platform!)
            .DistinctBy(x => x.Id);
    }

    private static string? ResolveStoreUrl(RawgGameDetailsResponse rawgDetails)
    {
        return rawgDetails.Stores.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x.Url))?.Url
            ?? rawgDetails.Website;
    }

    private static string NormalizeName(string value)
    {
        return value.Trim().ToLowerInvariant();
    }

    private static DateTime? ParseDate(string? value)
    {
        return DateTime.TryParse(value, out var parsedDate) ? parsedDate : null;
    }
}
