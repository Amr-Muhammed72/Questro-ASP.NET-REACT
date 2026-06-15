using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.UserManagement;

namespace Questro.Core.EntitiesConfigurations.UserManagement;

public class ChildRestrictionConfiguration : IEntityTypeConfiguration<ChildRestriction>
{
	private static readonly JsonSerializerOptions JsonOptions = new()
	{
		PropertyNameCaseInsensitive = true
	};

	public void Configure(EntityTypeBuilder<ChildRestriction> builder)
	{
		builder.HasKey(x => x.UserId);

		builder.Property(x => x.BlockedMovieGenreIds)
			.HasConversion(
				v => JsonSerializer.Serialize(v, JsonOptions),
				v => JsonSerializer.Deserialize<List<int>>(v, JsonOptions) ?? new List<int>())
			.HasColumnType("nvarchar(max)");

		builder.Property(x => x.BlockedGameGenreIds)
			.HasConversion(
				v => JsonSerializer.Serialize(v, JsonOptions),
				v => JsonSerializer.Deserialize<List<int>>(v, JsonOptions) ?? new List<int>())
			.HasColumnType("nvarchar(max)");

		builder.HasOne(x => x.User)
			.WithOne(u => u.ChildRestriction)
			.HasForeignKey<ChildRestriction>(x => x.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
