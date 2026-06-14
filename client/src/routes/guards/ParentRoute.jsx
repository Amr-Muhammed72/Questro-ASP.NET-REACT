import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/store/AuthContext';
import { useFamilyStore } from '../../features/family/store/useFamilyStore';

const ParentRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const isChild = useFamilyStore((state) => state.isChild);
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // If isChild is true, it's a child account, so redirect.
  if (isChild) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default ParentRoute;
