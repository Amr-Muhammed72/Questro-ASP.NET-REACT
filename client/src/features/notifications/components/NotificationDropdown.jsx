import React, { useState, useEffect, useRef } from 'react';
import { Bell, Film, Gamepad2, Info, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';
import { useProfileStore } from '../../profile/store/useProfileStore';
import { getMyProfile } from '../../profile/api/profileService';
import NotificationsModal from './NotificationsModal';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const { 
    unreadCount, 
    notifications, 
    fetchNotifications, 
    markAsRead, 
    startPolling, 
    stopPolling 
  } = useNotificationStore();
  
  const { currentProfile } = useProfileStore();

  useEffect(() => {
    if (currentProfile?.userId) {
      setUserId(currentProfile.userId);
    } else {
      const fetchUserId = async () => {
        try {
          const profile = await getMyProfile();
          setUserId(profile.userId);
        } catch (error) {
          console.error('Failed to fetch user ID for notifications:', error);
        }
      };
      fetchUserId();
    }
  }, [currentProfile]);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, 5); // Fetch first 5 for the dropdown
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    setIsOpen(false);
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-zinc-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <Bell className="w-5 h-5 text-zinc-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[32px] bg-[#09090b]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-5 border-b border-white/5 bg-[#09090b]/40">
            <h3 className="text-lg font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Notifications</h3>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              <div className="divide-y divide-white/5">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`relative p-4 cursor-pointer transition-all duration-200 flex gap-4 ${
                      !notification.isRead 
                        ? 'bg-purple-500/10 hover:bg-purple-500/20 shadow-[inset_4px_0_0_0_rgba(168,85,247,1)]' 
                        : 'bg-white/[0.01] hover:bg-white/[0.05]'
                    }`} 
                  >
                    <div className="flex-shrink-0 mt-1 relative">
                      {notification.imageUrl ? (
                        <img src={notification.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-lg">
                          {getIconForType(notification.type)}
                        </div>
                      )}
                      {!notification.isRead && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-zinc-900 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 pr-12">
                      <p className={`text-sm ${!notification.isRead ? 'text-white font-bold' : 'text-zinc-200 font-semibold'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                    </div>
                    <span className="absolute top-4 right-4 text-xs text-zinc-500 font-medium">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-zinc-400">No new notifications</p>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-white/5 bg-[#09090b]/40 mt-auto">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsModalOpen(true);
              }}
              className="block w-full text-center py-2 text-sm font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-colors active:scale-95"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}

      <NotificationsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default NotificationDropdown;
