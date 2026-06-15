import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useProfileStore } from '../features/profile/store/useProfileStore';
import { useFamilyStore } from '../features/family/store/useFamilyStore';
import {
  getUserProfile,
  getFollowStats,
  followUser,
  unfollowUser,
  getMyProfile,
  updateProfile,
  uploadProfilePicture,
} from '../features/profile/api/profileService';
import { getToken } from '../lib/apiClient';
import ProfileHeader from '../features/profile/components/ProfileHeader';
import ActionButtons from '../features/profile/components/ActionButtons';
import UserLibraries from '../features/profile/components/UserLibraries';
import FollowersFollowing from '../features/profile/components/FollowersFollowing';
import EditProfileForm from '../features/profile/components/EditProfileForm';
import NavBar from '../components/layout/NavBar';
import { AlertCircle } from 'lucide-react';
import NotificationsTab from '../features/notifications/components/NotificationsTab';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'library';

  const {
    currentProfile,
    followStats,
    isLoading,
    error,
    setCurrentProfile,
    setMyProfile,
    setFollowStats,
    setIsLoading,
    setError,
    clearProfile,
    setImageUpdateStamp,
  } = useProfileStore();

  const [viewerUserId, setViewerUserId] = useState(null);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating]     = useState(false);

  useEffect(() => {
    setIsNavVisible(!showEditModal);
  }, [showEditModal]);

  // ── Single unified effect — replaces two separate getMyProfile() calls ─────
  useEffect(() => {
    const token = getToken();

    const fetchProfileData = async () => {
      // Clear any previously displayed profile immediately so stale data from
      // the last visit doesn't bleed through while the new fetch is in-flight.
      clearProfile();
      setIsLoading(true);

      try {
        // Step 1 — Identify the currently logged-in viewer (one call).
        // If there is no token we can still view a public profile, just
        // without knowing the viewer's identity.
        let myId = null;
        if (token) {
          try {
            const myProfile = await getMyProfile();
            myId = myProfile?.userId ?? null;
          } catch {
            // Non-fatal: viewer identity is nice-to-have, not required.
          }
        }
        setViewerUserId(myId);

        // Step 2 — If no userId in the URL, redirect to the viewer's own profile.
        if (!userId) {
          if (myId) {
            navigate(`/users/${myId}`, { replace: true });
          } else {
            navigate('/');
          }
          return;
        }

        // Step 3 — Fetch the target profile and its follow stats in parallel.
        const [profileData, statsData] = await Promise.all([
          getUserProfile(userId),
          getFollowStats(userId),
        ]);

        setCurrentProfile(profileData);
        setFollowStats(statsData);
        setIsFollowing(statsData?.isFollowedByCurrentUser || false);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err.message);
        if (!userId) navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  // Re-run only when the target profile changes (userId param).
  // Deliberately omit the setter callbacks from deps — they are stable
  // references from Zustand and including them would cause spurious re-runs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const isOwnProfile = !!(currentProfile?.userId && viewerUserId === currentProfile?.userId);

  // ── Follow / Unfollow ──────────────────────────────────────────────────────
  const handleFollow = async () => {
    try {
      setIsLoading(true);
      await followUser(userId);
      setIsFollowing(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    try {
      setIsLoading(true);
      await unfollowUser(userId);
      setIsFollowing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Edit profile ───────────────────────────────────────────────────────────
  const handleEditProfile = async ({ avatarFile, ...profileData }) => {
    try {
      setIsUpdating(true);
      await updateProfile(profileData);
      if (avatarFile) {
        await uploadProfilePicture(avatarFile);
        // Add a slight delay to ensure the backend has completely written the file before we re-fetch the profile
        await new Promise(resolve => setTimeout(resolve, 800));
        setImageUpdateStamp(Date.now());
      }
      const updatedProfile = await getUserProfile(currentProfile?.userId || userId);
      setCurrentProfile(updatedProfile);
      
      if (isOwnProfile) {
        setMyProfile(updatedProfile);
      }
      setShowEditModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading && !currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen font-sans py-10 bg-black/20">
      <div className="absolute inset-0 -z-10" />
      <NavBar onVisibilityChange={setIsNavVisible} />
      <div className={`relative z-10 w-full transition-all duration-300 flex flex-col ${isNavVisible ? 'pt-20' : 'pt-4'}`}>
        <div className="w-full px-4 md:px-8 lg:px-12">

          {error && (
            <div className="mb-6 flex gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {currentProfile ? (
            <>
              <div className="mb-8">
                <ProfileHeader
                  user={currentProfile}
                  isOwnProfile={isOwnProfile}
                  followStats={followStats}
                  onFollowersClick={() => setSearchParams({ tab: 'followers' })}
                  onFollowingClick={() => setSearchParams({ tab: 'following' })}
                />
              </div>

              <ActionButtons
                isOwnProfile={isOwnProfile}
                isFollowing={isFollowing}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onEdit={() => setShowEditModal(true)}
                isLoading={isLoading || isUpdating}
                onViewFollowers={() => setSearchParams({ tab: 'followers' })}
                onViewFollowing={() => setSearchParams({ tab: 'following' })}
                onViewLibrary={() => setSearchParams({ tab: 'library' })}
                onViewNotifications={() => setSearchParams({ tab: 'notifications' })}
                activeTab={activeTab}
              />

              <div className="mt-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={['notifications', 'followers', 'following'].includes(activeTab) ? activeTab : 'library'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    {activeTab === 'notifications' && isOwnProfile ? (
                      <NotificationsTab />
                    ) : activeTab === 'followers' || activeTab === 'following' ? (
                      <FollowersFollowing
                        userId={currentProfile?.userId}
                        isOwnProfile={isOwnProfile}
                        activeTab={activeTab}
                      />
                    ) : (
                      <UserLibraries
                        userId={currentProfile?.userId}
                        isOwnProfile={isOwnProfile}
                        activeTab={activeTab === 'library' ? 'movie-watchlist' : activeTab}
                        onTabChange={(tab) => setSearchParams({ tab })}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {showEditModal && isOwnProfile && (
                <EditProfileForm
                  user={currentProfile}
                  onSave={handleEditProfile}
                  onCancel={() => setShowEditModal(false)}
                  isLoading={isUpdating}
                />
              )}
            </>
          ) : (
            !isLoading && (
              <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl p-8 text-center border border-white/10">
                <p className="text-zinc-400">Profile data is not available.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
