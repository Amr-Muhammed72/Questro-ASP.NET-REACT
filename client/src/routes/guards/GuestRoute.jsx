import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/store/AuthContext';

const GuestRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  
  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

export default GuestRoute;
