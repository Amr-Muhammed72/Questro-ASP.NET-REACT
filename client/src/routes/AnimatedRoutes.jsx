import { lazy, Suspense } from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Route guards
import GuestRoute from './guards/GuestRoute';
import ProtectedRoute from './guards/ProtectedRoute';
import ParentRoute from './guards/ParentRoute';
import SurveyCompletionGuard from './guards/SurveyCompletionGuard';

// Shared wrapper
import PageTransition from '../components/common/PageTransition';
import NavBar from '../components/layout/NavBar';
import BottomNav from '../components/layout/BottomNav';
import Footer from '../components/layout/Footer';
import Chatbot from '../features/chatbot/components/Chatbot';

// ── Eagerly loaded pages ───────────────────────────────────────────────────
// These are tiny and needed immediately on first paint (unauthenticated flow).
import LandingPage from '../pages/LandingPage';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';

const MoviesPage  = lazy(() => import('../pages/MoviesPage'));
const MovieDetailsPage = lazy(() => import('../pages/MovieDetailsPage'));
const GamesPage   = lazy(() => import('../pages/GamesPage'));
const GameDetailsPage = lazy(() => import('../pages/GameDetailsPage'));
const StaffDetailsPage = lazy(() => import('../pages/StaffDetailsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const FamilyDashboard = lazy(() => import('../features/family/components/FamilyDashboard').then(module => ({ default: module.FamilyDashboard })));
const SurveyPage = lazy(() => import('../pages/SurveyPage'));
import PageLoader from '../components/common/PageLoader';

export default function AnimatedRoutes() {
  const location = useLocation();
  
  const hideNavBarPaths = ['/login', '/register', '/forgot-password', '/survey'];
  const isAuthRoute = hideNavBarPaths.includes(location.pathname);
  const isLandingPage = location.pathname === '/';

  const isNoScrollPage = isLandingPage || isAuthRoute;

  return (
    <>
      {!isAuthRoute && <NavBar />}
      {!isAuthRoute && !isLandingPage && <Chatbot />}
      {!isAuthRoute && !isLandingPage && <BottomNav />}
      <SurveyCompletionGuard>
        <Suspense fallback={<PageLoader />}>
          <main className={`flex flex-col ${isNoScrollPage ? 'h-[100dvh] overflow-hidden' : 'min-h-screen pb-20 md:pb-0'}`}>
            <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
            <Routes location={location} key={location.pathname}>

              <Route
                path="/"
                element={<PageTransition><LandingPage /></PageTransition>}
              />
              <Route
                path="/home"
                element={<PageTransition><HomePage /></PageTransition>}
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
              
              {/* Protected Routes */}
              <Route
                path="/survey"
                element={<ProtectedRoute><PageTransition><SurveyPage /></PageTransition></ProtectedRoute>}
              />
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
          </main>
        </Suspense>
      </SurveyCompletionGuard>
      {!isLandingPage && !isAuthRoute && <Footer />}
    </>
  );
}
