import { Link } from 'react-router-dom';

const GuestActions = () => {
  return (
    <div className="flex items-center space-x-4">
      <Link to="/login" className="text-white hover:text-gray-200 transition-colors">
        Sign In
      </Link>
      <Link
        to="/register"
        className="px-4 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors"
      >
        Join Questro
      </Link>
    </div>
  );
};

export default GuestActions;
