import { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getFollowers, getFollowing } from '../api/profileService';
import UserCard from './UserCard';

const FollowersFollowingModal = memo(({ isOpen, onClose, userId, initialTab = 'followers' }) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0 });

  useEffect(() => {
    if (isOpen) {
      fetchListData();
    }
  }, [userId, pagination.pageNumber, isOpen]);

  const fetchListData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (initialTab === 'followers') {
        const res = await getFollowers(userId, pagination.pageNumber, pagination.pageSize);
        setData(res.data || []);
        setPagination({
          pageNumber: res.pageNumber,
          pageSize: res.pageSize,
          totalCount: res.totalCount,
          totalPages: res.totalPages
        });
      } else {
        const res = await getFollowing(userId, pagination.pageNumber, pagination.pageSize);
        setData(res.data || []);
        setPagination({
          pageNumber: res.pageNumber,
          pageSize: res.pageSize,
          totalCount: res.totalCount,
          totalPages: res.totalPages
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, pageNumber: newPage }));
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#09090b]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/5 bg-[#09090b]/40">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent tracking-tight">
                {initialTab === 'followers' ? 'Followers' : 'Following'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {error ? (
                <div className="text-center py-12">
                  <p className="text-red-400 mb-2 font-medium">Failed to load list</p>
                  <p className="text-zinc-400 text-sm">{error}</p>
                </div>
              ) : isLoading && data.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-400 text-base">
                    {initialTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.map(user => (
                    <div key={user.userId} onClick={onClose}>
                       <UserCard user={user} />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-white/5 pb-2">
                  <button
                    onClick={() => handlePageChange(pagination.pageNumber - 1)}
                    disabled={pagination.pageNumber === 1}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all active:scale-95"
                  >
                    Previous
                  </button>
                  <span className="text-zinc-400 text-sm font-medium">
                    {pagination.pageNumber} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.pageNumber + 1)}
                    disabled={pagination.pageNumber === pagination.totalPages}
                    className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all active:scale-95"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
});

FollowersFollowingModal.displayName = 'FollowersFollowingModal';
export default FollowersFollowingModal;
