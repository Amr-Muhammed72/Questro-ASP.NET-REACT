using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Games;

namespace Questro.Core.EntitiesConfigurations.Games;

public class Game_GameGenreConfiguration : IEntityTypeConfiguration<Game_GameGenre>
{
    public void Configure(EntityTypeBuilder<Game_GameGenre> builder)
    {
        builder.HasKey(x => new { x.GameId, x.GenreId });

        builder.HasOne(x => x.Game)
            .WithMany(g => g.GameGenres)
            .HasForeignKey(x => x.GameId);

        builder.HasOne(x => x.Genre)
            .WithMany(g => g.GameGameGenres)
            .HasForeignKey(x => x.GenreId);
    }
}
