using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.UserManagement;

namespace Questro.Core.EntitiesConfigurations.UserManagement;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
	public void Configure(EntityTypeBuilder<ApplicationUser> builder)
	{
		builder.Property(x => x.ParentId)
			.IsRequired(false);

		builder.HasOne(x => x.Parent)
			.WithMany(x => x.Children)
			.HasForeignKey(x => x.ParentId)
			.OnDelete(DeleteBehavior.Restrict);

		builder.HasIndex(x => x.ParentId);
	}
}
