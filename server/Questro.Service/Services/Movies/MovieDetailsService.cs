using Questro.Core.Entities.Movies;
using Questro.Core.Specifications.Movies;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.ExternalServices.Tmdb.Contracts;
using Questro.Service.Abstractions.Movies;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.ErrorHandle.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Services.Movies;

public sealed class MovieDetailsService : IMovieDetailsService
{
    private const int DefaultTake = 20;

    private readonly IGenericRepository<Movie> _movieRepository;
    private readonly IGenericRepository<MovieGenre> _movieGenreRepository;
    private readonly IGenericRepository<Staff> _staffRepository;
    private readonly IGenericRepository<UserMovieLike> _userMovieLikeRepository;
    private readonly IGenericRepository<UserMovieRate> _userMovieRateRepository;
    private readonly IGenericRepository<UserMovieWatchlist> _userMovieWatchlistRepository;
    private readonly IGenericRepository<UserMovieWatched> _userMovieWatchedRepository;
    private readonly ITmdbService _tmdbService;
    private readonly IMovieSyncService _movieSyncService;

    public MovieDetailsService(
        IGenericRepository<Movie> movieRepository,
        IGenericRepository<MovieGenre> movieGenreRepository,
        IGenericRepository<Staff> staffRepository,
        IGenericRepository<UserMovieLike> userMovieLikeRepository,
        IGenericRepository<UserMovieRate> userMovieRateRepository,
        IGenericRepository<UserMovieWatchlist> userMovieWatchlistRepository,
        IGenericRepository<UserMovieWatched> userMovieWatchedRepository,
        ITmdbService tmdbService,
        IMovieSyncService movieSyncService)
    {
        _movieRepository = movieRepository;
        _movieGenreRepository = movieGenreRepository;
        _staffRepository = staffRepository;
        _userMovieLikeRepository = userMovieLikeRepository;
        _userMovieRateRepository = userMovieRateRepository;
        _userMovieWatchlistRepository = userMovieWatchlistRepository;
        _userMovieWatchedRepository = userMovieWatchedRepository;
        _tmdbService = tmdbService;
        _movieSyncService = movieSyncService;
    }

