import { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Star, ShieldCheck, UserPlus, UserMinus, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useProfileStore } from '../store/useProfileStore';
import { useFamilyStore } from '../../family/store/useFamilyStore';
import { useNotificationStore } from '../../notifications/store/useNotificationStore';
const BASE_URL = 'http://localhost:5222';

const getInitialAvatar = (firstName) => {
  if (!firstName) return '?';
  return firstName.charAt(0).toUpperCase();
};

const ProfileHeader = memo(({ 
  user, 
  isOwnProfile, 
  followStats, 
  onFollowersClick, 
  onFollowingClick,
  isFollowing,
  onFollow,
  onUnfollow,
  onEdit,
  isLoading,
  onNotificationsClick
}) => {
  const [imageError, setImageError] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const { imageUpdateStamp } = useProfileStore();
  const isChildAccount = useFamilyStore((state) => state.isChild);
  const { unreadCount } = useNotificationStore();

  useEffect(() => {
    setImageError(false);
  }, [user?.profilePicUrl, imageUpdateStamp]);

  if (!user) return null;

  const profilePicUrl = user.profilePicUrl ? `${BASE_URL}${user.profilePicUrl}?t=${imageUpdateStamp}` : null;
  const initials = getInitialAvatar(user.firstName);

  const joinDate = user.joinDate ? new Date(user.joinDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  }) : null;

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  return (
    <div className="w-full flex flex-col pt-8">
      {/* Avatar Container aligned to left */}
      <div className="flex-shrink-0 mb-6">
        <div 
          className="relative w-40 h-40 md:w-48 md:h-48 group cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 ease-out"
          onClick={() => {
            if (profilePicUrl && !imageError) setIsPhotoModalOpen(true);
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-purple-600/40 to-indigo-600/40 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300" />
          <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-zinc-900 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl group-hover:ring-indigo-500/30 transition-all duration-300">
            {profilePicUrl && !imageError ? (
              <img
                src={profilePicUrl}
                alt={fullName}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-white text-6xl md:text-7xl font-bold">{initials}</span>
            )}
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="flex flex-col w-full">
        {/* Row 1: Name, Badges, and Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{fullName}</h1>
            {!isChildAccount && isOwnProfile && (
              <div className="flex items-center px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Parent</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons right-aligned */}
          <div className="flex flex-wrap items-center gap-3">
            {isOwnProfile ? (
              <>
                <button
                  onClick={onNotificationsClick}
                  className="relative flex items-center justify-center w-10 h-10 bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 rounded-xl transition-all duration-300 active:scale-95 text-zinc-300 hover:text-white hover:shadow-lg hover:shadow-white/5"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {!isChildAccount && (
                  <Link
                    to="/family-management"
                    className="flex items-center justify-center px-4 sm:px-5 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 rounded-xl transition-all duration-300 active:scale-95 text-white text-sm font-semibold hover:shadow-lg hover:shadow-white/5 whitespace-nowrap"
                  >
                    Family Management
                  </Link>
                )}
                <button
                  onClick={onEdit}
                  disabled={isLoading}
                  className="flex items-center justify-center px-5 sm:px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 whitespace-nowrap"
                >
                  Edit Profile
                </button>
              </>
            ) : (
              isFollowing ? (
                <button
                  onClick={onUnfollow}
                  disabled={isLoading}
                  className="flex items-center justify-center px-6 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 rounded-xl transition-all duration-300 active:scale-95 text-white text-sm font-semibold hover:shadow-lg hover:shadow-white/5"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Unfollow
                </button>
              ) : (
                <button
                  onClick={onFollow}
                  disabled={isLoading}
                  className="flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </button>
              )
            )}
          </div>
        </div>
        
        {/* Username */}
        {user.userName && (
          <p className="text-zinc-500 text-lg mb-6">@{user.userName}</p>
        )}

        {/* Bio */}
        {user.bio ? (
          <p className="text-zinc-400 text-base mb-8 max-w-3xl leading-relaxed">{user.bio}</p>
        ) : (
          <div className="mb-8" />
        )}

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-6 text-sm border-b border-white/5 pb-8 mb-8">
          <button onClick={onFollowersClick} className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <span className="text-white font-bold text-base">{followStats?.followersCount || 0}</span>
            <span className="text-zinc-500 font-medium">Followers</span>
          </button>
          
          <button onClick={onFollowingClick} className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <span className="text-white font-bold text-base">{followStats?.followingCount || 0}</span>
            <span className="text-zinc-500 font-medium">Following</span>
          </button>

          {user.primaryInterest && (
            <>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-400" />
                <span className="text-zinc-400 font-medium">{user.primaryInterest}</span>
              </div>
            </>
          )}

          {joinDate && (
            <>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-500">Joined {joinDate}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instagram-like Photo Modal */}
      {createPortal(
        <AnimatePresence>
          {isPhotoModalOpen && profilePicUrl && !imageError && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPhotoModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
              />
              
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="absolute top-6 right-6 p-3 text-white/70 hover:text-white transition-colors z-10 active:scale-95"
              >
                <X className="w-8 h-8" />
              </button>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-[320px] md:max-w-[400px] aspect-square rounded-full overflow-hidden shadow-2xl shadow-indigo-500/20 ring-4 ring-zinc-800"
              >
                <img
                  src={profilePicUrl}
                  alt={fullName}
                  className="w-full h-full object-cover pointer-events-none"
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
});

ProfileHeader.displayName = 'ProfileHeader';
export default ProfileHeader;
