using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Movies;

namespace Questro.Core.EntitiesConfigurations.Movies;

public class Movie_MovieGenreConfiguration : IEntityTypeConfiguration<Movie_MovieGenre>
{
    public void Configure(EntityTypeBuilder<Movie_MovieGenre> builder)
    {
        builder.HasKey(x => new { x.MovieId, x.GenreId });

        builder.HasOne(x => x.Movie)
            .WithMany(m => m.MovieGenres)
            .HasForeignKey(x => x.MovieId);

        builder.HasOne(x => x.Genre)
            .WithMany(g => g.MovieMovieGenres)
            .HasForeignKey(x => x.GenreId);
    }
}