    public async Task<Result<MovieDetailsDto>> GetMovieDetailsAsync(int tmdbId, long? userId = null, CancellationToken cancellationToken = default)
    {
        if (tmdbId <= 0)
        {
            return Result.Failure<MovieDetailsDto>(MovieError.InvalidTmdbId);
        }

        var localMovie = await _movieRepository.GetEntityWithSpecAsync(new MovieDetailsByTmdbIdSpecification(tmdbId), cancellationToken);

        if (localMovie is null)
        {
            await _movieSyncService.FetchAndSaveMovieByTmdbIdAsync(tmdbId, cancellationToken);
            localMovie = await _movieRepository.GetEntityWithSpecAsync(new MovieDetailsByTmdbIdSpecification(tmdbId), cancellationToken);
        }

        var tmdbDetails = await _tmdbService.GetMovieDetailsAsync(tmdbId, cancellationToken);
        if (tmdbDetails is null && localMovie is null)
        {
            return Result.Failure<MovieDetailsDto>(MovieError.NotFound);
        }

        var tmdbCredits = await _tmdbService.GetMovieCreditsAsync(tmdbId, cancellationToken);
        var tmdbVideos = await _tmdbService.GetMovieVideosAsync(tmdbId, cancellationToken);
        var tmdbSimilar = await _tmdbService.GetSimilarMoviesAsync(tmdbId, cancellationToken: cancellationToken);
        var tmdbWatchProviders = await _tmdbService.GetMovieWatchProvidersAsync(tmdbId, cancellationToken);

        var genres = ExtractGenreNames(localMovie, tmdbDetails);
        var cast = MapCastCredits(localMovie, tmdbCredits);
        var crew = MapCrewCredits(localMovie, tmdbCredits);
        var trailerUrl = ResolveTrailerUrl(tmdbVideos);
        var similar = await MapSimilarMoviesAsync(tmdbSimilar, cancellationToken);

        var releaseDate = ParseDate(tmdbDetails?.ReleaseDate) ?? localMovie?.Release_Date;
        var watchProviders = MapWatchProviders(
            tmdbWatchProviders,
            releaseDate,
            tmdbDetails?.Homepage,
            tmdbDetails?.ImdbId ?? localMovie?.IMDB_Id);

        var ratingSummary = await BuildRatingSummaryAsync(
            localMovie?.MovieId,
            tmdbDetails?.VoteAverage,
            tmdbDetails?.VoteCount,
            cancellationToken);

        MovieUserStatusDto? userStatus = null;
        if (userId.HasValue && userId.Value > 0 && localMovie is not null)
        {
            userStatus = await BuildUserStatusAsync(localMovie.MovieId, userId.Value, cancellationToken);
        }

        var details = new MovieDetailsDto(
            localMovie?.MovieId ?? 0,
            tmdbDetails?.Id ?? localMovie?.TMDB_Id,
            tmdbDetails?.Title ?? localMovie?.Title ?? string.Empty,
            tmdbDetails?.Overview ?? localMovie?.Overview,
            tmdbDetails?.Runtime ?? localMovie?.Runtime,
            releaseDate,
            tmdbDetails?.OriginalLanguage ?? localMovie?.Language,
            BuildImageUrl(tmdbDetails?.PosterPath, "w500") ?? localMovie?.Poster_Url,
            BuildImageUrl(tmdbDetails?.BackdropPath, "w780") ?? localMovie?.Backdrop_Url,
            tmdbDetails?.Popularity ?? localMovie?.Popularity,
            tmdbDetails?.VoteAverage ?? localMovie?.TMDB_Rating,
            tmdbDetails?.VoteCount ?? localMovie?.TMDB_VoteCount,
            tmdbDetails?.ImdbId ?? localMovie?.IMDB_Id,
            trailerUrl,
            genres,
            cast,
            crew,
            similar,
            watchProviders,
            ratingSummary,
            userStatus);

        return Result.Success(details);
    }

    public async Task<Result<StaffDetailsDto>> GetStaffDetailsAsync(int tmdbId, CancellationToken cancellationToken = default)
    {
        if (tmdbId <= 0)
        {
            return Result.Failure<StaffDetailsDto>(MovieError.InvalidTmdbId);
        }

        var localStaff = await _staffRepository.GetEntityWithSpecAsync(new StaffDetailsByTmdbIdSpecification(tmdbId), cancellationToken);
        var tmdbPerson = await _tmdbService.GetPersonDetailsAsync(tmdbId, cancellationToken);
        if (localStaff is null && (tmdbPerson is null || string.IsNullOrWhiteSpace(tmdbPerson.Name)))
        {
            return Result.Failure<StaffDetailsDto>(MovieError.StaffNotFound);
        }

        var personCredits = await _tmdbService.GetPersonMovieCreditsAsync(tmdbId, cancellationToken);
        var knownForMovies = BuildStaffMovieCredits(localStaff, personCredits);

        var details = new StaffDetailsDto(
            localStaff?.Staff_Id,
            localStaff?.TMDB_Id ?? tmdbPerson?.Id,
            localStaff?.Name ?? tmdbPerson?.Name ?? string.Empty,
            tmdbPerson?.Biography,
            localStaff?.BirthDate ?? ParseDate(tmdbPerson?.Birthday),
            tmdbPerson?.PlaceOfBirth,
            localStaff?.Gender ?? MapGender(tmdbPerson?.Gender),
            localStaff?.Department ?? tmdbPerson?.KnownForDepartment,
            localStaff?.Profile_Path ?? BuildImageUrl(tmdbPerson?.ProfilePath, "w300"),
            knownForMovies);

        return Result.Success(details);
    }

