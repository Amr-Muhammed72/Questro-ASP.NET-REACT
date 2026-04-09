using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Games;

namespace Questro.Core.EntitiesConfigurations.Games;

public class UserGameRateConfiguration : IEntityTypeConfiguration<UserGameRate>
{
    public void Configure(EntityTypeBuilder<UserGameRate> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.GameId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany(u => u.GameRates)
            .HasForeignKey(x => x.UserId);

        builder.HasOne(x => x.Game)
            .WithMany(g => g.UserRates)
            .HasForeignKey(x => x.GameId);
    }
}

