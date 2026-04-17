using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Movies;

namespace Questro.Core.EntitiesConfigurations.Movies;

public class MovieGenreConfiguration : IEntityTypeConfiguration<MovieGenre>
{
    public void Configure(EntityTypeBuilder<MovieGenre> builder)
    {
        builder.HasKey(x => x.GenreId);
        builder.Property(x => x.Name).IsRequired();
        builder.Property(x => x.TMDB_Id).IsRequired(false);
        builder.HasIndex(x => x.TMDB_Id).IsUnique();
    }
}