    private async Task<MovieUserStatusDto> BuildUserStatusAsync(int movieId, long userId, CancellationToken cancellationToken)
    {
        var like = await _userMovieLikeRepository.GetEntityWithSpecAsync(
            new UserMovieLikeByUserAndMovieSpecification(userId, movieId),
            cancellationToken);

        var rate = await _userMovieRateRepository.GetEntityWithSpecAsync(
            new UserMovieRateByUserAndMovieSpecification(userId, movieId),
            cancellationToken);

        var watchlist = await _userMovieWatchlistRepository.GetEntityWithSpecAsync(
            new UserMovieWatchlistByUserAndMovieSpecification(userId, movieId),
            cancellationToken);

        var watched = await _userMovieWatchedRepository.GetEntityWithSpecAsync(
            new UserMovieWatchedByUserAndMovieSpecification(userId, movieId),
            cancellationToken);

        return new MovieUserStatusDto(
            like is not null,
            watchlist is not null,
            watched is not null,
            rate?.Stars);
    }

    private async Task<MovieRatingSummaryDto> BuildRatingSummaryAsync(
        int? localMovieId,
        double? fallbackAverage,
        int? fallbackCount,
        CancellationToken cancellationToken)
    {
        if (!localMovieId.HasValue)
        {
            return new MovieRatingSummaryDto(fallbackAverage, fallbackCount ?? 0);
        }

        var rates = await _userMovieRateRepository.ListAsync(
            new UserMovieRatesByMovieIdSpecification(localMovieId.Value),
            cancellationToken);

        if (rates.Count == 0)
        {
            return new MovieRatingSummaryDto(fallbackAverage, fallbackCount ?? 0);
        }

        var average = Math.Round(rates.Average(x => x.Stars), 2, MidpointRounding.AwayFromZero);
        return new MovieRatingSummaryDto(average, rates.Count);
    }

    private async Task<IEnumerable<MovieListItemDto>> MapSimilarMoviesAsync(
        TmdbPagedMovieResponse? tmdbSimilar,
        CancellationToken cancellationToken)
    {
        if (tmdbSimilar?.Results is null || tmdbSimilar.Results.Count == 0)
        {
            return Enumerable.Empty<MovieListItemDto>();
        }

        var genreMap = await GetLocalGenreMapAsync(cancellationToken);
        var localMovieIdMap = await BuildLocalMovieIdMapAsync(tmdbSimilar.Results.Select(x => x.Id), cancellationToken);

        return tmdbSimilar.Results
            .Take(DefaultTake)
            .Select(x => MapLiveMovie(x, genreMap, localMovieIdMap))
            .ToList();
    }

    private async Task<Dictionary<int, string>> GetLocalGenreMapAsync(CancellationToken cancellationToken)
    {
        var localGenres = await _movieGenreRepository.ListAllAsync(cancellationToken);
        return localGenres
            .Where(x => x.TMDB_Id.HasValue)
            .GroupBy(x => x.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First().Name);
    }

    private async Task<Dictionary<int, int>> BuildLocalMovieIdMapAsync(IEnumerable<int> tmdbIds, CancellationToken cancellationToken)
    {
        var ids = tmdbIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<int, int>();
        }

        var localMovies = await _movieRepository.ListAsync(new MoviesByTmdbIdsSpecification(ids), cancellationToken);

