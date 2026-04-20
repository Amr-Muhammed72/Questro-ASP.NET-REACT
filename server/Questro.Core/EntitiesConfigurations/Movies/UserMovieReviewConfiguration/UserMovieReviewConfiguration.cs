using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Movies;

namespace Questro.Core.EntitiesConfigurations.Movies;

public class UserMovieReviewConfiguration : IEntityTypeConfiguration<UserMovieReview>
{
    public void Configure(EntityTypeBuilder<UserMovieReview> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.MovieId }).IsUnique();
        builder.Property(x => x.Sentiment).HasMaxLength(32).IsRequired(false);

        builder.HasOne(x => x.User)
            .WithMany(u => u.MovieReviews)
            .HasForeignKey(x => x.UserId);

        builder.HasOne(x => x.Movie)
            .WithMany(m => m.UserReviews)
            .HasForeignKey(x => x.MovieId);
    }
}

