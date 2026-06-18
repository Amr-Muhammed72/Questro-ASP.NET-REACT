import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/store/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (localStorage.getItem('justRegistered') === 'true' && location.pathname !== '/survey') {
    return <Navigate to="/survey" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
