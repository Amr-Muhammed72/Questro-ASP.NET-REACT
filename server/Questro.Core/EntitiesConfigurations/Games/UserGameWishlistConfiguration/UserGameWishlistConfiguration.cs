using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Games;

namespace Questro.Core.EntitiesConfigurations.Games;

public class UserGameWishlistConfiguration : IEntityTypeConfiguration<UserGameWishlist>
{
    public void Configure(EntityTypeBuilder<UserGameWishlist> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserId, x.GameId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany(u => u.GameWishlists)
            .HasForeignKey(x => x.UserId);

        builder.HasOne(x => x.Game)
            .WithMany(g => g.UserWishlists)
            .HasForeignKey(x => x.GameId);
    }
}

