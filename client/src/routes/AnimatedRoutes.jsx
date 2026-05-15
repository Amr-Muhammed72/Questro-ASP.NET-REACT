import { useLocation, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import MoviesPage from '../pages/MoviesPage';
import GamesPage from '../pages/GamesPage';
import GuestRoute from './guards/GuestRoute';
import ProtectedRoute from './guards/ProtectedRoute';
import PageTransition from '../components/common/PageTransition';

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="sync">
      <Routes location={location} key={location.pathname}>
        <Route path='/' element={<PageTransition><LandingPage /></PageTransition>} />
        
        {/* Guest routes: Only accessible if NOT logged in */}
        <Route path='/login' element={<GuestRoute><PageTransition><LoginPage /></PageTransition></GuestRoute>} />
        <Route path='/register' element={<GuestRoute><PageTransition><RegisterPage /></PageTransition></GuestRoute>} />
        <Route path='/forgot-password' element={<GuestRoute><PageTransition><ForgotPasswordPage /></PageTransition></GuestRoute>} />
        
        {/* Protected routes: Only accessible if logged in */}
        <Route path='/movies' element={<ProtectedRoute><PageTransition><MoviesPage /></PageTransition></ProtectedRoute>} />
        <Route path='/games' element={<ProtectedRoute><PageTransition><GamesPage /></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}
