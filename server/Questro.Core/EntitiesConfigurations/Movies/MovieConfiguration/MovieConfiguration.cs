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

        builder.HasIndex(x => x.TMDB_Id).IsUnique();
    }
}
