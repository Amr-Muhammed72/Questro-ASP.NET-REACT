namespace Questro.Core.Entities.Games;

public class Game
{
    public int GameId { get; set; }
    public int? RAWG_Id { get; set; }
    public DateTime? Release_Date { get; set; }
    public string Title { get; set; } = null!;
    public string? Overview { get; set; }
    public double? Popularity { get; set; }
    public double? Rating { get; set; }
    public string? Poster_Url { get; set; }
    public string? Backdrop_Url { get; set; }
    public string? Trailer_Url { get; set; }
    public string? Store_Url { get; set; }
    
    public virtual ICollection<GamePhoto> Photos { get; set; } = new HashSet<GamePhoto>();
    public virtual ICollection<Game_GameGenre> GameGenres { get; set; } = new HashSet<Game_GameGenre>();
    public virtual ICollection<Game_GamePlatform> GamePlatforms { get; set; } = new HashSet<Game_GamePlatform>();

    public virtual ICollection<UserGameLike> UserLikes { get; set; } = new HashSet<UserGameLike>();
    public virtual ICollection<UserGameRate> UserRates { get; set; } = new HashSet<UserGameRate>();
    public virtual ICollection<UserGameReview> UserReviews { get; set; } = new HashSet<UserGameReview>();
    public virtual ICollection<UserGameWishlist> UserWishlists { get; set; } = new HashSet<UserGameWishlist>();
    public virtual ICollection<UserGameRecommended> UserRecommendations { get; set; } = new HashSet<UserGameRecommended>();
}
