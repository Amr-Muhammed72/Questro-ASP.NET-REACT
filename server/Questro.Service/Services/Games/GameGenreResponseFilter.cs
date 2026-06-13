using Questro.Core.Entities.Games;
using Questro.Infrastructure.ExternalServices.RAWG.Contracts;
using Questro.Shared.Contracts.Games;

namespace Questro.Service.Services.Games;

internal static class GameGenreResponseFilter
{
    private const int HiddenGenreId = 40;
    private const string HiddenGenreName = "Casual";

    public static bool IsHiddenGenreId(int? id)
    {
        return id == HiddenGenreId;
    }

    public static bool IsVisible(string? name)
    {
        return !IsHidden(null, name);
    }

    public static bool IsVisible(GameGenreDto genre)
    {
        return !IsHidden(genre.Id, genre.Name);
    }

    public static bool IsVisible(RawgGenreDto genre)
    {
        return !IsHidden(genre.Id, genre.Name);
    }

    public static bool IsGameVisible(RawgGameSummaryDto game)
    {
        return !ContainsHidden(game.Genres);
    }

    public static bool ContainsHidden(RawgGameDetailsResponse? game)
    {
        return game is not null && ContainsHidden(game.Genres);
    }

    public static bool ContainsHidden(Game? game)
    {
        return game is not null && game.GameGenres.Any(IsHidden);
    }

    public static bool ContainsHidden(IEnumerable<RawgGenreDto> genres)
    {
        return genres.Any(x => IsHidden(x.Id, x.Name));
    }

    public static bool ContainsHidden(IEnumerable<GameGenreDto> genres)
    {
        return genres.Any(x => IsHidden(x.Id, x.Name));
    }

    public static IEnumerable<GameGenreDto> ExcludeHidden(IEnumerable<GameGenreDto> genres)
    {
        return genres.Where(IsVisible);
    }

    private static bool IsHidden(Game_GameGenre genreLink)
    {
        return IsHidden(genreLink.Genre.RAWG_Id ?? genreLink.GenreId, genreLink.Genre.Name);
    }

    private static bool IsHidden(int? id, string? name)
    {
        return id == HiddenGenreId ||
               string.Equals(name?.Trim(), HiddenGenreName, StringComparison.OrdinalIgnoreCase);
    }
}
