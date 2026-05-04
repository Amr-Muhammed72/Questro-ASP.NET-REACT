using Microsoft.EntityFrameworkCore;
using Questro.Core.Entities.Movies;
using Questro.Core.Specifications.Movies;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.ExternalServices.Tmdb.Contracts;
using Questro.Service.Abstractions.Movies;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.ErrorHandle.Movies;
using Questro.Shared.Result;

namespace Questro.Service.Services.Movies;

public sealed class MovieSyncService : IMovieSyncService
{
    private readonly IGenericRepository<Movie> _movieRepository;
    private readonly IGenericRepository<MovieGenre> _movieGenreRepository;
    private readonly IGenericRepository<Staff> _staffRepository;
    private readonly IGenericRepository<Movie_Staff> _movieStaffRepository;
    private readonly ITmdbService _tmdbService;
    private readonly IUnitOfWork _unitOfWork;

    public MovieSyncService(
        IGenericRepository<Movie> movieRepository,
        IGenericRepository<MovieGenre> movieGenreRepository,
        IGenericRepository<Staff> staffRepository,
        IGenericRepository<Movie_Staff> movieStaffRepository,
        ITmdbService tmdbService,
        IUnitOfWork unitOfWork)
    {
        _movieRepository = movieRepository;
        _movieGenreRepository = movieGenreRepository;
        _staffRepository = staffRepository;
        _movieStaffRepository = movieStaffRepository;
        _tmdbService = tmdbService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<MovieListItemDto>> FetchAndSaveMovieByTmdbIdAsync(int tmdbId, CancellationToken cancellationToken = default)
    {
        if (tmdbId <= 0)
        {
            return Result.Failure<MovieListItemDto>(MovieError.InvalidTmdbId);
        }

        var existingMovie = await _movieRepository.GetEntityWithSpecAsync(new MovieByTmdbIdSpecification(tmdbId), cancellationToken);
        if (existingMovie is not null)
        {
            var existingCredits = await _tmdbService.GetMovieCreditsAsync(tmdbId, cancellationToken);
            if (existingCredits is null)
            {
                return Result.Failure<MovieListItemDto>(MovieError.CreditsUnavailable);
            }

            var existingStaffByTmdbId = await EnsureStaffMembersExistAsync(existingCredits, cancellationToken);
            await UpsertMovieStaffLinksAsync(existingMovie.MovieId, existingCredits, existingStaffByTmdbId, cancellationToken);
            return Result.Success(MapLocalMovieToListItem(existingMovie));
        }

        var tmdbDetails = await _tmdbService.GetMovieDetailsAsync(tmdbId, cancellationToken);
        if (tmdbDetails is null || string.IsNullOrWhiteSpace(tmdbDetails.Title))
        {
            return Result.Failure<MovieListItemDto>(MovieError.NotFound);
        }

        var tmdbCredits = await _tmdbService.GetMovieCreditsAsync(tmdbId, cancellationToken);
        if (tmdbCredits is null)
        {
            return Result.Failure<MovieListItemDto>(MovieError.CreditsUnavailable);
        }

        var genreEntitiesByTmdbId = await EnsureGenresExistAsync(tmdbDetails.Genres, cancellationToken);
        var staffByTmdbId = await EnsureStaffMembersExistAsync(tmdbCredits, cancellationToken);

        var movie = new Movie
        {
            TMDB_Id = tmdbDetails.Id,
            IMDB_Id = tmdbDetails.ImdbId,
            Title = tmdbDetails.Title.Trim(),
            Overview = tmdbDetails.Overview,
            Runtime = tmdbDetails.Runtime,
            Popularity = tmdbDetails.Popularity,
            Poster_Url = BuildImageUrl(tmdbDetails.PosterPath, "w500"),
            Backdrop_Url = BuildImageUrl(tmdbDetails.BackdropPath, "w780"),
            Language = tmdbDetails.OriginalLanguage,
            Release_Date = ParseDate(tmdbDetails.ReleaseDate),
            TMDB_Rating = tmdbDetails.VoteAverage,
            TMDB_VoteCount = tmdbDetails.VoteCount,
            MovieGenres = tmdbDetails.Genres
                .Where(x => genreEntitiesByTmdbId.ContainsKey(x.Id))
                .Select(x => new Movie_MovieGenre
                {
                    GenreId = genreEntitiesByTmdbId[x.Id].GenreId,
                    CreatedAt = DateTime.UtcNow
                })
                .ToList()
        };

        await _movieRepository.AddAsync(movie, cancellationToken);
        await _unitOfWork.CompleteAsync(cancellationToken);
        await UpsertMovieStaffLinksAsync(movie.MovieId, tmdbCredits, staffByTmdbId, cancellationToken);

        var response = new MovieListItemDto(
            movie.MovieId,
            movie.TMDB_Id,
            movie.Title,
            movie.Poster_Url,
            movie.Backdrop_Url,
            movie.Release_Date,
            movie.Language,
            movie.Mpa_Certification,
            movie.Popularity,
            movie.TMDB_Rating,
            movie.TMDB_VoteCount,
            tmdbDetails.Genres
                .Select(x => x.Name)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToList(),
            Enumerable.Empty<string>());

        return Result.Success(response);
    }

    private async Task<Dictionary<int, MovieGenre>> EnsureGenresExistAsync(IEnumerable<TmdbGenreDto> tmdbGenres, CancellationToken cancellationToken)
    {
        var localGenres = await _movieGenreRepository.ListAllAsync(cancellationToken);

        var byTmdbId = localGenres
            .Where(x => x.TMDB_Id.HasValue)
            .GroupBy(x => x.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First());

        var byName = localGenres
            .GroupBy(x => x.Name.Trim().ToLowerInvariant())
            .ToDictionary(x => x.Key, x => x.First());

        var genresToAdd = new List<MovieGenre>();
        var hasUpdates = false;

        foreach (var tmdbGenre in tmdbGenres.Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Name)))
        {
            if (byTmdbId.ContainsKey(tmdbGenre.Id))
            {
                continue;
            }

            var normalizedName = tmdbGenre.Name.Trim().ToLowerInvariant();
            if (byName.TryGetValue(normalizedName, out var existingByName) && !existingByName.TMDB_Id.HasValue)
            {
                existingByName.TMDB_Id = tmdbGenre.Id;
                _movieGenreRepository.Update(existingByName);
                byTmdbId[tmdbGenre.Id] = existingByName;
                hasUpdates = true;
                continue;
            }

            var newGenre = new MovieGenre
            {
                Name = tmdbGenre.Name.Trim(),
                TMDB_Id = tmdbGenre.Id
            };

            genresToAdd.Add(newGenre);
            byName[normalizedName] = newGenre;
            byTmdbId[tmdbGenre.Id] = newGenre;
        }

