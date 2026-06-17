using Questro.Infrastructure.Abstractions;
using Questro.Service.Abstractions.Search;
using Questro.Shared.Contracts.Games;
using Questro.Shared.Contracts.Movies;
using Questro.Shared.Contracts.Search;

namespace Questro.Service.Services.Search;

public class GlobalSearchService : IGlobalSearchService
{
    private readonly ITmdbService _tmdbService;
    private readonly IRawgService _rawgService;
    private readonly IUserQueryRepository _userQueryRepository;

    public GlobalSearchService(
        ITmdbService tmdbService,
        IRawgService rawgService,
        IUserQueryRepository userQueryRepository)
    {
        _tmdbService = tmdbService;
        _rawgService = rawgService;
        _userQueryRepository = userQueryRepository;
    }

    public async Task<GlobalSearchResultDto> SearchAsync(string query, bool isChildAccount, int limit = 5, CancellationToken cancellationToken = default)
    {
        var result = new GlobalSearchResultDto();

        if (string.IsNullOrWhiteSpace(query))
        {
            return result;
        }

        limit = Math.Clamp(limit, 1, 20);

        var movieSpec = new MovieSpecParams { Search = query, PageIndex = 1, PageSize = limit };
        var gameSpec = new GameSpecParams { Search = query, PageIndex = 1, PageSize = limit };

        var moviesTask = _tmdbService.SearchMoviesAsync(movieSpec, isChildAccount, cancellationToken);
        var gamesTask = _rawgService.SearchGamesAsync(gameSpec, isChildAccount, cancellationToken);
        var actorsTask = _tmdbService.SearchPersonsAsync(query, 1, cancellationToken);

        await Task.WhenAll(moviesTask, gamesTask, actorsTask);

        var moviesResult = moviesTask.Result;
        if (moviesResult?.Results != null)
        {
            result.Movies = moviesResult.Results.Take(limit).Select(m => new MovieSummaryDto
            {
                TmdbId = m.Id,
                Title = m.Title ?? string.Empty,
                PosterUrl = !string.IsNullOrWhiteSpace(m.PosterPath) ? $"https://image.tmdb.org/t/p/w500{m.PosterPath}" : null,
                ReleaseDate = DateTime.TryParse(m.ReleaseDate, out var date) ? date : null
            });
        }

        var gamesResult = gamesTask.Result;
        if (gamesResult?.Results != null)
        {
            result.Games = gamesResult.Results.Take(limit).Select(g => new GameSummaryDto
            {
                RawgId = g.Id,
                Name = g.Name ?? string.Empty,
                BackgroundImageUrl = g.BackgroundImage,
                Released = DateTime.TryParse(g.Released, out var date) ? date : null
            });
        }

        var actorsResult = actorsTask.Result;
        if (actorsResult?.Results != null)
        {
            result.Actors = actorsResult.Results.Take(limit).Select(a => new ActorSummaryDto
            {
                TmdbId = a.Id,
                Name = a.Name ?? string.Empty,
                ProfileUrl = !string.IsNullOrWhiteSpace(a.ProfilePath) ? $"https://image.tmdb.org/t/p/w500{a.ProfilePath}" : null
            });
        }

        result.Users = await _userQueryRepository.SearchUsersAsync(query, limit, cancellationToken);

        return result;
    }
}
