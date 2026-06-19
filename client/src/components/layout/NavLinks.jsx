import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';

const NavLinks = ({ isAuthenticated }) => {
  const location = useLocation();
  const [hoveredPath, setHoveredPath] = useState(null);

  const baseLinks = [];

  const authLinks = [
    { name: 'Home', path: '/home' },
    { name: 'Movies', path: '/movies' },
    { name: 'Games', path: '/games' },
  ];

  const linksToShow = isAuthenticated ? [...baseLinks, ...authLinks] : baseLinks;

  return (
    <ul className="flex items-center space-x-1" onMouseLeave={() => setHoveredPath(null)}>
      {linksToShow.map((link) => {
        const isActive = location.pathname.startsWith(link.path);
        
        return (
          <li key={link.name} className="relative z-10">
            <Link
              to={link.path}
              onMouseEnter={() => setHoveredPath(link.path)}
              className={`relative px-4 py-2 rounded-full font-medium text-sm transition-colors duration-200 block ${
                isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="relative z-20 tracking-wide">{link.name}</span>
              
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-white/10 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              {/* Hover Indicator */}
              {hoveredPath === link.path && !isActive && (
                <motion.div
                  layoutId="hoverNavIndicator"
                  className="absolute inset-0 bg-white/5 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default NavLinks;
