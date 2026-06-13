import { lazy, Suspense } from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Route guards
import GuestRoute from './guards/GuestRoute';
import ProtectedRoute from './guards/ProtectedRoute';

// Shared wrapper
import PageTransition from '../components/common/PageTransition';

// ── Eagerly loaded pages ───────────────────────────────────────────────────
// These are tiny and needed immediately on first paint (unauthenticated flow).
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';

// ── Lazily loaded pages ────────────────────────────────────────────────────
// Heavy feature pages — downloaded only when the user navigates to them.
// Vite will create separate JS chunks for each, keeping the initial bundle small.
const MoviesPage  = lazy(() => import('../pages/MoviesPage'));
const GamesPage   = lazy(() => import('../pages/GamesPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));

// ── Full-page loading fallback ─────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-950">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500" />
  </div>
);

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    // Suspense must wrap AnimatePresence so lazy chunks have a fallback
    // while they are being fetched.
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="sync">
        <Routes location={location} key={location.pathname}>

          {/* Public */}
          <Route
            path="/"
            element={<PageTransition><LandingPage /></PageTransition>}
          />

          {/* Guest-only */}
          <Route
            path="/login"
            element={<GuestRoute><PageTransition><LoginPage /></PageTransition></GuestRoute>}
          />
          <Route
            path="/register"
            element={<GuestRoute><PageTransition><RegisterPage /></PageTransition></GuestRoute>}
          />
          <Route
            path="/forgot-password"
            element={<GuestRoute><PageTransition><ForgotPasswordPage /></PageTransition></GuestRoute>}
          />

          {/* Protected — lazy-loaded */}
          <Route
            path="/movies"
            element={<ProtectedRoute><PageTransition><MoviesPage /></PageTransition></ProtectedRoute>}
          />
          <Route
            path="/games"
            element={<ProtectedRoute><PageTransition><GamesPage /></PageTransition></ProtectedRoute>}
          />
          <Route
            path="/users/:userId"
            element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>}
          />

        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
