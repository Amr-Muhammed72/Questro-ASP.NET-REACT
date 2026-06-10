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
      className="group bg-zinc-900/60 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-6 hover:bg-zinc-800/80 hover:border-indigo-500/50 transition-all duration-300 flex flex-col items-center text-center"
    >
      <div className="mb-4">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden ring-2 ring-indigo-500/30 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:ring-indigo-500/60 transition-all">
          {profilePicUrl && !imageError ? (
            <img
              src={profilePicUrl}
              alt={fullName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-white text-2xl font-bold">{initials}</span>
          )}
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors line-clamp-2">
        {fullName}
      </h3>

      {user.userName && (
        <p className="text-sm text-zinc-400 mb-3">@{user.userName}</p>
      )}

      {user.followedAt && (
        <div className="flex items-center justify-center gap-1 text-xs text-zinc-500">
          <Users className="w-3 h-3" />
          <span>Followed on {new Date(user.followedAt).toLocaleDateString()}</span>
        </div>
      )}
    </Link>
  );
});

UserCard.displayName = 'UserCard';
export default UserCard;
