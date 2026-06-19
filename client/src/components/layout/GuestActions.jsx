import { Link } from 'react-router-dom';

const GuestActions = () => {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        to="/login"
        className="px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white transition-colors duration-200 rounded-full hover:bg-zinc-800/80"
      >
        Sign In
      </Link>
      <Link
        to="/register"
        className="relative px-5 py-2 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden"
      >
        <span className="relative z-10">Join Questro</span>
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </Link>
    </div>
  );
};

export default GuestActions;
