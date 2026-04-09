using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Games;

namespace Questro.Core.EntitiesConfigurations.Games;

public class Game_GamePlatformConfiguration : IEntityTypeConfiguration<Game_GamePlatform>
{
    public void Configure(EntityTypeBuilder<Game_GamePlatform> builder)
    {
        builder.HasKey(x => new { x.GameId, x.Platform_Id });

        builder.HasOne(x => x.Game)
            .WithMany(g => g.GamePlatforms)
            .HasForeignKey(x => x.GameId);

        builder.HasOne(x => x.Platform)
            .WithMany(p => p.GameGamePlatforms)
            .HasForeignKey(x => x.Platform_Id);
    }
}
