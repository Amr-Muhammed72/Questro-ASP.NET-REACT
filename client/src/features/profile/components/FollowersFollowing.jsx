import { memo, useState, useEffect } from 'react';
import { getFollowers, getFollowing } from '../api/profileService';
import UserCard from './UserCard';

const FollowersFollowing = memo(({ userId, isOwnProfile, activeTab = 'followers' }) => {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followersPagination, setFollowersPagination] = useState({ pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
  const [followingPagination, setFollowingPagination] = useState({ pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0 });

  useEffect(() => {
    fetchListData();
  }, [userId, activeTab, followersPagination.pageNumber, followingPagination.pageNumber]);

  const fetchListData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (activeTab === 'followers') {
        const data = await getFollowers(userId, followersPagination.pageNumber, followersPagination.pageSize);
        setFollowers(data.data || []);
        setFollowersPagination({
          pageNumber: data.pageNumber,
          pageSize: data.pageSize,
          totalCount: data.totalCount,
          totalPages: data.totalPages
        });
      } else {
        const data = await getFollowing(userId, followingPagination.pageNumber, followingPagination.pageSize);
        setFollowing(data.data || []);
        setFollowingPagination({
          pageNumber: data.pageNumber,
          pageSize: data.pageSize,
          totalCount: data.totalCount,
          totalPages: data.totalPages
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const currentData = activeTab === 'followers' ? followers : following;
  const currentPagination = activeTab === 'followers' ? followersPagination : followingPagination;

  const handlePageChange = (newPage) => {
    if (activeTab === 'followers') {
      setFollowersPagination(prev => ({ ...prev, pageNumber: newPage }));
    } else {
      setFollowingPagination(prev => ({ ...prev, pageNumber: newPage }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white capitalize">
          {activeTab === 'followers' ? 'Followers' : 'Following'}
        </h2>
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-2 font-medium">Failed to load list</p>
          <p className="text-zinc-400 text-sm">{error}</p>
        </div>
      ) : isLoading && currentData.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : currentData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-400">
            {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </p>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentData.map(user => (
              <UserCard key={user.userId} user={user} />
            ))}
          </div>

          {/* Pagination */}
          {currentPagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-zinc-700/50">
              <button
                onClick={() => handlePageChange(currentPagination.pageNumber - 1)}
                disabled={currentPagination.pageNumber === 1}
                className="px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all"
              >
                Previous
              </button>
              <span className="text-zinc-400 text-sm">
                Page {currentPagination.pageNumber} of {currentPagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPagination.pageNumber + 1)}
                disabled={currentPagination.pageNumber === currentPagination.totalPages}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

FollowersFollowing.displayName = 'FollowersFollowing';
export default FollowersFollowing;
