import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
// import MovieHomepage from './pages/MovieHomepage';
import MoviesPage from './pages/MoviesPage';
import { AuthProvider } from './context/AuthContext';
import GuestRoute from './components/guards/GuestRoute';
import ProtectedRoute from './components/guards/ProtectedRoute';
import './App.css';

import MoviePageDetails from './pages/MoviePageDetails';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
          <Route path='/' element={<LandingPage />} />
          
          {/* Guest routes: Only accessible if NOT logged in */}
          <Route path='/login' element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path='/register' element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path='/forgot-password' element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          
          {/* trying */}
          <Route path='/Movies' element={<GuestRoute><MoviesPage /></GuestRoute>} />
          <Route path="/movies/:id" element={<MoviePageDetails />} />

          {/* <Route path='/movie/:id' element={<GuestRoute><MoviePageDetails /></GuestRoute>} /> */}
        
          {/* Protected routes: Only accessible if logged in */}
          {/* <Route path='/movies' element={<ProtectedRoute><MoviesPage /></
          ProtectedRoute>} /> */}
        
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
