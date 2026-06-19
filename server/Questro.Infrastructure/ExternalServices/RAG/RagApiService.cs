using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Questro.Infrastructure.Abstractions;
using Questro.Shared.Contracts.RAG;
using Questro.Shared.Options.Rag;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace Questro.Infrastructure.ExternalServices.RAG;

public sealed class RagApiService : IRagApiService
{
    private readonly HttpClient _httpClient;
    private readonly RagOptions _options;
    private readonly ILogger<RagApiService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    public RagApiService(
        HttpClient httpClient,
        IOptions<RagOptions> options,
        ILogger<RagApiService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<RagRecommendationResponse?> GetRecommendationsAsync(
        RagRecommendationRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var json = JsonSerializer.Serialize(request, JsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _logger.LogDebug(
                "Calling RAG API: query={Query}, k={K}, allow_adult={AllowAdult}",
                request.Query, request.K, request.AllowAdult);

            var response = await _httpClient.PostAsync("/api/recommend", content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning(
                    "RAG API returned {StatusCode} for query={Query}. Body: {ErrorBody}",
                    (int)response.StatusCode, request.Query, errorBody);

                // Return a structured error response for 503 (initializing)
                if (response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable)
                {
                    return new RagRecommendationResponse
                    {
                        Status = "initializing",
                        Query = request.Query,
                        Error = "RAG service is still loading. Please try again in a few seconds."
                    };
                }

                return null;
            }

            var result = await response.Content.ReadFromJsonAsync<RagRecommendationResponse>(
                JsonOptions, cancellationToken: cancellationToken);

            _logger.LogDebug(
                "RAG API returned {Count} items for query={Query}",
                result?.RetrievedItems?.Count ?? 0, request.Query);

            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex,
                "RAG API request failed for query={Query}. Error: {ErrorMessage}",
                request.Query, BuildExceptionMessage(ex));
            return null;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex,
                "RAG API request timed out for query={Query}. Error: {ErrorMessage}",
                request.Query, BuildExceptionMessage(ex));
            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex,
                "RAG API response parsing failed for query={Query}. Error: {ErrorMessage}",
                request.Query, BuildExceptionMessage(ex));
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
