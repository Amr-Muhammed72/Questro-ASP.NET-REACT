import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeroSectionHomePage = ({ isLoading, isLoggedIn }) => {
  const heroCTA = isLoggedIn
    ? {
        primary: { text: 'Discover Movies', link: '/movies' },
        secondary: { text: 'Discover Games', link: '/games' },
      }
    : {
        primary: { text: 'Discover Movies', link: '/login' },
        secondary: { text: 'Discover Games', link: '/login' },
      };

  const heroHeadline = isLoggedIn
    ? 'Welcome Back, Explorer'
    : 'Discover Your Next Favorite Universe';

  const heroSubtitle = isLoggedIn
    ? 'Personalized recommendations for movies and games curated just for you'
    : 'Movies. Games. Worlds Beyond Imagination.';

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center px-4 md:px-8 pt-32 pb-24">
      {/* Optional gradient accent */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Section label */}
            <p className="text-sm md:text-base font-semibold text-indigo-400/80 uppercase tracking-widest mb-6">
              Premium Entertainment Platform
            </p>

            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 mb-6 tracking-tight leading-tight">
              {heroHeadline}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-2xl text-zinc-300 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
              {heroSubtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={heroCTA.primary.link}
                  className="inline-flex items-center justify-center px-8 md:px-12 py-4 md:py-5 rounded-full font-bold text-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 transition-all duration-300 shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_50px_rgba(79,70,229,0.6)]"
                >
                  {heroCTA.primary.text}
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={heroCTA.secondary.link}
                  className="inline-flex items-center justify-center px-8 md:px-12 py-4 md:py-5 rounded-full font-bold text-lg text-zinc-100 border border-zinc-700 hover:border-zinc-600 bg-zinc-900/50 hover:bg-zinc-800/50 transition-all duration-300 backdrop-blur-xl"
                >
                  {heroCTA.secondary.text}
                </Link>
              </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              className="mt-20 flex justify-center"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-zinc-500">
                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default HeroSectionHomePage;