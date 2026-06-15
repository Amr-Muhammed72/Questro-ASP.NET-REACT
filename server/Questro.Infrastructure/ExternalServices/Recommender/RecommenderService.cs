using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Questro.Infrastructure.Abstractions;
using Questro.Shared.Contracts.Recommender;
using Questro.Shared.Options.Recommender;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace Questro.Infrastructure.ExternalServices.Recommender;

public sealed class RecommenderService : IRecommenderService
{
    private readonly HttpClient _httpClient;
    private readonly RecommenderOptions _options;
    private readonly ILogger<RecommenderService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    public RecommenderService(
        HttpClient httpClient,
        IOptions<RecommenderOptions> options,
        ILogger<RecommenderService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<RecommenderResponse?> GetRecommendationsAsync(
        RecommenderRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var json = JsonSerializer.Serialize(request, JsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _logger.LogDebug(
                "Calling recommender API: domain={Domain}, k={K}, offset={Offset}",
                request.Domain, request.K, request.Offset);

            var response = await _httpClient.PostAsync("/recommend", content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning(
                    "Recommender API returned {StatusCode} for domain={Domain}. Body: {ErrorBody}",
                    (int)response.StatusCode, request.Domain, errorBody);
                return null;
            }

            var result = await response.Content.ReadFromJsonAsync<RecommenderResponse>(
                cancellationToken: cancellationToken);

            _logger.LogDebug(
                "Recommender API returned {Count} recommendations for domain={Domain}",
                result?.Count ?? 0, request.Domain);

            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex,
                "Recommender API request failed for domain={Domain}. Error: {ErrorMessage}",
                request.Domain, BuildExceptionMessage(ex));
            return null;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex,
                "Recommender API request timed out for domain={Domain}. Error: {ErrorMessage}",
                request.Domain, BuildExceptionMessage(ex));
            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex,
                "Recommender API response parsing failed for domain={Domain}. Error: {ErrorMessage}",
                request.Domain, BuildExceptionMessage(ex));
            return null;
        }
    }

    private static string BuildExceptionMessage(Exception exception)
    {
        var builder = new StringBuilder();
        var current = exception;
        var isFirst = true;

        while (current is not null)
        {
            if (!isFirst)
            {
                builder.Append(" | Inner: ");
            }

            builder.Append(current.Message);
            current = current.InnerException;
            isFirst = false;
        }

        return builder.ToString();
    }
}
