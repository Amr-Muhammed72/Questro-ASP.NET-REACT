import { lazy, Suspense } from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Route guards
import GuestRoute from './guards/GuestRoute';
import ProtectedRoute from './guards/ProtectedRoute';
import ParentRoute from './guards/ParentRoute';

// Shared wrapper
import PageTransition from '../components/common/PageTransition';
import NavBar from '../components/layout/NavBar';

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
const MovieDetailsPage = lazy(() => import('../pages/MovieDetailsPage'));
const GamesPage   = lazy(() => import('../pages/GamesPage'));
const GameDetailsPage = lazy(() => import('../pages/GameDetailsPage'));
const StaffDetailsPage = lazy(() => import('../pages/StaffDetailsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const FamilyDashboard = lazy(() => import('../features/family/components/FamilyDashboard').then(module => ({ default: module.FamilyDashboard })));

// ── Full-page loading fallback ─────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-950">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500" />
  </div>
);

export default function AnimatedRoutes() {
  const location = useLocation();
  const hideNavBarPaths = ['/login', '/register', '/forgot-password'];
  const isAuthRoute = hideNavBarPaths.includes(location.pathname);

  return (
    <>
      {!isAuthRoute && <NavBar />}
      {/* Suspense must wrap AnimatePresence so lazy chunks have a fallback
          while they are being fetched. */}
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
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
            path="/movies/:tmdbId"
            element={<ProtectedRoute><PageTransition><MovieDetailsPage /></PageTransition></ProtectedRoute>}
          />
          <Route
            path="/games"
            element={<ProtectedRoute><PageTransition><GamesPage /></PageTransition></ProtectedRoute>}
          />
          <Route
            path="/games/:id"
            element={<ProtectedRoute><PageTransition><GameDetailsPage /></PageTransition></ProtectedRoute>}
          />
          <Route
            path="/staff/:id"
            element={<ProtectedRoute><PageTransition><StaffDetailsPage /></PageTransition></ProtectedRoute>}
          />
          <Route
            path="/users/:userId"
            element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>}
          />
          <Route
            path="/family-management"
            element={<ParentRoute><PageTransition><FamilyDashboard /></PageTransition></ParentRoute>}
          />

        </Routes>
      </AnimatePresence>
    </Suspense>
    </>
  );
}
