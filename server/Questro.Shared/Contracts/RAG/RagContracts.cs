using System.Text.Json.Serialization;

namespace Questro.Shared.Contracts.RAG;

/// <summary>
/// Client request DTO for RAG recommendation endpoint containing only query and k
/// </summary>
public sealed class RagQueryRequest
{
    /// <summary>
    /// Natural-language search query (required)
    /// </summary>
    [JsonPropertyName("query")]
    public string Query { get; set; } = string.Empty;

    /// <summary>
    /// Number of results to return (default: 5, max: 50)
    /// </summary>
    [JsonPropertyName("k")]
    public int K { get; set; } = 5;
}

/// <summary>
/// Request DTO for RAG recommendation endpoint
/// </summary>
public sealed class RagRecommendationRequest
{
    /// <summary>
    /// Natural-language search query (required)
    /// </summary>
    [JsonPropertyName("query")]
    public string Query { get; set; } = string.Empty;

    /// <summary>
    /// Number of results to return (default: 5, max: 50)
    /// </summary>
    [JsonPropertyName("k")]
    public int K { get; set; } = 5;

    /// <summary>
    /// Whether to allow adult content (default: false)
    /// </summary>
    [JsonPropertyName("allow_adult")]
    public bool AllowAdult { get; set; } = false;

    /// <summary>
    /// List of genres to block/exclude (case-insensitive)
    /// </summary>
    [JsonPropertyName("blocked_genres")]
    public List<string> BlockedGenres { get; set; } = new();

    /// <summary>
    /// User profile data for ML-based re-ranking (optional)
    /// </summary>
    [JsonPropertyName("user")]
    public RagUserProfile? User { get; set; }
}

/// <summary>
/// User profile for personalized recommendations
/// </summary>
public sealed class RagUserProfile
{
    [JsonPropertyName("age")]
    public int? Age { get; set; }

    [JsonPropertyName("gender")]
    public string? Gender { get; set; }

    [JsonPropertyName("profession")]
    public string? Profession { get; set; }

    [JsonPropertyName("country")]
    public string? Country { get; set; }

    [JsonPropertyName("movie_genres_fav")]
    public string? MovieGenresFav { get; set; }

    [JsonPropertyName("movie_genres_disliked")]
    public string? MovieGenresDisliked { get; set; }

    [JsonPropertyName("game_genres_fav")]
    public string? GameGenresFav { get; set; }

    [JsonPropertyName("game_genres_disliked")]
    public string? GameGenresDisliked { get; set; }

    [JsonPropertyName("ratings")]
    public List<RagUserRating> Ratings { get; set; } = new();
}

/// <summary>
/// User rating signal for RAG personalization
/// </summary>
public sealed class RagUserRating
{
    [JsonPropertyName("item_id")]
    public string ItemId { get; set; } = string.Empty;

    [JsonPropertyName("stars")]
    public double? Stars { get; set; }
}

/// <summary>
/// Response DTO for RAG recommendation endpoint
/// </summary>
public sealed class RagRecommendationResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = "success";

    [JsonPropertyName("query")]
    public string Query { get; set; } = string.Empty;

    [JsonPropertyName("retrieved_items")]
    public List<RagRecommendedItem> RetrievedItems { get; set; } = new();

    [JsonPropertyName("generated_prompt")]
    public string GeneratedPrompt { get; set; } = string.Empty;

    [JsonPropertyName("llm_response")]
    public string? LlmResponse { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }
}

/// <summary>
/// Individual recommended item from RAG
/// </summary>
public sealed class RagRecommendedItem
{
    [JsonPropertyName("score")]
    public double Score { get; set; }

    [JsonPropertyName("data")]
    public RagItemData Data { get; set; } = new();
}

/// <summary>
/// Item data from RAG recommendation
/// </summary>
public sealed class RagItemData
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty; // "game" or "movie"

    [JsonPropertyName("themes")]
    public string Themes { get; set; } = string.Empty;

    [JsonPropertyName("narrative")]
    public string? Narrative { get; set; }

    [JsonPropertyName("genres")]
    public List<string> Genres { get; set; } = new();

    [JsonPropertyName("year")]
    public int? Year { get; set; }

    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }
}
