import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
const BASE_URL = 'http://localhost:5222';
const getInitialAvatar = (firstName) => {
  if (!firstName) return '?';
  return firstName.charAt(0).toUpperCase();
};

const UserCard = memo(({ user, onFollowChange }) => {
  const [imageError, setImageError] = useState(false);
  if (!user) return null;

  const profilePicUrl = user.profilePicUrl ? `${BASE_URL}${user.profilePicUrl}` : null;
  const initials = getInitialAvatar(user.firstName);
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  return (
    <Link
      to={`/users/${user.userId}`}
      className="group flex items-center justify-between p-3 sm:p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 backdrop-blur-md shadow-sm hover:shadow-lg"
    >
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-indigo-500/30 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center transition-all duration-300 shadow-lg shrink-0">
          {profilePicUrl && !imageError ? (
            <img
              src={profilePicUrl}
              alt={fullName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-white text-lg font-bold">{initials}</span>
          )}
        </div>
        
        <div className="flex flex-col text-left">
          <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
            {fullName}
          </h3>
          {user.userName && (
            <p className="text-sm text-zinc-500">@{user.userName}</p>
          )}
        </div>
      </div>
      
      <div className="opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300 shrink-0 ml-4">
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>
    </Link>
  );
});

UserCard.displayName = 'UserCard';
export default UserCard;
