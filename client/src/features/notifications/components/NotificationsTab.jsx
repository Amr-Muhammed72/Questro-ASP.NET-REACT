import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';
import { CheckCircle2, Film, Gamepad2, Info } from 'lucide-react';

const NotificationsTab = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    pagination, 
    isFetching, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    unreadCount 
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(1, 10);
  }, [fetchNotifications]);

  const handlePageChange = (newPage) => {
    fetchNotifications(newPage, 10);
  };

  const handleNotificationClick = (notification) => {
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

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Notifications</h2>
          <p className="text-zinc-400">
            You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors border border-indigo-500/20 font-medium whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark All as Read
          </button>
        )}
      </div>

      <div className="space-y-3 mb-8">
        {isFetching && notifications.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`relative p-5 rounded-xl border transition-all duration-200 flex items-start gap-4 ${
                !notification.isRead 
                  ? 'bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 shadow-[inset_4px_0_0_0_rgba(168,85,247,1)] backdrop-blur-md' 
                  : 'bg-zinc-900/40 border-white/5 opacity-80 backdrop-blur-md cursor-pointer hover:bg-zinc-800/50'
              }`}
            >
              <div className="mt-1 flex-shrink-0 relative">
                {notification.imageUrl ? (
                  <img src={notification.imageUrl} alt="" className="w-12 h-12 object-cover rounded-xl shadow-sm" />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-zinc-800 rounded-xl">
                    {getIconForType(notification.type)}
                  </div>
                )}
                {!notification.isRead && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-500 rounded-full border-2 border-zinc-900 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
                )}
              </div>
              <div className="flex-1 pr-16">
                <p className={`text-base ${!notification.isRead ? 'text-white font-bold' : 'text-zinc-200 font-semibold'}`}>
                  {notification.title}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  {notification.body}
                </p>
              </div>
              <span className="absolute top-5 right-5 text-sm text-zinc-500 font-medium whitespace-nowrap">
                {formatTime(notification.createdAt)}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-zinc-900/20 rounded-xl border border-dashed border-white/10">
            <p className="text-zinc-400">You're all caught up!</p>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => handlePageChange(pagination.pageIndex - 1)}
            disabled={pagination.pageIndex <= 1 || isFetching}
            className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-zinc-400 font-medium">
            Page {pagination.pageIndex} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.pageIndex + 1)}
            disabled={pagination.pageIndex >= pagination.totalPages || isFetching}
            className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;
