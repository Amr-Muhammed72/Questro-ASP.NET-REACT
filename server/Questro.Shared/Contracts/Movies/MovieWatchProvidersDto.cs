namespace Questro.Shared.Contracts.Movies;

public sealed record MovieWatchProvidersDto(
    string CountryCode,
    string? Link,
    IEnumerable<MovieWatchProviderItemDto> Flatrate,
    IEnumerable<MovieWatchProviderItemDto> Rent,
    IEnumerable<MovieWatchProviderItemDto> Buy);
