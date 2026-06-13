using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Games;

namespace Questro.Core.EntitiesConfigurations.Games;

public class UserGamePlayedConfiguration : IEntityTypeConfiguration<UserGamePlayed>
{
    public void Configure(EntityTypeBuilder<UserGamePlayed> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => new { x.UserId, x.GameId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany(u => u.GamePlayed)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Game)
            .WithMany()
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
