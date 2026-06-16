using System.Text.Json.Serialization;

namespace Questro.Shared.Contracts.Recommender;

// ── Request DTOs ────────────────────────────────────────────────────────────

public sealed class RecommenderRequest
{
    [JsonPropertyName("user")]
    public RecommenderUserProfile User { get; set; } = new();
   
    [JsonPropertyName("domain")]
    public string Domain { get; set; } = "movie";

    [JsonPropertyName("k")]
    public int K { get; set; } = 10;

    [JsonPropertyName("offset")]
    public int Offset { get; set; } = 0;

    [JsonPropertyName("blocked_genres")]
    public List<string> BlockedGenres { get; set; } = new();
}

public sealed class RecommenderUserProfile
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
    public List<RecommenderRatingSignal> Ratings { get; set; } = new();
}

public sealed class RecommenderRatingSignal
{
    [JsonPropertyName("item_id")]
    public string ItemId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("rating")]
    public string? Rating { get; set; }

    [JsonPropertyName("stars")]
    public double? Stars { get; set; }

    [JsonPropertyName("source")]
    public string? Source { get; set; }
}

// ── Response DTOs ───────────────────────────────────────────────────────────

public sealed class RecommenderResponse
{
    [JsonPropertyName(name: "count")]
    public int Count { get; set; }

    [JsonPropertyName("total_available")]
    public int TotalAvailable { get; set; }

    [JsonPropertyName("domain")]
    public string? Domain { get; set; }

    [JsonPropertyName("offset")]
    public int Offset { get; set; }

    [JsonPropertyName("k")]
    public int K { get; set; }

    [JsonPropertyName("recommendations")]
    public List<RecommenderItem> Recommendations { get; set; } = new();

    [JsonPropertyName("signals_used")]
    public int SignalsUsed { get; set; }

    [JsonPropertyName("blocked_genres")]
    public List<string>? BlockedGenres { get; set; }

    [JsonPropertyName("model_version")]
    public string? ModelVersion { get; set; }

    [JsonPropertyName("has_more")]
    public bool HasMore { get; set; }
}

public sealed class RecommenderItem
{
    [JsonPropertyName("item_id")]
    public int itemId { get; set; }
    [JsonPropertyName("item_key")]
    public string? ItemKey { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("domain")]
    public string? Domain { get; set; }

    [JsonPropertyName("score")]
    public double Score { get; set; }

    
}
