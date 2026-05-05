import { NavLink } from 'react-router-dom';

const NavLinks = ({ isAuthenticated }) => {
  const baseLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
  ];

  const authLinks = [
    { name: 'Movies', path: '/movies' },
    { name: 'Movie Details', path: '/movies/details' },
  ];

  const linksToShow = isAuthenticated ? [...baseLinks, ...authLinks] : baseLinks;

  return (
    <ul className="flex items-center space-x-6 text-white">
      {linksToShow.map((link) => (
        <li key={link.name}>
          <NavLink
            to={link.path}
            className={({ isActive }) =>
              isActive
                ? 'text-gray-300 font-semibold'
                : 'hover:text-gray-300 transition-colors'
            }
          >
            {link.name}
          </NavLink>
        </li>
      ))}
    </ul>
  );
};

export default NavLinks;
