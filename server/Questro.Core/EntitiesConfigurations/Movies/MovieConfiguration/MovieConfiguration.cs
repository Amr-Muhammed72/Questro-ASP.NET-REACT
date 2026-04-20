using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Movies;

namespace Questro.Core.EntitiesConfigurations.Movies;

public class MovieConfiguration : IEntityTypeConfiguration<Movie>
{
    public void Configure(EntityTypeBuilder<Movie> builder)
    {
        builder.HasKey(x => x.MovieId);
        builder.Property(x => x.Title).IsRequired();
        builder.Property(x => x.Language).HasMaxLength(20);
        builder.Property(x => x.IMDB_Rating).HasMaxLength(20);
        builder.Property(x => x.Mpa_Certification).HasMaxLength(50);

        builder.HasIndex(x => x.Release_Date);
        builder.HasIndex(x => x.Popularity);
        builder.HasIndex(x => x.TMDB_Rating);
        builder.HasIndex(x => x.Language);

        builder.HasIndex(x => x.TMDB_Id).IsUnique();
    }
}
