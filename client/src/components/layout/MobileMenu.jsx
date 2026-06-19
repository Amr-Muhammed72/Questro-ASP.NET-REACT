import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../features/auth/store/AuthContext';
import { authService } from '../../features/auth/api/authService';
import { useNotificationStore } from '../../features/notifications/store/useNotificationStore';
import { useProfileStore } from '../../features/profile/store/useProfileStore';
import { motion, AnimatePresence } from 'framer-motion';

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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden ring-2 ring-indigo-500/30">
                    {currentProfile?.profilePicUrl ? (
                      <img 
                        src={`http://localhost:5222${currentProfile.profilePicUrl}?t=${imageUpdateStamp}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-white font-bold">
                        {currentProfile?.firstName ? currentProfile.firstName.charAt(0).toUpperCase() : '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-lg">{currentProfile?.firstName || 'Profile'}</span>
                  </div>
                </div>
                <svg className={`w-5 h-5 transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-white' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-6 pr-4 py-2 space-y-2 border-l-2 border-white/10 ml-6 mt-2">
                      <Link
                        to="/profile"
                        onClick={onClose}
                        className="block px-4 py-2 rounded-xl text-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors duration-200"
                      >
                        View Profile
                      </Link>
                      <Link
                        to="/profile?tab=notifications"
                        onClick={onClose}
                        className="flex justify-between items-center px-4 py-2 rounded-xl text-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors duration-200"
                      >
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-indigo-500 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 rounded-xl text-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200"
                      >
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
