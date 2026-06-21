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
import UserLibraries from '../features/profile/components/UserLibraries';
import FollowersFollowingModal from '../features/profile/components/FollowersFollowingModal';
import EditProfileForm from '../features/profile/components/EditProfileForm';

import NotificationsModal from '../features/notifications/components/NotificationsModal';
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
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [followModalTab, setFollowModalTab] = useState('followers');
  const [isUpdating, setIsUpdating]     = useState(false);

  useEffect(() => {
    setIsNavVisible(!showEditModal);
  }, [showEditModal]);

  // Open notifications modal if URL tab is set to notifications
  useEffect(() => {
    if (activeTab === 'notifications') {
      setShowNotificationsModal(true);
    }
  }, [activeTab]);

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
        // Add a delay to ensure the backend has completely written the file before we re-fetch the profile
        await new Promise(resolve => setTimeout(resolve, 1500));
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

  return (
    <div className="relative min-h-screen font-sans py-10 bg-transparent overflow-x-hidden">
      {/* Background Starfield */}
      <div className="star-field">
        <div className="star-layer" id="stars-small"></div>
        <div className="star-layer" id="stars-medium"></div>
        <div className="star-layer" id="stars-large"></div>
      </div>
      
      {/* Dynamic Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen z-0" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none opacity-60 mix-blend-screen z-0" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen z-0" />
      
      <div className={`relative z-10 w-full max-w-[1600px] mx-auto transition-all duration-300 flex flex-col ${isNavVisible ? 'pt-20' : 'pt-4'}`}>
        <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16">

          {error && (
            <div className="mb-6 flex gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
                  onFollowersClick={() => {
                    setFollowModalTab('followers');
                    setShowFollowModal(true);
                  }}
                  onFollowingClick={() => {
                    setFollowModalTab('following');
                    setShowFollowModal(true);
                  }}
                  onNotificationsClick={() => setShowNotificationsModal(true)}
                  isFollowing={isFollowing}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                  onEdit={() => setShowEditModal(true)}
                  isLoading={isLoading || isUpdating}
                />
              </div>

              <div className="mt-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key="library"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <UserLibraries
                      userId={currentProfile?.userId}
                      isOwnProfile={isOwnProfile}
                      activeTab={activeTab === 'library' ? 'movie-watchlist' : activeTab}
                      onTabChange={(tab) => setSearchParams({ tab })}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>


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

      {currentProfile && (
        <>
          <FollowersFollowingModal
            isOpen={showFollowModal}
            onClose={() => setShowFollowModal(false)}
            userId={currentProfile?.userId}
            initialTab={followModalTab}
          />

          <NotificationsModal
            isOpen={showNotificationsModal}
            onClose={() => {
              setShowNotificationsModal(false);
              if (activeTab === 'notifications') {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('tab');
                setSearchParams(newParams);
              }
            }}
          />

          {showEditModal && isOwnProfile && (
            <EditProfileForm
              user={currentProfile}
              onSave={handleEditProfile}
              onCancel={() => setShowEditModal(false)}
              isLoading={isUpdating}
            />
          )}
        </>
      )}
    </div>
  );
}