        if (genresToAdd.Count > 0)
        {
            await _movieGenreRepository.AddRangeAsync(genresToAdd, cancellationToken);
            hasUpdates = true;
        }

        if (hasUpdates)
        {
            try
            {
                await _unitOfWork.CompleteAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                _unitOfWork.ClearTracking();
            }

            localGenres = await _movieGenreRepository.ListAllAsync(cancellationToken);
            byTmdbId = localGenres
                .Where(x => x.TMDB_Id.HasValue)
                .GroupBy(x => x.TMDB_Id!.Value)
                .ToDictionary(x => x.Key, x => x.First());
        }

        return byTmdbId;
    }

    private async Task<Dictionary<int, Staff>> EnsureStaffMembersExistAsync(TmdbMovieCreditsResponse credits, CancellationToken cancellationToken)
    {
        var relevantCredits = BuildRelevantStaffCredits(credits);
        if (relevantCredits.Count == 0)
        {
            return new Dictionary<int, Staff>();
        }

        var localStaff = await _staffRepository.ListAllAsync(cancellationToken);

        var byTmdbId = localStaff
            .Where(x => x.TMDB_Id.HasValue)
            .GroupBy(x => x.TMDB_Id!.Value)
            .ToDictionary(x => x.Key, x => x.First());

        var byName = localStaff
            .GroupBy(x => x.Name.Trim().ToLowerInvariant())
            .ToDictionary(x => x.Key, x => x.First());

        var staffToAdd = new List<Staff>();
        var hasUpdates = false;

        foreach (var credit in relevantCredits)
        {
            if (byTmdbId.TryGetValue(credit.TmdbId, out var existingByTmdbId))
            {
                if (ApplyStaffMetadata(existingByTmdbId, credit.Department, credit.Gender, credit.ProfilePath))
                {
                    _staffRepository.Update(existingByTmdbId);
                    hasUpdates = true;
                }

                continue;
            }

            var normalizedName = credit.Name.Trim().ToLowerInvariant();
            if (byName.TryGetValue(normalizedName, out var existingByName) && !existingByName.TMDB_Id.HasValue)
            {
                existingByName.TMDB_Id = credit.TmdbId;
                ApplyStaffMetadata(existingByName, credit.Department, credit.Gender, credit.ProfilePath);
                _staffRepository.Update(existingByName);

                byTmdbId[credit.TmdbId] = existingByName;
                hasUpdates = true;
                continue;
            }

            var newStaff = new Staff
            {
                TMDB_Id = credit.TmdbId,
                Name = credit.Name,
                Department = credit.Department,
                Gender = MapGender(credit.Gender),
                Profile_Path = BuildImageUrl(credit.ProfilePath, "w185")
            };

            staffToAdd.Add(newStaff);
            byTmdbId[credit.TmdbId] = newStaff;
            byName[normalizedName] = newStaff;
        }

        if (staffToAdd.Count > 0)
        {
            await _staffRepository.AddRangeAsync(staffToAdd, cancellationToken);
            hasUpdates = true;
        }

        if (hasUpdates)
        {
            try
            {
                await _unitOfWork.CompleteAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                _unitOfWork.ClearTracking();
            }

            localStaff = await _staffRepository.ListAllAsync(cancellationToken);
            byTmdbId = localStaff
                .Where(x => x.TMDB_Id.HasValue)
                .GroupBy(x => x.TMDB_Id!.Value)
                .ToDictionary(x => x.Key, x => x.First());
        }

        return byTmdbId;
    }

    private async Task UpsertMovieStaffLinksAsync(
        int movieId,
        TmdbMovieCreditsResponse credits,
        IReadOnlyDictionary<int, Staff> staffByTmdbId,
        CancellationToken cancellationToken)
    {
        var relevantCredits = BuildRelevantStaffCredits(credits);
        if (relevantCredits.Count == 0)
        {
            return;
        }

        var existingLinks = await _movieStaffRepository.ListAsync(new MovieStaffByMovieIdSpecification(movieId), cancellationToken);
        var existingByStaffId = existingLinks.ToDictionary(x => x.Staff_Id, x => x);

        var linksToAdd = new List<Movie_Staff>();
        var hasUpdates = false;

        foreach (var credit in relevantCredits)
        {
            if (!staffByTmdbId.TryGetValue(credit.TmdbId, out var staff))
            {
                continue;
            }

            if (existingByStaffId.TryGetValue(staff.Staff_Id, out var existingLink))
            {
                if (!string.Equals(existingLink.Role, credit.Role, StringComparison.OrdinalIgnoreCase) &&
                    !string.IsNullOrWhiteSpace(credit.Role))
                {
                    existingLink.Role = credit.Role;
                    _movieStaffRepository.Update(existingLink);
                    hasUpdates = true;
                }

                continue;
            }

            linksToAdd.Add(new Movie_Staff
            {
                MovieId = movieId,
                Staff_Id = staff.Staff_Id,
                Role = credit.Role
            });
        }

        if (linksToAdd.Count > 0)
        {
            await _movieStaffRepository.AddRangeAsync(linksToAdd, cancellationToken);
            hasUpdates = true;
        }

        if (hasUpdates)
        {
            await _unitOfWork.CompleteAsync(cancellationToken);
        }
    }

    private static List<StaffCreditRecord> BuildRelevantStaffCredits(TmdbMovieCreditsResponse credits)
    {
        var byTmdbId = new Dictionary<int, StaffCreditRecord>();

        foreach (var cast in credits.Cast.Where(x => x.Id > 0 && !string.IsNullOrWhiteSpace(x.Name)))
        {
            MergeCredit(byTmdbId, new StaffCreditRecord(
                cast.Id,
                cast.Name!.Trim(),
                cast.KnownForDepartment?.Trim() ?? "Acting",
                string.IsNullOrWhiteSpace(cast.Character) ? "Actor" : cast.Character.Trim(),
                cast.Gender,
                cast.ProfilePath));
        }

        foreach (var crew in credits.Crew.Where(x =>
                     x.Id > 0 &&
                     !string.IsNullOrWhiteSpace(x.Name) &&
                     string.Equals(x.Job, "Director", StringComparison.OrdinalIgnoreCase)))
        {
            MergeCredit(byTmdbId, new StaffCreditRecord(
                crew.Id,
                crew.Name!.Trim(),
                crew.Department?.Trim() ?? "Directing",
                "Director",
                crew.Gender,
                crew.ProfilePath));
        }

        return byTmdbId.Values.ToList();
    }

    private static void MergeCredit(IDictionary<int, StaffCreditRecord> map, StaffCreditRecord incoming)
    {
        if (!map.TryGetValue(incoming.TmdbId, out var existing))
        {
            map[incoming.TmdbId] = incoming;
            return;
        }

        var mergedRole = MergeRoles(existing.Role, incoming.Role);

        map[incoming.TmdbId] = existing with
        {
            Department = string.IsNullOrWhiteSpace(existing.Department) ? incoming.Department : existing.Department,
            Role = mergedRole,
            Gender = existing.Gender ?? incoming.Gender,
            ProfilePath = string.IsNullOrWhiteSpace(existing.ProfilePath) ? incoming.ProfilePath : existing.ProfilePath
        };
    }

    private static string MergeRoles(string? currentRole, string? newRole)
    {
        var roles = new[] { currentRole, newRole }
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return roles.Count == 0 ? "Actor" : string.Join(" | ", roles);
    }

    private static bool ApplyStaffMetadata(Staff staff, string? department, int? gender, string? profilePath)
    {
        var changed = false;

        if (!string.IsNullOrWhiteSpace(department) && !string.Equals(staff.Department, department, StringComparison.Ordinal))
        {
            staff.Department = department;
            changed = true;
        }

        var mappedGender = MapGender(gender);
        if (!string.IsNullOrWhiteSpace(mappedGender) && !string.Equals(staff.Gender, mappedGender, StringComparison.Ordinal))
        {
            staff.Gender = mappedGender;
            changed = true;
        }

        var mappedProfile = BuildImageUrl(profilePath, "w185");
        if (!string.IsNullOrWhiteSpace(mappedProfile) && !string.Equals(staff.Profile_Path, mappedProfile, StringComparison.Ordinal))
        {
            staff.Profile_Path = mappedProfile;
            changed = true;
        }

        return changed;
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

    private static MovieListItemDto MapLocalMovieToListItem(Movie movie)
    {
        var genres = movie.MovieGenres
            .Select(x => x.Genre.Name)
            .Distinct()
            .ToList();

        return new MovieListItemDto(
            movie.MovieId,
            movie.TMDB_Id,
            movie.Title,
            movie.Poster_Url,
            movie.Backdrop_Url,
            movie.Release_Date,
            movie.Language,
            movie.Mpa_Certification,
            movie.Popularity,
            movie.TMDB_Rating,
            movie.TMDB_VoteCount,
            genres,
            Enumerable.Empty<string>());
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

    private sealed record StaffCreditRecord(
        int TmdbId,
        string Name,
        string? Department,
        string? Role,
        int? Gender,
        string? ProfilePath);
}
