import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useProfileStore } from '../features/profile/store/useProfileStore';
import {
  getUserProfile,
  getFollowStats,
  followUser,
  unfollowUser,
  getMyProfile,
  updateProfile,
  uploadProfilePicture
} from '../features/profile/api/profileService';
import { getToken } from '../lib/apiClient';
import ProfileHeader from '../features/profile/components/ProfileHeader';
import ActionButtons from '../features/profile/components/ActionButtons';
import UserLibraries from '../features/profile/components/UserLibraries';
import FollowersFollowing from '../features/profile/components/FollowersFollowing';
import EditProfileForm from '../features/profile/components/EditProfileForm';
import NavBar from '../components/layout/NavBar';
import { AlertCircle } from 'lucide-react';

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
    setFollowStats,
    setIsLoading,
    setError
  } = useProfileStore();

  const [viewerUserId, setViewerUserId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsNavVisible(!showEditModal);
  }, [showEditModal]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const fetchViewerId = async () => {
      try {
        const profileData = await getMyProfile();
        const fetchedUserId = profileData?.userId ?? null;
        setViewerUserId(fetchedUserId);
      } catch (err) {
        console.error('Failed to fetch viewer profile:', err);
        setViewerUserId(null);
      }
    };

    fetchViewerId();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        try {
          setIsLoading(true);
          const profileData = await getMyProfile();
          if (profileData?.userId) {
            navigate(`/users/${profileData.userId}`, { replace: true });
          }
        } catch (err) {
          console.error('Failed to fetch profile:', err);
          setError(err.message);
          navigate('/');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        const [profileData, statsData] = await Promise.all([
          getUserProfile(userId),
          getFollowStats(userId)
        ]);

        setCurrentProfile(profileData);
        setFollowStats(statsData);
        setIsFollowing(statsData?.isFollowedByCurrentUser || false);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, setCurrentProfile, setFollowStats, setIsLoading, setError, navigate]);

  const isOwnProfile = currentProfile?.userId && viewerUserId === currentProfile?.userId;

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

  const handleEditProfile = async ({ avatarFile, ...profileData }) => {
    try {
      setIsUpdating(true);
      await updateProfile(profileData);
      if (avatarFile) {
        await uploadProfilePicture(avatarFile);
      }

      const updatedProfile = await getUserProfile(currentProfile?.userId || userId);
      setCurrentProfile(updatedProfile);
      setShowEditModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && !currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen font-sans py-10 bg-black/20">
      <div className="absolute inset-0 -z-10" />
      <NavBar onVisibilityChange={setIsNavVisible} />
      <div className={`relative z-10 w-full transition-all duration-300 flex flex-col ${isNavVisible ? 'pt-20' : 'pt-4'} `}>
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
                activeTab={activeTab}
              />

              <div>
                {activeTab === 'followers' || activeTab === 'following' ? (
                  <FollowersFollowing userId={currentProfile?.userId} isOwnProfile={isOwnProfile} activeTab={activeTab} />
                ) : (isOwnProfile || currentProfile.isHistoryPublic) ? (
                  <UserLibraries
                    userId={currentProfile?.userId}
                    isOwnProfile={isOwnProfile}
                    activeTab={activeTab === 'library' ? 'movie-watchlist' : activeTab}
                    onTabChange={(tab) => setSearchParams({ tab })}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-zinc-400">This user's history is private</p>
                  </div>
                )}
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
