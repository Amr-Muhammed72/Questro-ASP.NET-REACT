using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Questro.Core.Entities.Social;

namespace Questro.Core.EntitiesConfigurations.Social;

public class UserFollowConfiguration : IEntityTypeConfiguration<UserFollow>
{
    public void Configure(EntityTypeBuilder<UserFollow> builder)
    {
        builder.HasKey(x => new { x.FollowerId, x.FolloweeId });

        builder.HasOne(x => x.Follower)
            .WithMany(u => u.Following)
            .HasForeignKey(x => x.FollowerId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(x => x.Followee)
            .WithMany(u => u.Followers)
            .HasForeignKey(x => x.FolloweeId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
