import { NavLink } from 'react-router-dom';

const NavLinks = ({ isAuthenticated }) => {
  const baseLinks = [
    { name: 'Home', path: '/' },
  ];

  const authLinks = [
    { name: 'Movies', path: '/movies' },
    { name: 'Games', path: '/games' },
  ];

  const linksToShow = isAuthenticated ? [...baseLinks, ...authLinks] : baseLinks;

  return (
    <ul className="flex items-center space-x-1">
      {linksToShow.map((link) => (
        <li key={link.name}>
          <NavLink
            to={link.path}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                isActive
                  ? 'text-indigo-400'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
              }`
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
