using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
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

		var stringListConverter = new ValueConverter<List<string>, string>(
			v => string.Join("|", v),
			v => string.IsNullOrWhiteSpace(v) ? new List<string>() : v.Split('|', StringSplitOptions.RemoveEmptyEntries).ToList()
		);

		var stringListComparer = new ValueComparer<List<string>>(
			(c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
			c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
			c => c.ToList()
		);

		builder.Property(x => x.MovieGenresFav).HasConversion(stringListConverter, stringListComparer);
		builder.Property(x => x.MovieGenresDisliked).HasConversion(stringListConverter, stringListComparer);
		builder.Property(x => x.GameGenresFav).HasConversion(stringListConverter, stringListComparer);
		builder.Property(x => x.GameGenresDisliked).HasConversion(stringListConverter, stringListComparer);
	}
}
