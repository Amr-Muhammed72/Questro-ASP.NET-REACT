import React, { useState } from 'react';
import { Mail, Lock, Gamepad2, Film, Star } from 'lucide-react';
import logoImg from '../assets/logo.png';

// ==========================================
// 🧩 Helper Components (Keeps main code clean)
// ==========================================

const RealmCard = ({ title, description, actionText, icon: Icon, colorTheme }) => {
  const themes = {
    cyan: "from-cyan-500/20 to-blue-500/20 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 text-cyan-400",
    purple: "from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30 text-purple-400",
    yellow: "from-yellow-500/20 to-orange-500/20 group-hover:from-yellow-500/30 group-hover:to-orange-500/30 text-yellow-400",
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-lg border border-zinc-700/30 rounded-2xl p-6 group hover:bg-zinc-800/60 transition cursor-pointer">
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 bg-gradient-to-br rounded-lg flex items-center justify-center transition ${themes[colorTheme]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">{title}</h3>
          <p className="text-zinc-400 text-sm">{description}</p>
          <div className="flex items-center space-x-2 mt-3">
            <span className={`text-xs font-medium text-${colorTheme}-400`}>{actionText}</span>
            <span className="text-zinc-600">→</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialButton = ({ provider }) => (
  <button type="button" className="bg-zinc-900/40 backdrop-blur-lg border border-zinc-700/30 rounded-lg hover:bg-zinc-800/60 transition py-2.5 text-sm font-medium text-white w-full">
    {provider}
  </button>
);


// ==========================================
// 🚀 Main Login Page Component
// ==========================================

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network request to your future Express backend
    setTimeout(() => {
      console.log('Login attempt:', { email, password });
      setIsLoading(false);
      setEmail('');
      setPassword('');
    }, 2000);
  };

  return (
    <div className="relative w-full min-h-screen bg-zinc-950 overflow-hidden font-sans">
      
      {/* 🌌 Animated Background Elements */}
      <div 
        className="absolute w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-30 -top-20 -left-20 animate-[float_6s_ease-in-out_infinite]"
      />
      <div 
        className="absolute w-80 h-80 bg-cyan-500 rounded-full blur-3xl opacity-30 bottom-0 right-0 animate-[float_6s_ease-in-out_infinite]"
        style={{ animationDelay: '2s' }}
      />
      
      {/* Adding custom keyframes dynamically for the float effect */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }
      `}</style>

      {/* 📦 Main Content Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* --- LEFT COLUMN: Branding & Features --- */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center text-white">
                  <img src={logoImg} alt="Questro Logo" className="w-12 h-12 object-contain drop-shadow-md" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Questro
                </h1>
              </div>
              <p className="text-zinc-400 text-lg">
                Your hybrid gateway to cinematic experiences and gaming worlds.
              </p>
            </div>

            <div className="space-y-4">
              <RealmCard 
                title="Discover Movies" 
                description="Get personalized recommendations based on your taste." 
                actionText="Explore" 
                icon={Film} 
                colorTheme="cyan" 
              />
              <RealmCard 
                title="Find Games" 
                description="Connect with gamers and find your next adventure." 
                actionText="Browse" 
                icon={Gamepad2} 
                colorTheme="purple" 
              />
              <RealmCard 
                title="Rate & Share" 
                description="Share your opinions and read reviews from the community." 
                actionText="Community" 
                icon={Star} 
                colorTheme="yellow" 
              />
            </div>
          </div>

          {/* --- RIGHT COLUMN: Auth Form --- */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-md p-8 sm:p-10 shadow-2xl">
              
              {/* Mobile Branding (Only visible on small screens) */}
              <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
                <div className="flex items-center justify-center text-white">
                  <img src={logoImg} alt="Questro Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                </div>
                <h1 className="text-3xl font-bold text-white">Questro</h1>
              </div>

              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-zinc-400">Enter your credentials to access your realm.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3.5 pl-12 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-zinc-300">Password</label>
                    <button type="button" className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3.5 pl-12 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Entering Realm...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="mt-8 flex items-center space-x-3">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">or continue with</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* Social Logins */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <SocialButton provider="Google" />
                <SocialButton provider="GitHub" />
              </div>

              <p className="mt-8 text-center text-sm text-zinc-400">
                Don't have an account?{' '}
                <button className="text-cyan-400 hover:text-cyan-300 font-medium transition">Sign up now</button>
              </p>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
} 