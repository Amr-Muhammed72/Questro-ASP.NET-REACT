import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../features/auth/store/AuthContext';
import { useProfileStore } from '../../features/profile/store/useProfileStore';
import { getMyProfile } from '../../features/profile/api/profileService';
import {authService} from '../../features/auth/api/authService';

const UserActions = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentProfile, imageUpdateStamp } = useProfileStore();
  const [userId, setUserId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (currentProfile?.userId) {
      setUserId(currentProfile.userId);
    } else {
      const fetchUserId = async () => {
        try {
          const profile = await getMyProfile();
          setUserId(profile.userId);
        } catch (error) {
          console.error('Failed to fetch user ID:', error);
        }
      };
      fetchUserId();
    }
  }, [currentProfile]);

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
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors duration-200 group"
        aria-expanded={isDropdownOpen}
      >
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
        <span className="hidden sm:inline text-zinc-100 font-semibold">Profile</span>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-200 hidden sm:inline ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-150">
          <button
            onClick={handleViewProfile}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-100 hover:bg-zinc-800 transition-colors duration-150 border-b border-zinc-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-semibold">View Profile</span>
          </button>

          <button
            onClick={() => {
              handleLogout();
              setIsDropdownOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-100 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserActions;
