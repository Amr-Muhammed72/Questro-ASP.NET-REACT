using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Questro.Service.Abstractions.RAG;
using Questro.Shared.Contracts.RAG;
using System.Net.Http.Json;
using System.Text.Json;

namespace Questro.Service.Services.RAG;

/// <summary>
/// Service implementation for RAG recommendations
/// Communicates with external RAG service for vector search and LLM-based recommendations
/// </summary>
public class RagService : IRagService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RagService> _logger;
    private readonly string _ragServiceUrl;
    private readonly int _requestTimeoutSeconds;

    public RagService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<RagService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        
        // Get RAG service URL from configuration, with fallback to localhost
        _ragServiceUrl = configuration.GetSection("RagService:Url").Value 
            ?? "http://localhost:5000";
        
        // Get request timeout from configuration, default to 30 seconds
        var timeoutValue = configuration.GetSection("RagService:TimeoutSeconds").Get<int?>();
        _requestTimeoutSeconds = timeoutValue ?? 30;
    }

    public async Task<RagRecommendationResponse> GetRecommendationsAsync(
        RagRecommendationRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Validate request
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                return new RagRecommendationResponse
                {
                    Status = "error",
                    Error = "Query parameter is required"
                };
            }

            // Ensure K is within bounds
            request.K = Math.Min(request.K, 50);
            request.K = Math.Max(request.K, 1);

            _logger.LogInformation(
                "Requesting RAG recommendations for query: {Query} with K={K}",
                request.Query,
                request.K);

            var requestUri = $"{_ragServiceUrl}/api/recommend";
            
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(_requestTimeoutSeconds));
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, cts.Token);

            var response = await _httpClient.PostAsJsonAsync(
                requestUri,
                request,
                cancellationToken: linkedCts.Token);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(linkedCts.Token);
                _logger.LogWarning(
                    "RAG service returned status {StatusCode}: {ErrorContent}",
                    response.StatusCode,
                    errorContent);

                // If service is initializing (503), return appropriate response
                if (response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable)
                {
                    return new RagRecommendationResponse
                    {
                        Status = "initializing",
                        Error = "RAG service is still loading. Please retry in a few seconds."
                    };
                }

                return new RagRecommendationResponse
                {
                    Status = "error",
                    Error = $"RAG service error: {response.ReasonPhrase}"
                };
            }

            var ragResponse = await response.Content.ReadFromJsonAsync<RagRecommendationResponse>(cancellationToken: linkedCts.Token)
                ?? new RagRecommendationResponse { Status = "error", Error = "Empty response from RAG service" };

            _logger.LogInformation(
                "Successfully retrieved {Count} recommendations from RAG service",
                ragResponse.RetrievedItems.Count);

            return ragResponse;
        }
        catch (OperationCanceledException ex)
        {
            _logger.LogWarning(ex, "RAG recommendation request was cancelled or timed out");
            return new RagRecommendationResponse
            {
                Status = "error",
                Error = "Request timeout - RAG service took too long to respond"
            };
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error occurred while calling RAG service");
            return new RagRecommendationResponse
            {
                Status = "error",
                Error = $"Failed to connect to RAG service: {ex.Message}"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred in RagService.GetRecommendationsAsync");
            return new RagRecommendationResponse
            {
                Status = "error",
                Error = "An unexpected error occurred while processing recommendations"
            };
        }
    }

    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Checking RAG service health");
            
            var healthUrl = $"{_ragServiceUrl}/health";
            
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, cts.Token);

            var response = await _httpClient.GetAsync(healthUrl, linkedCts.Token);
            
            bool isHealthy = response.IsSuccessStatusCode;
            _logger.LogInformation("RAG service health check result: {IsHealthy}", isHealthy);
            
            return isHealthy;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "RAG service health check failed");
            return false;
        }
    }
}
