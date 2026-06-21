import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { Home, Film, Gamepad2, User, LogOut, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../features/auth/store/AuthContext';
import { useProfileStore } from '../../features/profile/store/useProfileStore';
import { getMyProfile } from '../../features/profile/api/profileService';
import { SERVER_URL } from '../../lib/apiClient';
import { authService } from '../../features/auth/api/authService';
import NotificationDropdown from '../../features/notifications/components/NotificationDropdown';

const BottomNav = () => {
  const { isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { myProfile, imageUpdateStamp, setMyProfile } = useProfileStore();
  const [userId, setUserId] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      if (myProfile) {
        setUserId(myProfile.id || myProfile.userId);
      } else {
        const fetchUserId = async () => {
          try {
            const profile = await getMyProfile();
            setMyProfile(profile);
            setUserId(profile.id || profile.userId);
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
          }
        };
        fetchUserId();
      }
    }
  }, [isLoggedIn, myProfile, setMyProfile]);

  // Hide bottom nav on specific routes where it shouldn't appear
  const hidePaths = ['/login', '/register', '/forgot-password', '/survey'];
  if (hidePaths.includes(location.pathname)) return null;

  const getProfileImageUrl = () => {
    if (!myProfile?.profilePicUrl) return null;
    if (myProfile.profilePicUrl.startsWith('http')) return myProfile.profilePicUrl;
    return `${SERVER_URL}${myProfile.profilePicUrl}?t=${imageUpdateStamp}`;
  };

  const imageUrl = getProfileImageUrl();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      logout();
      setIsProfileMenuOpen(false);
      navigate('/');
    }
  };

  const navItems = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Movies', path: '/movies', icon: Film },
    { name: 'Games', path: '/games', icon: Gamepad2 },
  ];

  if (isLoggedIn) {
    navItems.push({
      name: 'Notifications',
      isNotifications: true
    });
    navItems.push({
      name: 'Profile',
      path: userId ? `/users/${userId}` : '#',
      icon: User,
      isProfile: true
    });
  } else {
    navItems.push({ name: 'Sign In', path: '/login', icon: User });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#09090b]/80 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom)]">
      <nav className="flex justify-around items-center px-2 py-2 h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.isProfile && location.pathname.startsWith('/users/'));
            const Icon = item.icon;

            if (item.isProfile) {
              return (
                <div key={item.name} className="relative flex flex-col items-center justify-center w-full h-full">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="relative flex flex-col items-center justify-center w-full h-full space-y-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <div className={`relative flex items-center justify-center transition-transform duration-300 ${isProfileMenuOpen ? 'scale-110' : ''}`}>
                      {imageUrl ? (
                        <div className={`w-6 h-6 rounded-full overflow-hidden border-[1.5px] ${isProfileMenuOpen ? 'border-indigo-400' : 'border-transparent'}`}>
                          <img 
                            src={imageUrl} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <Icon className={`w-6 h-6 ${isProfileMenuOpen ? 'text-indigo-400' : ''}`} />
                      )}
                    </div>
                    <span className={`text-[10px] font-medium ${isProfileMenuOpen ? 'text-indigo-400' : ''}`}>
                      {item.name}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsProfileMenuOpen(false);
                          }}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-[calc(100%+0.5rem)] right-2 w-48 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-50"
                        >
                        <Link
                          to={`/users/${userId}`}
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <User className="w-4 h-4" /> View Profile
                        </Link>
                        <div className="h-px bg-white/10 my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </motion.div>
                    </>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            if (item.isNotifications) {
              return (
                <div key={item.name} className="relative flex flex-col items-center justify-center w-full h-full">
                  <NotificationDropdown direction="up" mobileView={true} />
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsProfileMenuOpen(false)}
                className="relative flex flex-col items-center justify-center w-full h-full space-y-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-2 w-10 h-1 bg-indigo-500 rounded-b-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                
                <div className={`relative flex items-center justify-center transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'text-indigo-400' : ''}`} />
                </div>
                
                <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-400' : ''}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>
    </div>
  );
};

export default BottomNav;
