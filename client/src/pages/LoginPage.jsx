import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Film, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import DynamicPosterCollage from '../components/ui/DynamicPosterCollage';
import LoginForm from '../features/auth/components/LoginForm';
import PremiumBackground from '../components/ui/PremiumBackground';
import logoImg from '../assets/logo.png';

const LoginPage = () => {
  return (
    <PremiumBackground>
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 items-center px-4 py-12">
          
          <div className="hidden lg:flex flex-col justify-center h-full relative space-y-8 pr-10">
            <div className="z-20 relative">
              <Link to="/" className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-4 mb-6">
                 <img src={logoImg} alt="Questro Logo" className="w-14 h-14 object-contain drop-shadow-xl" /> Questro
              </Link>
              <p className="text-zinc-300 text-xl font-medium max-w-md leading-relaxed">
                Your gateway to cinematic experiences and gaming worlds. Discover, track, and share your favorites.
              </p>
            </div>

            <DynamicPosterCollage />
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-md p-8 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-zinc-300">Enter your credentials to access your realm.</p>
              </div>

              <LoginForm />
              
              <p className="mt-6 text-center text-sm text-zinc-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium transition cursor-pointer">Register here</Link>
              </p>
            </div>
          </div>
      </div>
    </PremiumBackground>
  );
};

export default LoginPage;