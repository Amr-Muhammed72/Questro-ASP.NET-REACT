import React from 'react';
import { motion } from 'framer-motion';

const PremiumBackground = ({ children }) => {
  return (
    <div className="relative w-full min-h-screen overflow-hidden font-sans bg-zinc-950">
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.4) 0%, transparent 60%)',
            willChange: 'transform, opacity'
          }}
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: 'radial-gradient(circle at center, rgba(8, 145, 178, 0.4) 0%, transparent 60%)',
            willChange: 'transform, opacity'
          }}
          className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            translateY: [0, -50, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: 'radial-gradient(circle at center, rgba(79, 70, 229, 0.3) 0%, transparent 60%)',
            willChange: 'transform, opacity'
          }}
          className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full"
        />
      </div>

      {/* Grid overlay for texture */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] pointer-events-none opacity-50" />

      {/* Content wrapper */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default PremiumBackground;