        return localMovies
            .Where(x => x.TMDB_Id.HasValue)
            .GroupBy(x => x.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First().MovieId);
    }

    private static IEnumerable<string> ExtractGenreNames(Movie? localMovie, TmdbMovieDetailsResponse? tmdbDetails)
    {
        if (tmdbDetails?.Genres.Count > 0)
        {
            return tmdbDetails.Genres
                .Select(x => x.Name)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToList();
        }

        return localMovie?.MovieGenres
            .Select(x => x.Genre.Name)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct()
            .ToList() ?? Enumerable.Empty<string>();
    }

    private static IEnumerable<MovieStaffCreditDto> MapCastCredits(Movie? localMovie, TmdbMovieCreditsResponse? tmdbCredits)
    {
        var localStaffByTmdbId = localMovie?.MovieStaffs
            .Where(x => x.Staff.TMDB_Id.HasValue)
            .GroupBy(x => x.Staff.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First().Staff) ?? new Dictionary<int, Staff>();

        if (tmdbCredits?.Cast.Count > 0)
        {
            return tmdbCredits.Cast
                .Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Name))
                .Take(15)
                .Select(x => new MovieStaffCreditDto(
                    localStaffByTmdbId.TryGetValue(x.Id, out var localStaff) ? localStaff.Staff_Id : null,
                    x.Id,
                    x.Name!.Trim(),
                    x.KnownForDepartment,
                    x.Character,
                    BuildImageUrl(x.ProfilePath, "w185")))
                .DistinctBy(x => x.TmdbId)
                .ToList();
        }

        return (localMovie?.MovieStaffs ?? Enumerable.Empty<Movie_Staff>())
            .Where(x => x.Staff.TMDB_Id.HasValue)
            .Where(x => !IsCrewRole(x.Role))
            .Select(x => new MovieStaffCreditDto(
                x.Staff.Staff_Id,
                x.Staff.TMDB_Id!.Value,
                x.Staff.Name,
                x.Staff.Department,
                x.Role,
                x.Staff.Profile_Path))
            .DistinctBy(x => x.TmdbId)
            .Take(15)
            .ToList();
    }

    private static IEnumerable<MovieStaffCreditDto> MapCrewCredits(Movie? localMovie, TmdbMovieCreditsResponse? tmdbCredits)
    {
        var localStaffByTmdbId = localMovie?.MovieStaffs
            .Where(x => x.Staff.TMDB_Id.HasValue)
            .GroupBy(x => x.Staff.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First().Staff) ?? new Dictionary<int, Staff>();

        if (tmdbCredits?.Crew.Count > 0)
        {
            return tmdbCredits.Crew
                .Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Name) && IsCrewRole(x.Job))
                .Take(10)
                .Select(x => new MovieStaffCreditDto(
                    localStaffByTmdbId.TryGetValue(x.Id, out var localStaff) ? localStaff.Staff_Id : null,
                    x.Id,
                    x.Name!.Trim(),
                    x.Department,
                    x.Job,
                    BuildImageUrl(x.ProfilePath, "w185")))
                .DistinctBy(x => x.TmdbId)
                .ToList();
        }

        return (localMovie?.MovieStaffs ?? Enumerable.Empty<Movie_Staff>())
            .Where(x => x.Staff.TMDB_Id.HasValue)
            .Where(x => IsCrewRole(x.Role))
            .Select(x => new MovieStaffCreditDto(
                x.Staff.Staff_Id,
                x.Staff.TMDB_Id!.Value,
                x.Staff.Name,
                x.Staff.Department,
                x.Role,
                x.Staff.Profile_Path))
            .DistinctBy(x => x.TmdbId)
            .Take(10)
            .ToList();
    }

    private static string? ResolveTrailerUrl(TmdbMovieVideosResponse? videos)
    {
        var trailer = videos?.Results
            .Where(x =>
                !string.IsNullOrWhiteSpace(x.Key) &&
                string.Equals(x.Site, "YouTube", StringComparison.OrdinalIgnoreCase) &&
                (string.Equals(x.Type, "Trailer", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(x.Type, "Teaser", StringComparison.OrdinalIgnoreCase)))
            .OrderByDescending(x => x.Official == true)
            .ThenByDescending(x => string.Equals(x.Type, "Trailer", StringComparison.OrdinalIgnoreCase))
            .FirstOrDefault();

        return trailer is null ? null : $"https://www.youtube.com/watch?v={trailer.Key}";
    }

    private static MovieWatchProvidersDto? MapWatchProviders(
        TmdbMovieWatchProvidersResponse? providers,
        DateTime? releaseDate,
        string? homepage,
        string? imdbId)
    {
        if (providers?.Results is not null && providers.Results.Count > 0)
        {
            TmdbWatchProviderRegionDto? selectedRegion = null;
            string? countryCode = null;

            if (providers.Results.TryGetValue("US", out var usRegion) && HasAnyProviders(usRegion))
            {
                selectedRegion = usRegion;
                countryCode = "US";
            }
            else
            {
                var firstRegion = providers.Results.FirstOrDefault(x => HasAnyProviders(x.Value));
                if (!string.IsNullOrWhiteSpace(firstRegion.Key))
                {
                    selectedRegion = firstRegion.Value;
                    countryCode = firstRegion.Key;
                }
            }

            if (selectedRegion is not null && !string.IsNullOrWhiteSpace(countryCode))
            {
                return new MovieWatchProvidersDto(
                    countryCode,
                    selectedRegion.Link,
                    selectedRegion.Flatrate
                        .OrderBy(x => x.DisplayPriority)
                        .Select(MapWatchProvider)
                        .ToList(),
                    selectedRegion.Rent
                        .OrderBy(x => x.DisplayPriority)
                        .Select(MapWatchProvider)
                        .ToList(),
                    selectedRegion.Buy
                        .OrderBy(x => x.DisplayPriority)
                        .Select(MapWatchProvider)
                        .ToList());
            }
        }

        if (releaseDate.HasValue && (DateTime.UtcNow - releaseDate.Value).TotalDays <= 60 && (DateTime.UtcNow - releaseDate.Value).TotalDays >= -60)
        {
            return new MovieWatchProvidersDto(
                "US",
                null,
                new List<MovieWatchProviderItemDto> { new MovieWatchProviderItemDto(0, "In Theaters", null, 0) },
                new List<MovieWatchProviderItemDto>(),
                new List<MovieWatchProviderItemDto>());
        }

        if (!string.IsNullOrWhiteSpace(homepage))
        {
            var homepageLower = homepage.ToLowerInvariant();
            var knownProviders = new[] { "netflix", "amazon", "primevideo", "disney", "hulu", "max", "apple" };
            var matchedProvider = knownProviders.FirstOrDefault(p => homepageLower.Contains(p));
            if (matchedProvider != null)
            {
                var providerName = matchedProvider switch
                {
                    "netflix" => "Netflix",
                    "amazon" => "Amazon Prime Video",
                    "primevideo" => "Amazon Prime Video",
                    "disney" => "Disney+",
                    "hulu" => "Hulu",
                    "max" => "Max",
                    "apple" => "Apple TV+",
                    _ => "Streaming Provider"
                };

                return new MovieWatchProvidersDto(
                    "US",
                    homepage,
                    new List<MovieWatchProviderItemDto> { new MovieWatchProviderItemDto(0, providerName, null, 0) },
                    new List<MovieWatchProviderItemDto>(),
                    new List<MovieWatchProviderItemDto>());
            }
        }

        if (!string.IsNullOrWhiteSpace(imdbId))
        {
            return new MovieWatchProvidersDto(
                "US",
                $"https://www.imdb.com/title/{imdbId}",
                new List<MovieWatchProviderItemDto> { new MovieWatchProviderItemDto(0, "View on IMDB", null, 0) },
                new List<MovieWatchProviderItemDto>(),
                new List<MovieWatchProviderItemDto>());
        }

        return null;
    }

    private static MovieWatchProviderItemDto MapWatchProvider(TmdbWatchProviderDto provider)
    {
        return new MovieWatchProviderItemDto(
            provider.ProviderId,
            provider.ProviderName ?? string.Empty,
            BuildImageUrl(provider.LogoPath, "w185"),
            provider.DisplayPriority);
    }

    private static bool HasAnyProviders(TmdbWatchProviderRegionDto region)
    {
        return region.Flatrate.Count > 0 || region.Rent.Count > 0 || region.Buy.Count > 0;
    }

    private static bool IsCrewRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return false;
        }

        var value = role.Trim();
        return value.Contains("Director", StringComparison.OrdinalIgnoreCase)
               || value.Contains("Writer", StringComparison.OrdinalIgnoreCase)
               || value.Contains("Producer", StringComparison.OrdinalIgnoreCase)
               || value.Contains("Screenplay", StringComparison.OrdinalIgnoreCase)
               || value.Contains("Cinematography", StringComparison.OrdinalIgnoreCase)
               || value.Contains("Composer", StringComparison.OrdinalIgnoreCase);
    }

    private static IEnumerable<StaffMovieCreditDto> BuildStaffMovieCredits(
        Staff? localStaff,
        TmdbPersonMovieCreditsResponse? personCredits)
    {
        var credits = new Dictionary<int, StaffMovieCreditDto>();

        if (localStaff is not null)
        {
            foreach (var item in localStaff.MovieStaffs.Where(x => x.Movie.TMDB_Id.HasValue))
            {
                var tmdbMovieId = item.Movie.TMDB_Id!.Value;
                credits[tmdbMovieId] = new StaffMovieCreditDto(
                    item.Movie.MovieId,
                    item.Movie.TMDB_Id,
                    item.Movie.Title,
                    item.Movie.Poster_Url,
                    item.Movie.Release_Date,
                    item.Role,
                    item.Movie.TMDB_Rating);
            }
        }

        if (personCredits is not null)
        {
            foreach (var cast in personCredits.Cast.Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Title)))
            {
                if (!credits.ContainsKey(cast.Id))
                {
                    credits[cast.Id] = new StaffMovieCreditDto(
                        null,
                        cast.Id,
                        cast.Title!,
                        BuildImageUrl(cast.PosterPath, "w500"),
                        ParseDate(cast.ReleaseDate),
                        cast.Character,
                        cast.VoteAverage);
                }
            }

            foreach (var crew in personCredits.Crew.Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Title)))
            {
                if (!credits.ContainsKey(crew.Id))
                {
                    credits[crew.Id] = new StaffMovieCreditDto(
                        null,
                        crew.Id,
                        crew.Title!,
                        BuildImageUrl(crew.PosterPath, "w500"),
                        ParseDate(crew.ReleaseDate),
                        crew.Job,
                        crew.VoteAverage);
                }
            }
        }

        return credits.Values
            .OrderByDescending(x => x.ReleaseDate ?? DateTime.MinValue)
            .ThenByDescending(x => x.TmdbRating ?? 0)
            .Take(20)
            .ToList();
    }

    private static MovieListItemDto MapLiveMovie(
        TmdbMovieSummaryDto movie,
        IReadOnlyDictionary<int, string> genreMap,
        IReadOnlyDictionary<int, int> localMovieIdMap)
    {
        var genreNames = movie.GenreIds
            .Where(genreMap.ContainsKey)
            .Select(genreId => genreMap[genreId])
            .Distinct()
            .ToList();

        return new MovieListItemDto(
            localMovieIdMap.TryGetValue(movie.Id, out var localMovieId) ? localMovieId : 0,
            movie.Id,
            movie.Title ?? string.Empty,
            BuildImageUrl(movie.PosterPath, "w500"),
            BuildImageUrl(movie.BackdropPath, "w780"),
            ParseDate(movie.ReleaseDate),
            movie.OriginalLanguage,
            null,
            movie.Popularity,
            movie.VoteAverage,
            movie.VoteCount,
            genreNames,
            Enumerable.Empty<string>());
    }

    private static string? MapGender(int? gender)
    {
        return gender switch
        {
            1 => "Female",
            2 => "Male",
            3 => "NonBinary",
            _ => null
        };
    }

    private static string? BuildImageUrl(string? imagePath, string size)
    {
        if (string.IsNullOrWhiteSpace(imagePath))
        {
            return null;
        }

        return $"https://image.tmdb.org/t/p/{size}{imagePath}";
    }

    private static DateTime? ParseDate(string? value)
    {
        return DateTime.TryParse(value, out var parsedDate) ? parsedDate : null;
    }
}
