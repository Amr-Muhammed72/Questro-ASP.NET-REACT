import React, { useState } from 'react';
import { Gamepad2, Film, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import registerService from '../services/register';
import RegisterForm from '../components/RegisterForm';
import RealmCard from '../components/RealmCard';
import bgImage from '../assets/main-background.png';
import logoImg from '../assets/logo.png';

const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (userData) => {
    setIsLoading(true);
    try {
      const response = await registerService.register(userData);
      console.log('Successfully registered!', response);
      // Here you would usually redirect the user to the login page or log them in directly
    } catch (exception) {
      console.error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
               <img src={logoImg} alt="Questro Logo" className="w-12 h-12 object-contain drop-shadow-md" /> Questro
            </h1>
            <p className="text-zinc-300 text-lg">Join us to unlock your hybrid gateway to cinematic experiences and gaming worlds.</p>
            
            <div className="space-y-4">
              <RealmCard title="Discover Movies" description="Get personalized recommendations based on your taste." icon={Film} colorTheme="cyan" />
              <RealmCard title="Find Games" description="Connect with gamers and find your next adventure." icon={Gamepad2} colorTheme="purple" />
              <RealmCard title="Rate & Share" description="Share your opinions and read reviews from the community." icon={Star} colorTheme="yellow" />
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-md p-8 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Begin Your Journey</h2>
                <p className="text-zinc-300">Create an account to access your realm.</p>
              </div>

              <RegisterForm handleRegister={handleRegister} isLoading={isLoading} />
              
              <p className="mt-6 text-center text-sm text-zinc-400">
                Already have an account?{' '}
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition cursor-pointer">Sign in here</Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;