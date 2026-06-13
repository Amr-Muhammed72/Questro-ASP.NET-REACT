import { useCallback } from 'react';
import { useProfileStore } from '../store/useProfileStore';
import {
  getUserProfile,
  getMyProfile,
  getFollowStats,
} from '../api/profileService';
export const useProfile = () => {
  const {
    currentProfile,
    followStats,
    isLoading,
    error,
    setCurrentProfile,
    setFollowStats,
    setIsLoading,
    setError,
    clearProfile
  } = useProfileStore();

  const fetchProfile = useCallback(async (id) => {
    try {
      setIsLoading(true);
      const profileData = id ? await getUserProfile(id) : await getMyProfile();
      setCurrentProfile(profileData);
      setError(null);
      return profileData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentProfile, setIsLoading, setError]);

  const fetchFollowStats = useCallback(async (id) => {
    try {
      setIsLoading(true);
      const stats = await getFollowStats(id);
      setFollowStats(stats);
      setError(null);
      return stats;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setFollowStats, setIsLoading, setError]);

  const reset = useCallback(() => {
    clearProfile();
  }, [clearProfile]);

  return {
    profile: currentProfile,
    followStats,
    isLoading,
    error,
    fetchProfile,
    fetchFollowStats,
    reset
  };
};