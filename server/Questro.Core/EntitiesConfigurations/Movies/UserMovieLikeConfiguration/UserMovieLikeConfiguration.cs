using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Movies;

namespace Questro.Core.EntitiesConfigurations.Movies;

public class UserMovieLikeConfiguration : IEntityTypeConfiguration<UserMovieLike>
{
    public void Configure(EntityTypeBuilder<UserMovieLike> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.MovieId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany(u => u.MovieLikes)
            .HasForeignKey(x => x.UserId);

        builder.HasOne(x => x.Movie)
            .WithMany(m => m.UserLikes)
            .HasForeignKey(x => x.MovieId);
    }
}

