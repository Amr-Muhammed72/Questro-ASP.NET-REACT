using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Movies;

namespace Questro.Core.EntitiesConfigurations.Movies;

public class StaffConfiguration : IEntityTypeConfiguration<Staff>
{
    public void Configure(EntityTypeBuilder<Staff> builder)
    {
        builder.HasKey(x => x.Staff_Id);
        builder.Property(x => x.Name).IsRequired();
    }
}
