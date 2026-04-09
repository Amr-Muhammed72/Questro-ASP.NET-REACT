using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Movies;

namespace Questro.Core.EntitiesConfigurations.Movies;

public class UserMovieRateConfiguration : IEntityTypeConfiguration<UserMovieRate>
{
    public void Configure(EntityTypeBuilder<UserMovieRate> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.MovieId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany(u => u.MovieRates)
            .HasForeignKey(x => x.UserId);

        builder.HasOne(x => x.Movie)
            .WithMany(m => m.UserRates)
            .HasForeignKey(x => x.MovieId);
    }
}

