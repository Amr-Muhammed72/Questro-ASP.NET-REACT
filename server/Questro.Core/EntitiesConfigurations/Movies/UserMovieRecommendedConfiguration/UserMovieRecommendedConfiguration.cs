using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Movies;

namespace Questro.Core.EntitiesConfigurations.Movies;

public class UserMovieRecommendedConfiguration : IEntityTypeConfiguration<UserMovieRecommended>
{
    public void Configure(EntityTypeBuilder<UserMovieRecommended> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.MovieId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany(u => u.MovieRecommendations)
            .HasForeignKey(x => x.UserId);

        builder.HasOne(x => x.Movie)
            .WithMany(m => m.UserRecommendations)
            .HasForeignKey(x => x.MovieId);
    }
}

