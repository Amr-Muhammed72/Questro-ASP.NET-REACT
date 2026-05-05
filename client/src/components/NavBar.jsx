import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import NavLinks from './NavLinks';
import GuestActions from './GuestActions';
import UserActions from './UserActions';
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { isLoggedIn: isAuthenticated } = useAuth(); // Destructure properly from context

  useEffect(() => {
    // Scroll behavior
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setIsScrolled(currentScrollY > 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav 
      className={`w-full py-4 px-4 sm:px-8 flex justify-between items-center fixed top-0 z-50 transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled ? 'bg-zinc-950/90 py-3 backdrop-blur-sm' : 'bg-transparent py-6'
      }`}
    >
      <div className="flex items-center gap-10">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 cursor-pointer group">
          <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
            <img src={logoImg} alt="Questro Logo" className="w-10 h-10 object-contain drop-shadow-md" />
          </div>
          <span className="text-2xl font-bold text-white tracking-wide">Questro</span>
        </Link>

        {/* Main Navigation Links */}
        <div className="hidden md:block">
          <NavLinks isAuthenticated={isAuthenticated} />
        </div>
      </div>

      {/* Actions (Login/Auth) */}
      <div className="flex items-center">
        {isAuthenticated ? <UserActions /> : <GuestActions />}
      </div>
    </nav>
  );
};

export default NavBar;