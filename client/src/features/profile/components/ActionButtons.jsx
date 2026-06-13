import { memo } from 'react';
import { UserPlus, UserMinus, Edit2, Users, Library, Bell } from 'lucide-react';

const ActionButtons = memo(({
  isOwnProfile,
  isFollowing,
  onFollow,
  onUnfollow,
  onEdit,
  isLoading,
  onViewFollowers,
  onViewFollowing,
  onViewLibrary,
  onViewNotifications,
  activeTab
}) => {
  const isLibraryActive = activeTab === 'library' || (!activeTab || (activeTab !== 'followers' && activeTab !== 'following' && activeTab !== 'notifications'));
  const isFollowersActive = activeTab === 'followers';
  const isFollowingActive = activeTab === 'following';
  const isNotificationsActive = activeTab === 'notifications';

  if (isOwnProfile) {
    return (
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onViewLibrary}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all font-medium ${
              isLibraryActive
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-zinc-900/60 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/60 hover:border-indigo-500/30'
            }`}
          >
            <Library className="w-4 h-4" />
            <span>Library</span>
          </button>

          <button
            onClick={onViewFollowers}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all font-medium ${
              isFollowersActive
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-zinc-900/60 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/60 hover:border-indigo-500/30'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Followers</span>
          </button>

          <button
            onClick={onViewFollowing}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all font-medium ${
              isFollowingActive
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-zinc-900/60 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/60 hover:border-indigo-500/30'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Following</span>
          </button>

          <button
            onClick={onViewNotifications}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all font-medium ${
              isNotificationsActive
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-zinc-900/60 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/60 hover:border-indigo-500/30'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
        </div>

        <button
          onClick={onEdit}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-colors disabled:opacity-50 text-white font-medium ml-auto"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-8">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onViewLibrary}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all font-medium ${
            isLibraryActive
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-zinc-900/60 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/60 hover:border-indigo-500/30'
          }`}
        >
          <Library className="w-4 h-4" />
          <span>Library</span>
        </button>

        <button
          onClick={onViewFollowers}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all font-medium ${
            isFollowersActive
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-zinc-900/60 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/60 hover:border-indigo-500/30'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Followers</span>
        </button>

        <button
          onClick={onViewFollowing}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all font-medium ${
            isFollowingActive
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-zinc-900/60 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/60 hover:border-indigo-500/30'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Following</span>
        </button>
      </div>

      {isFollowing ? (
        <button
          onClick={onUnfollow}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50 text-white font-medium"
        >
          <UserMinus className="w-4 h-4" />
          <span>Unfollow</span>
        </button>
      ) : (
        <button
          onClick={onFollow}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-colors disabled:opacity-50 text-white font-medium"
        >
          <UserPlus className="w-4 h-4" />
          <span>Follow</span>
        </button>
      )}
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';
export default ActionButtons;
