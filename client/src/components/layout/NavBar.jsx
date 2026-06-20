import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import NavLinks from './NavLinks';
import GuestActions from './GuestActions';
import UserActions from './UserActions';
import MobileMenu from './MobileMenu';
import { useAuth } from '../../features/auth/store/AuthContext';
import NotificationDropdown from '../../features/notifications/components/NotificationDropdown';
import GlobalSearchDropdown from '../../features/search/components/GlobalSearchDropdown';
import { motion, AnimatePresence } from 'framer-motion';

const NavBar = ({ onVisibilityChange, forceHidden = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoggedIn: isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
      const isAtBottom = window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 100;

      setIsScrolled(currentScrollY > 20);

      // Only update visibility if we've scrolled more than 10px to prevent flickering
      if (scrollDelta > 10) {
        if (currentScrollY < 50 || isAtBottom) {
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof onVisibilityChange === 'function') {
      onVisibilityChange(isVisible);
    }
  }, [isVisible, onVisibilityChange]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleNavLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div 
        className={`fixed top-0 inset-x-0 z-40 flex justify-center p-4 sm:p-6 transition-all duration-500 ease-in-out pointer-events-none ${
          (isVisible && !forceHidden) ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <nav
          className={`pointer-events-auto w-full max-w-7xl rounded-full flex justify-between items-center px-4 sm:px-6 py-3 transition-all duration-500 ease-out ${
            isScrolled 
              ? 'bg-[#09090b]/80 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10' 
              : 'bg-[#09090b]/20 backdrop-blur-lg border border-white/5 shadow-lg'
          }`}
        >
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3 flex-shrink-0 group" onClick={handleNavLinkClick}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <img src={logoImg} alt="Questro Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
            </div>
            <span className="hidden sm:inline text-xl sm:text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent group-hover:from-white group-hover:to-zinc-200 transition-all duration-300 tracking-tight">
              Questro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 justify-center">
            <NavLinks isAuthenticated={isAuthenticated} />
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4 justify-end flex-shrink-0 min-w-[200px]">
            {isAuthenticated && <GlobalSearchDropdown />}
            {isAuthenticated && <NotificationDropdown />}
            {isAuthenticated ? <UserActions /> : <GuestActions />}
          </div>

          {/* Mobile Menu Toggle & Search */}
          <div className="lg:hidden flex items-center gap-3">
            {isAuthenticated && <GlobalSearchDropdown />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-200 focus:outline-none ring-1 ring-white/10"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center gap-1.5">
                <span className={`block w-full h-0.5 bg-zinc-100 rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-full h-0.5 bg-zinc-100 rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-full h-0.5 bg-zinc-100 rounded-full transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu
            isAuthenticated={isAuthenticated}
            onClose={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default NavBar;