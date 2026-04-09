using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Games;

namespace Questro.Core.EntitiesConfigurations.Games;

public class UserGameRecommendedConfiguration : IEntityTypeConfiguration<UserGameRecommended>
{
    public void Configure(EntityTypeBuilder<UserGameRecommended> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.GameId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany(u => u.GameRecommendations)
            .HasForeignKey(x => x.UserId);

        builder.HasOne(x => x.Game)
            .WithMany(g => g.UserRecommendations)
            .HasForeignKey(x => x.GameId);
    }
}

