import React, { useState, useEffect } from 'react';
import { Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide navbar if scrolling down past 100px. Show if scrolling up.
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      // Add solid background when scrolled down even a bit
      setIsScrolled(currentScrollY > 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav 
      className={`w-full py-4 px-4 sm:px-8 lg:px-12 flex justify-between items-center fixed top-0 z-50 transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled ? 'bg-zinc-950/90  py-3' : 'bg-transparent py-6'
      }`}
    >
      {/* Brand Logo */}
      <Link to="/" className="flex items-center space-x-3 cursor-pointer group">
        <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
          <img src={logoImg} alt="Questro Logo" className="w-10 h-10 object-contain drop-shadow-md" />
        </div>
        <span className="text-2xl font-bold text-white tracking-wide">Questro</span>
      </Link>

      {/* Auth Actions */}
      <div className="flex items-center space-x-4 sm:space-x-6">
        <Link to="/login" className="text-white text-sm font-medium hover:text-zinc-300 transition-colors drop-shadow-md">
          Sign in
        </Link>
        <Link to="/register" className="bg-white text-black text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]">
          Join Questro
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;