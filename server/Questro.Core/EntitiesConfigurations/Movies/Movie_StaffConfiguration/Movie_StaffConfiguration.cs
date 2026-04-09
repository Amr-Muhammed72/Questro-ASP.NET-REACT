using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Movies;

namespace Questro.Core.EntitiesConfigurations.Movies;

public class Movie_StaffConfiguration : IEntityTypeConfiguration<Movie_Staff>
{
    public void Configure(EntityTypeBuilder<Movie_Staff> builder)
    {
        builder.HasKey(x => new { x.MovieId, x.Staff_Id });

        builder.HasOne(x => x.Movie)
            .WithMany(m => m.MovieStaffs)
            .HasForeignKey(x => x.MovieId);

        builder.HasOne(x => x.Staff)
            .WithMany(s => s.MovieStaffs)
            .HasForeignKey(x => x.Staff_Id);
    }
}
