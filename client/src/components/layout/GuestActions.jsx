import { Link } from 'react-router-dom';

const GuestActions = () => {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Link
        to="/login"
        className="px-4 sm:px-6 py-2 sm:py-2.5 text-zinc-300 font-semibold hover:text-white transition-colors duration-200 rounded-lg hover:bg-zinc-800/50"
      >
        Sign In
      </Link>
      <Link
        to="/register"
        className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-lg hover:from-indigo-500 hover:to-indigo-400 shadow-lg hover:shadow-indigo-500/50 transition-all duration-200 hover:scale-105"
      >
        Join Questro
      </Link>
    </div>
  );
};

export default GuestActions;
