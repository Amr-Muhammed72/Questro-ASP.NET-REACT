using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Movies;

namespace Questro.Core.EntitiesConfigurations.Movies;

public class UserMovieWatchlistConfiguration : IEntityTypeConfiguration<UserMovieWatchlist>
{
    public void Configure(EntityTypeBuilder<UserMovieWatchlist> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.MovieId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany(u => u.MovieWatchlists)
            .HasForeignKey(x => x.UserId);

        builder.HasOne(x => x.Movie)
            .WithMany(m => m.UserWatchlists)
            .HasForeignKey(x => x.MovieId);
    }
}

