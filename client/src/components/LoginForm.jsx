import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('http://localhost:5222/api/Auth/logIn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid credentials. Please check your email and password.');
        } else {
          throw new Error('An error occurred during login. Please try again.');
        }
      }

      const data = await response.json();
      login(data.accessToken);
      navigate('/movies');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg">
          {errorMessage}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Email or Username</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3.5 pl-12 text-white focus:outline-none focus:border-purple-500/80 transition-all"
            placeholder="Email or Username"
            required
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-zinc-300">Password</label>
          <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium">Forgot password?</Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
          <input
            type="password"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3.5 pl-12 text-white focus:outline-none focus:border-purple-500/80 transition-all"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all"
      >
        {isLoading ? 'Entering Realm...' : 'Sign In'}
      </button>
    </form>
  );
};

export default LoginForm;