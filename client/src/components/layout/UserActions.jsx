import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../features/auth/store/AuthContext';
import { useProfileStore } from '../../features/profile/store/useProfileStore';
import { getMyProfile } from '../../features/profile/api/profileService';
import { authService } from '../../features/auth/api/authService';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, ChevronDown } from 'lucide-react';

const PORT = import.meta.env.VITE_PORT || 5222;
const BASE_URL = `http://localhost:${PORT}`;

const UserActions = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { myProfile, imageUpdateStamp, setMyProfile } = useProfileStore();
  const [userId, setUserId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (myProfile) {
      setUserId(myProfile.id || myProfile.userId);
    } else {
      const fetchUserId = async () => {
        try {
          const profile = await getMyProfile();
          setMyProfile(profile);
          setUserId(profile.id || profile.userId);
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

  // Safely resolve the image URL based on whether it is absolute or relative
  const getProfileImageUrl = () => {
    if (!myProfile?.profilePicUrl) return null;
    if (myProfile.profilePicUrl.startsWith('http')) return myProfile.profilePicUrl;
    return `${BASE_URL}${myProfile.profilePicUrl}?t=${imageUpdateStamp}`;
  };

  const imageUrl = getProfileImageUrl();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-white/5 transition-colors duration-200 group focus:outline-none border border-transparent hover:border-white/10"
        aria-expanded={isDropdownOpen}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-[2px] shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300">
          <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 border border-black/50">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-300 text-sm font-bold">
                {myProfile?.firstName ? myProfile.firstName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
            )}
          </div>
        </div>
        
        <div className="hidden sm:flex flex-col items-start mr-1">
          <span className="text-sm text-zinc-100 font-semibold group-hover:text-white transition-colors duration-200 leading-tight">
            {myProfile?.firstName || 'Profile'}
          </span>
          <span className="text-[10px] text-zinc-400 font-medium leading-tight">
            View Account
          </span>
        </div>

        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 hidden sm:block ${isDropdownOpen ? 'rotate-180 text-white' : 'group-hover:text-zinc-200'}`} />
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#09090b]/95 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden z-50 p-2"
          >
            <button
              onClick={handleViewProfile}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-200 group/btn"
            >
              <User className="w-4 h-4 text-zinc-400 group-hover/btn:text-white transition-colors" />
              <span>View Profile</span>
            </button>

            <button
              onClick={() => {
                handleLogout();
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 mt-1 group/btn"
            >
              <LogOut className="w-4 h-4 text-red-400 group-hover/btn:text-red-300 transition-colors" />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserActions;
