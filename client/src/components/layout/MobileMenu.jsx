import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/store/AuthContext';
import { authService } from '../../features/auth/api/authService';
import { useNotificationStore } from '../../features/notifications/store/useNotificationStore';
import { useProfileStore } from '../../features/profile/store/useProfileStore';
import { getMyProfile } from '../../features/profile/api/profileService';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Bell, ChevronDown } from 'lucide-react';
import { SERVER_URL } from '../../lib/apiClient';

const MobileMenu = ({ isAuthenticated, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { unreadCount } = useNotificationStore();
  const { myProfile, imageUpdateStamp, setMyProfile } = useProfileStore();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
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
  }, [isAuthenticated, myProfile, setMyProfile]);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  const getProfileImageUrl = () => {
    if (!myProfile?.profilePicUrl) return null;
    if (myProfile.profilePicUrl.startsWith('http')) return myProfile.profilePicUrl;
    return `${SERVER_URL}${myProfile.profilePicUrl}?t=${imageUpdateStamp}`;
  };

  const imageUrl = getProfileImageUrl();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex justify-center items-center p-4"
    >
      <div className="absolute top-6 right-6">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-sm flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          {linksToShow.map((link) => (
            <motion.button
              key={link.name}
              variants={itemVariants}
              onClick={() => handleNavClick(link.path)}
              className="w-full text-left px-6 py-4 rounded-2xl text-2xl font-bold text-zinc-100 hover:bg-white/10 hover:translate-x-2 transition-all duration-300"
            >
              {link.name}
            </motion.button>
          ))}
        </div>

        <motion.div variants={itemVariants} className="w-full h-px bg-white/10 my-4" />

        <div className="flex flex-col gap-4">
          {isAuthenticated ? (
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white/5 text-zinc-100 font-semibold hover:bg-white/10 transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-[2px] shadow-lg">
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 border border-black/50">
                      {imageUrl ? (
                        <img 
                          key={imageUrl}
                          src={imageUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-300 text-lg font-bold">
                          {myProfile?.firstName ? myProfile.firstName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-bold">{myProfile?.firstName || 'Profile'}</span>
                    <span className="text-sm text-zinc-400 font-normal">View Account Options</span>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-white' : 'text-zinc-400'}`} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-6 pr-4 py-2 space-y-2 border-l-2 border-indigo-500/50 ml-6 mt-2">
                      <Link
                        to={userId ? `/users/${userId}` : "#"}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors duration-200 group"
                      >
                        <User className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                        View Profile
                      </Link>
                      <Link
                        to={userId ? `/users/${userId}?tab=notifications` : "#"}
                        onClick={onClose}
                        className="flex justify-between items-center px-4 py-3 rounded-xl text-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                          <span>Notifications</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-indigo-500 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200 group"
                      >
                        <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="flex flex-col gap-3">
              <Link
                to="/login"
                onClick={onClose}
                className="w-full text-center px-6 py-4 rounded-2xl text-lg text-zinc-100 font-semibold hover:bg-white/10 transition-colors duration-200 border border-white/10"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="w-full text-center px-6 py-4 rounded-2xl text-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow duration-200"
              >
                Join Questro
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MobileMenu;
