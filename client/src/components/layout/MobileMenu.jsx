import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../features/auth/store/AuthContext';
import {authService} from '../../features/auth/api/authService';
import { useNotificationStore } from '../../features/notifications/store/useNotificationStore';
import { useProfileStore } from '../../features/profile/store/useProfileStore';

const MobileMenu = ({ isAuthenticated, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { unreadCount } = useNotificationStore();
  const { currentProfile, imageUpdateStamp } = useProfileStore();

  const baseLinks = [];

  const authLinks = [
    { name: 'Home', path: '/home' },
    { name: 'Movies', path: '/movies' },
    { name: 'Games', path: '/games' },
  ];

  const linksToShow = isAuthenticated ? [...baseLinks, ...authLinks] : baseLinks;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      logout();
      navigate('/');
      onClose();
    }
  };

  const handleNavClick = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 top-[60px] sm:top-[70px] z-50 bg-black backdrop-blur-md">
      <div className="bg-zinc-950 border-t border-zinc-800 max-h-[calc(100vh-60px)] sm:max-h-[calc(100vh-70px)] overflow-y-auto flex flex-col">
        <div className="px-4 py-6 space-y-3 border-b border-zinc-800">
          {linksToShow.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.path)}
              className="w-full text-left px-4 py-3 rounded-lg text-zinc-100 font-semibold hover:bg-zinc-800/80 transition-colors duration-200 flex items-center gap-3"
            >
              {link.name}
            </button>
          ))}
        </div>

        <div className="px-4 py-6 space-y-3">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-800/50 text-zinc-100 font-semibold hover:bg-zinc-800 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden ring-1 ring-indigo-500/30">
                    {currentProfile?.profilePicUrl ? (
                      <img 
                        src={`http://localhost:5222${currentProfile.profilePicUrl}?t=${imageUpdateStamp}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {currentProfile?.firstName ? currentProfile.firstName.charAt(0).toUpperCase() : '?'}
                      </span>
                    )}
                  </div>
                  <span>Profile</span>
                </div>
                <svg className={`w-4 h-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {isProfileOpen && (
                <div className="pl-4 space-y-2">
                  <Link
                    to="/profile"
                    onClick={onClose}
                    className="block px-4 py-3 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors duration-200"
                  >
                    View Profile
                  </Link>
                  <Link
                    to="/profile?tab=notifications"
                    onClick={onClose}
                    className="flex justify-between items-center px-4 py-3 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors duration-200"
                  >
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={onClose}
                className="block w-full text-center px-4 py-3 rounded-lg text-zinc-100 font-semibold hover:bg-zinc-800/50 transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="block w-full text-center px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200"
              >
                Join Questro
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
