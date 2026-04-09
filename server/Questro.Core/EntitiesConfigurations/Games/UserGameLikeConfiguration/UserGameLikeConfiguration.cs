using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Games;

namespace Questro.Core.EntitiesConfigurations.Games;

public class UserGameLikeConfiguration : IEntityTypeConfiguration<UserGameLike>
{
    public void Configure(EntityTypeBuilder<UserGameLike> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.GameId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany(u => u.GameLikes)
            .HasForeignKey(x => x.UserId);

        builder.HasOne(x => x.Game)
            .WithMany(g => g.UserLikes)
            .HasForeignKey(x => x.GameId);
    }
}

