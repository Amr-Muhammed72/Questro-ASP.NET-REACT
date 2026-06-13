using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Games;

namespace Questro.Core.EntitiesConfigurations.Games;

public class GamePhotoConfiguration : IEntityTypeConfiguration<GamePhoto>
{
    public void Configure(EntityTypeBuilder<GamePhoto> builder)
    {
        builder.HasKey(x => x.GamePhotoId);

        builder.Property(x => x.Image_Url)
            .IsRequired()
            .HasMaxLength(2048);

        builder.HasIndex(x => x.GameId);
        builder.HasIndex(x => new { x.GameId, x.RAWG_Id })
            .IsUnique()
            .HasFilter("[RAWG_Id] IS NOT NULL");

        builder.HasOne(x => x.Game)
            .WithMany(g => g.Photos)
            .HasForeignKey(x => x.GameId);
    }
}
