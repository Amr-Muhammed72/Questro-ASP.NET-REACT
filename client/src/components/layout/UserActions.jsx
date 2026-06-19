import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../features/auth/store/AuthContext';
import { useProfileStore } from '../../features/profile/store/useProfileStore';
import { getMyProfile } from '../../features/profile/api/profileService';
import { authService } from '../../features/auth/api/authService';
import { motion, AnimatePresence } from 'framer-motion';

const UserActions = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { myProfile, imageUpdateStamp, setMyProfile } = useProfileStore();
  const [userId, setUserId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (myProfile?.userId) {
      setUserId(myProfile.userId);
    } else {
      const fetchUserId = async () => {
        try {
          const profile = await getMyProfile();
          setMyProfile(profile);
          setUserId(profile.userId);
        } catch (error) {
          console.error('Failed to fetch user ID:', error);
        }
      };
      fetchUserId();
    }
  }, [myProfile, setMyProfile]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewProfile = () => {
    if (userId) {
      navigate(`/users/${userId}`);
      setIsDropdownOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      logout();
      navigate('/');
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-zinc-800/50 transition-colors duration-200 group focus:outline-none"
        aria-expanded={isDropdownOpen}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-indigo-500/50 transition-all duration-300 shadow-lg">
          {myProfile?.profilePicUrl ? (
            <img 
              src={`http://localhost:5222${myProfile.profilePicUrl}?t=${imageUpdateStamp}`} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-white text-sm font-bold">
              {myProfile?.firstName ? myProfile.firstName.charAt(0).toUpperCase() : '?'}
            </span>
          )}
        </div>
        <span className="hidden sm:inline text-sm text-zinc-100 font-semibold group-hover:text-white transition-colors duration-200">
          Profile
        </span>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-300 hidden sm:inline ${isDropdownOpen ? 'rotate-180 text-white' : 'group-hover:text-zinc-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#09090b]/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50 p-1.5"
          >
            <div className="px-3 py-2.5 mb-1.5 border-b border-white/5">
              <p className="text-sm text-zinc-100 font-semibold truncate">
                {myProfile?.firstName} {myProfile?.lastName}
              </p>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {myProfile?.email}
              </p>
            </div>
            
            <button
              onClick={handleViewProfile}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-300 rounded-xl hover:bg-white/10 hover:text-white transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>View Profile</span>
            </button>

            <button
              onClick={() => {
                handleLogout();
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200 mt-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserActions;
