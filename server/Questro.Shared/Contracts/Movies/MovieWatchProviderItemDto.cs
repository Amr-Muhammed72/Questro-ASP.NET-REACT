namespace Questro.Shared.Contracts.Movies;

public sealed record MovieWatchProviderItemDto(
    int ProviderId,
    string ProviderName,
    string? LogoUrl,
    int? DisplayPriority);
