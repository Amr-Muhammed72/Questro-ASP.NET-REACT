import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Film, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoginForm from '../features/auth/components/LoginForm';
import RealmCard from '../components/ui/RealmCard';
import bgImage from '../assets/main-background.png';
import logoImg from '../assets/logo.png';

const LoginPage = () => {
  const backgroundStyle = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  };
  return (
    <div style={backgroundStyle} className="relative w-full min-h-screen overflow-hidden font-sans">
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12 bg-black/40">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 items-center">
          
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <Link to="/" className="text-4xl font-bold text-white flex items-center gap-3">
               <img src={logoImg} alt="Questro Logo" className="w-12 h-12 object-contain drop-shadow-md" /> Questro
            </Link>
            <p className="text-zinc-300 text-lg">Your gateway to cinematic experiences and gaming worlds.</p>
            
            <div className="space-y-4">
              <RealmCard title="Discover Movies" description="Personalized recommendations." icon={Film} colorTheme="cyan" />
              <RealmCard title="Find Games" description="Find your next adventure." icon={Gamepad2} colorTheme="purple" />
              <RealmCard title="Rate & Share" description="Read reviews from the community." icon={Star} colorTheme="yellow" />
            </div>
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
      </div>
    </div>
  );
};

export default LoginPage;