using Microsoft.AspNetCore.Identity;
using Questro.Core.Entities.Games;
using Questro.Core.Entities.Movies;
using Questro.Core.Entities.Social;
using Questro.Core.Entities.Users;

namespace Questro.Core.Entities.UserManagement;

public class ApplicationUser : IdentityUser<long>
{
	public string? FirstName { get; set; }
	public string? LastName { get; set; }
	public DateTime? BirthDate { get; set; }
	public string? Gender { get; set; }
	public string? Bio { get; set; }
	public int? Age { get; set; }
	public DateTime? JoinDate { get; set; }
	public string? ProfilePic { get; set; }
	public UserInterest PrimaryInterest { get; set; } = UserInterest.Mixed;
	public bool IsHistoryPublic { get; set; } = true;
	public bool IsProfileCompleted { get; set; } = true;
    public virtual ICollection<UserMovieLike> MovieLikes { get; set; } = new HashSet<UserMovieLike>();
	public virtual ICollection<UserMovieRate> MovieRates { get; set; } = new HashSet<UserMovieRate>();
	public virtual ICollection<UserMovieReview> MovieReviews { get; set; } = new HashSet<UserMovieReview>();
	public virtual ICollection<UserMovieWatched> MovieWatched { get; set; } = new HashSet<UserMovieWatched>();
	public virtual ICollection<UserMovieWatchlist> MovieWatchlists { get; set; } = new HashSet<UserMovieWatchlist>();
	public virtual ICollection<UserMovieRecommended> MovieRecommendations { get; set; } = new HashSet<UserMovieRecommended>();

	public virtual ICollection<UserGameLike> GameLikes { get; set; } = new HashSet<UserGameLike>();
	public virtual ICollection<UserGameRate> GameRates { get; set; } = new HashSet<UserGameRate>();
	public virtual ICollection<UserGameReview> GameReviews { get; set; } = new HashSet<UserGameReview>();
	public virtual ICollection<UserGameWishlist> GameWishlists { get; set; } = new HashSet<UserGameWishlist>();
	public virtual ICollection<UserGameRecommended> GameRecommendations { get; set; } = new HashSet<UserGameRecommended>();
	public virtual ICollection<UserGamePlayed> GamePlayed { get; set; } = new HashSet<UserGamePlayed>();

	public long? ParentId { get; set; }
	public bool IsChildAccount => ParentId.HasValue;

	public virtual ApplicationUser? Parent { get; set; }
	public virtual ICollection<ApplicationUser> Children { get; set; } = new HashSet<ApplicationUser>();
	public virtual ChildRestriction? ChildRestriction { get; set; }

	public virtual ICollection<UserFollow> Following { get; set; } = new HashSet<UserFollow>();
	public virtual ICollection<UserFollow> Followers { get; set; } = new HashSet<UserFollow>();

	public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new HashSet<RefreshToken>();
}