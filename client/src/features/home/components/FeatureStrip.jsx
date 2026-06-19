import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Gamepad2,
  Bookmark,
  Zap,
} from 'lucide-react';

const FeatureStrip = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'Personalized Recommendations',
      description: 'AI learns your taste to suggest movies and games you\'ll love',
      color: 'from-indigo-500/30',
      borderColor: 'border-indigo-500/30',
      hoverColor: 'hover:border-indigo-500/60',
    },
    {
      icon: TrendingUp,
      title: 'Trending Movies',
      description: 'Discover what\'s hot right now across cinema and streaming',
      color: 'from-purple-500/30',
      borderColor: 'border-purple-500/30',
      hoverColor: 'hover:border-purple-500/60',
    },
    {
      icon: Gamepad2,
      title: 'Trending Games',
      description: 'Stay updated with the latest gaming sensations and hidden gems',
      color: 'from-blue-500/30',
      borderColor: 'border-blue-500/30',
      hoverColor: 'hover:border-blue-500/60',
    },
    {
      icon: Bookmark,
      title: 'Smart Watchlists',
      description: 'Organize and track everything you want to watch and play',
      color: 'from-cyan-500/30',
      borderColor: 'border-cyan-500/30',
      hoverColor: 'hover:border-cyan-500/60',
    },
    {
      icon: Zap,
      title: 'Cross-Platform Discovery',
      description: 'Find the perfect entertainment across movies, games, and more',
      color: 'from-pink-500/30',
      borderColor: 'border-pink-500/30',
      hoverColor: 'hover:border-pink-500/60',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="relative w-full py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm md:text-base font-semibold text-indigo-400/80 uppercase tracking-widest mb-2">
            Platform Capabilities
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Discover, track, and enjoy entertainment tailored to your unique taste
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {features.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className={`group relative p-6 md:p-8 rounded-2xl backdrop-blur-xl bg-white/5 border ${feature.borderColor} ${feature.hoverColor} transition-all duration-500 hover:bg-white/8`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-white/10 flex items-center justify-center mb-4 group-hover:border-white/20 group-hover:bg-zinc-800/80 transition-all duration-300">
                    <IconComponent className="w-6 h-6 text-indigo-400 group-hover:text-white transition-colors duration-300" />
                  </div>

                  <h3 className="text-lg md:text-base font-bold text-zinc-100 mb-3 group-hover:text-white transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[inset_0_0_15px_rgba(79,70,229,0.1)]" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureStrip;
