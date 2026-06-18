import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../features/auth/store/AuthContext';
import { Gamepad2, Film, Shield, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const handleCTA = () => {
    if (isLoggedIn) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden font-sans bg-[#09090b] text-zinc-100 flex items-center justify-center">
      {/* Background Starfield */}
      <div className="star-field">
        <div className="star-layer" id="stars-small"></div>
        <div className="star-layer" id="stars-medium"></div>
        <div className="star-layer" id="stars-large"></div>
      </div>
      
      {/* Dynamic Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none opacity-60 mix-blend-screen" />
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />

      <main className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 w-full max-w-7xl mx-auto">
          
          {/* Left Column - Hero Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left pt-16 lg:pt-0"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glassmorphism mb-6 text-sm font-medium text-indigo-300 ring-1 ring-indigo-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              The Next Evolution of Entertainment
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight mb-6 leading-[1.1]">
              Unlock Your <br />
              <span className="gradient-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-sm">
                Digital Universe.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
              Master your media. Discover, track, and curate your ultimate library of movies and games in one seamless, breathtaking experience.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCTA}
              className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-white text-zinc-950 font-bold rounded-full overflow-hidden transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
            >
              <span className="relative z-10 flex items-center gap-2 text-lg sm:text-xl">
                {isLoggedIn ? 'Enter Dashboard' : 'Start Your Journey'}
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 via-white to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.button>
          </motion.div>

          {/* Right Column - Floating Cards */}
          <div className="flex-1 relative hidden lg:flex h-[500px] w-full max-w-lg perspective-1000">
            {[
              {
                icon: Film,
                title: "Discover Movies",
                desc: "Get personalized movie recommendations tailored just for you.",
                color: "from-blue-500 to-indigo-500",
                position: "top-0 right-10 z-10",
                delay: 0.2
              },
              {
                icon: Gamepad2,
                title: "Find Games",
                desc: "Discover your next gaming adventure with smart suggestions.",
                color: "from-purple-500 to-pink-500",
                position: "top-[160px] left-0 z-20",
                delay: 0.4
              },
              {
                icon: Shield,
                title: "Family Controls",
                desc: "Keep your family safe with simple, easy-to-use content filters.",
                color: "from-indigo-500 to-purple-500",
                position: "bottom-0 right-20 z-30",
                delay: 0.6
              }
            ].map((feature, idx) => (
              <div key={idx} className={`absolute ${feature.position} hover:z-50`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: [0, -15, 0]
                  }}
                  transition={{ 
                    y: {
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: idx * 1.5
                    },
                    opacity: { duration: 0.8, delay: feature.delay },
                    scale: { duration: 0.8, delay: feature.delay }
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    transition: { duration: 0.2 } 
                  }}
                  className="glassmorphism p-6 rounded-2xl w-72 backdrop-blur-2xl border border-white/10 shadow-2xl hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] hover:ring-1 hover:ring-purple-500/30 transition-shadow duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <div className="h-1 w-12 bg-white/20 rounded-full mb-3" />
                  <p className="text-sm text-zinc-400">{feature.desc}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
