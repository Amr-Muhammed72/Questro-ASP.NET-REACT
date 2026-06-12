import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import NavLinks from './NavLinks';
import GuestActions from './GuestActions';
import UserActions from './UserActions';
import MobileMenu from './MobileMenu';
import { useAuth } from '../../features/auth/store/AuthContext';

const NavBar = ({ onVisibilityChange, forceHidden = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollDebounceTimer = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoggedIn: isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
      const isAtBottom = window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 100;

      setIsScrolled(currentScrollY > 50);

      // Only update visibility if we've scrolled more than 10px to prevent flickering
      if (scrollDelta > 10) {
        // Always show navbar at the top or bottom of page
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
      <nav
        className={`fixed top-0 w-full z-50 py-3 sm:py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center transition-all duration-300 ease-in-out border-b ${
          (isVisible && !forceHidden) ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled ? 'bg-zinc-950/95 backdrop-blur-md shadow-lg border-zinc-800/50' : 'bg-gradient-to-b from-zinc-950/40 to-transparent border-transparent'
        }`}
      >
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 group" onClick={handleNavLinkClick}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <img src={logoImg} alt="Questro Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <span className="hidden sm:inline text-xl sm:text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent group-hover:from-white group-hover:to-zinc-300 transition-all duration-200 tracking-wide">
            Questro
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:block flex-1 ml-12">
          <NavLinks isAuthenticated={isAuthenticated} />
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center">
          {isAuthenticated ? <UserActions /> : <GuestActions />}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-zinc-800/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center gap-1.5">
              <span className={`block w-full h-0.5 bg-zinc-100 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-full h-0.5 bg-zinc-100 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-full h-0.5 bg-zinc-100 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <MobileMenu
          isAuthenticated={isAuthenticated}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default NavBar;