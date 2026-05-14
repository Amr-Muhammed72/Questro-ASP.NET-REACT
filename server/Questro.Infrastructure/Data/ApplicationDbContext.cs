using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Questro.Core;
using Questro.Core.Entities.Games;
using Questro.Core.Entities.Movies;
using Questro.Core.Entities.Notifications;
using Questro.Core.Entities.Social;
using Questro.Core.Entities.UserManagement;

namespace Questro.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, long>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<MovieGenre> MovieGenres => Set<MovieGenre>();
    public DbSet<Movie_MovieGenre> MovieMovieGenres => Set<Movie_MovieGenre>();
    public DbSet<Staff> Staff => Set<Staff>();
    public DbSet<Movie_Staff> MovieStaff => Set<Movie_Staff>();

    public DbSet<Game> Games => Set<Game>();
    public DbSet<GamePhoto> GamePhotos => Set<GamePhoto>();
    public DbSet<GameGenre> GameGenres => Set<GameGenre>();
    public DbSet<Game_GameGenre> GameGameGenres => Set<Game_GameGenre>();
    public DbSet<GamePlatform> GamePlatforms => Set<GamePlatform>();
    public DbSet<Game_GamePlatform> GameGamePlatforms => Set<Game_GamePlatform>();

    public DbSet<UserMovieLike> UserMovieLikes => Set<UserMovieLike>();
    public DbSet<UserMovieRate> UserMovieRates => Set<UserMovieRate>();
    public DbSet<UserMovieReview> UserMovieReviews => Set<UserMovieReview>();
    public DbSet<UserMovieWatched> UserMovieWatched => Set<UserMovieWatched>();
    public DbSet<UserMovieWatchlist> UserMovieWatchlists => Set<UserMovieWatchlist>();
    public DbSet<UserMovieRecommended> UserMovieRecommended => Set<UserMovieRecommended>();

    public DbSet<UserGameLike> UserGameLikes => Set<UserGameLike>();
    public DbSet<UserGameRate> UserGameRates => Set<UserGameRate>();
    public DbSet<UserGameReview> UserGameReviews => Set<UserGameReview>();
    public DbSet<UserGameWishlist> UserGameWishlists => Set<UserGameWishlist>();
    public DbSet<UserGameRecommended> UserGameRecommended => Set<UserGameRecommended>();
    public DbSet<UserGamePlayed> UserGamePlayed => Set<UserGamePlayed>();

    public DbSet<UserFollow> UserFollows => Set<UserFollow>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<UserNotification> UserNotifications => Set<UserNotification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CoreAssemblyMarker).Assembly);
    }
}
