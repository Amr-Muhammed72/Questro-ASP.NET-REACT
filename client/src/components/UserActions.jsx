import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserActions = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5222/api/Auth/logOut', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include' // Ensures the HTTP-only refresh token cookie is sent/cleared
      });
      
      if (response.ok) {
        logout(); // Clear local state and localStorage
        navigate('/');
      } else {
        console.error('Logout failed on the server.');
        // Optional: clear state anyway if you want a forced exit
        logout();
        navigate('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback cleanup
      logout();
      navigate('/');
    }
  };

  return (
    <div className="flex items-center space-x-4 text-white">
      <Link to="/profile" className="hover:text-gray-200 transition-colors">
        Profile
      </Link>
      <button
        onClick={handleLogout}
        className="px-4 py-2 border border-white rounded-full hover:bg-white hover:text-black transition-colors"
      >
        Logout
      </button>
    </div>
  );
};

export default UserActions;
