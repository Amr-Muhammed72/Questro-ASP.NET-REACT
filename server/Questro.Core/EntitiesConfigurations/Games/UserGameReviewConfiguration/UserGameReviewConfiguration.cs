using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Games;

namespace Questro.Core.EntitiesConfigurations.Games;

public class UserGameReviewConfiguration : IEntityTypeConfiguration<UserGameReview>
{
    public void Configure(EntityTypeBuilder<UserGameReview> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.GameId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany(u => u.GameReviews)
            .HasForeignKey(x => x.UserId);

        builder.HasOne(x => x.Game)
            .WithMany(g => g.UserReviews)
            .HasForeignKey(x => x.GameId);
    }
}

