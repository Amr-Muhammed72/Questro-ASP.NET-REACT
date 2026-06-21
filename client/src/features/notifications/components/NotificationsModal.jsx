import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Gamepad2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';

const NotificationsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { 
    notifications, 
    pagination,
    isFetching,
    error,
    fetchNotifications,
    markAsRead 
  } = useNotificationStore();

  const [page, setPage] = useState(1);

  // Prevent background scrolling and handle Escape key when modal is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(page, 10);
    }
  }, [isOpen, page, fetchNotifications]);

  const handleNotificationClick = (notification) => {
    onClose();
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.referenceId && notification.referenceId !== 0) {
      if (notification.type === 'NewMovie') {
        navigate(`/movies/${notification.referenceId}`);
      } else if (notification.type === 'NewGame') {
        navigate(`/games/${notification.referenceId}`);
      }
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'NewMovie': return <Film className="w-5 h-5 text-indigo-400" />;
      case 'NewGame': return <Gamepad2 className="w-5 h-5 text-purple-400" />;
      default: return <Info className="w-5 h-5 text-zinc-400" />;
    }
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm touch-none"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{ willChange: 'transform, opacity' }}
            className="relative w-full max-w-md bg-[#09090b] border border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/5 bg-zinc-900/50">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent tracking-tight">
                All Notifications
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
                  <p className="text-red-400 mb-2 font-medium">Failed to load notifications</p>
                  <p className="text-zinc-400 text-sm">{error}</p>
                </div>
              ) : isFetching && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-400 text-base">No notifications yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      style={{ willChange: 'transform' }}
                      className={`group flex gap-4 p-4 rounded-2xl transition-all duration-300 border border-transparent cursor-pointer
                        ${!notification.isRead 
                          ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 shadow-sm' 
                          : 'bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-white/10 shadow-sm hover:shadow-lg'
                        }
                      `}
                    >
                      <div className="flex-shrink-0 mt-1 relative">
                        {notification.imageUrl ? (
                          <img src={notification.imageUrl} alt="" className="w-12 h-12 object-cover rounded-xl shadow-md" />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-zinc-800/80 rounded-xl border border-white/5 shadow-md">
                            {getIconForType(notification.type)}
                          </div>
                        )}
                        {!notification.isRead && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-[#121214] shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 pr-4">
                        <p className={`text-sm ${!notification.isRead ? 'text-white font-bold' : 'text-zinc-200 font-semibold'} group-hover:text-indigo-300 transition-colors`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {notification.body}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-medium mt-2">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {pagination?.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-white/5 pb-2">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all active:scale-95"
                  >
                    Previous
                  </button>
                  <span className="text-zinc-400 text-sm font-medium">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === pagination.totalPages}
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
};

export default NotificationsModal;
