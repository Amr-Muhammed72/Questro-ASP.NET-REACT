import { memo } from 'react';
import { Calendar, Users, Star } from 'lucide-react';

const BASE_URL = 'http://localhost:5222';

const getInitialAvatar = (firstName) => {
  if (!firstName) return '?';
  return firstName.charAt(0).toUpperCase();
};

const ProfileHeader = memo(({ user, isOwnProfile, followStats, onFollowersClick, onFollowingClick }) => {
  if (!user) return null;

  const profilePicUrl = user.profilePicUrl ? `${BASE_URL}${user.profilePicUrl}` : null;
  const initials = getInitialAvatar(user.firstName);

  const joinDate = user.joinDate ? new Date(user.joinDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  }) : null;

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-start gap-8">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="relative w-40 h-40 md:w-48 md:h-48">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-purple-600/40 to-indigo-600/40 rounded-3xl blur-2xl" />
            <div className="relative w-full h-full rounded-3xl overflow-hidden ring-2 ring-indigo-500/30 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center hover:ring-indigo-400/50 transition-all shadow-lg shadow-indigo-500/20">
              {profilePicUrl ? (
                <img
                  src={profilePicUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : null}
              {!profilePicUrl && (
                <span className="text-white text-6xl md:text-7xl font-bold">{initials}</span>
              )}
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">{fullName}</h1>
            {user.userName && (
              <p className="text-indigo-400 text-lg font-medium">@{user.userName}</p>
            )}
          </div>

          {user.bio && (
            <p className="text-zinc-300 text-base mb-6 max-w-2xl leading-relaxed">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="space-y-4">
            {followStats && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onFollowersClick}
                  className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl hover:from-indigo-500/30 hover:to-purple-500/30 hover:border-indigo-400/50 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-all">
                    <Users className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-lg">{followStats.followersCount}</p>
                    <p className="text-zinc-400 text-xs">followers</p>
                  </div>
                </button>

                <button
                  onClick={onFollowingClick}
                  className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl hover:from-indigo-500/30 hover:to-purple-500/30 hover:border-indigo-400/50 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-all">
                    <Users className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-lg">{followStats.followingCount}</p>
                    <p className="text-zinc-400 text-xs">following</p>
                  </div>
                </button>
              </div>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-3 pt-2">
              {user.primaryInterest && (
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/60 border border-zinc-700/50 rounded-lg hover:border-indigo-500/30 transition-all">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-zinc-300 font-medium">{user.primaryInterest}</span>
                </div>
              )}
              {joinDate && (
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/60 border border-zinc-700/50 rounded-lg hover:border-indigo-500/30 transition-all">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-300">Joined {joinDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileHeader.displayName = 'ProfileHeader';
export default ProfileHeader;
