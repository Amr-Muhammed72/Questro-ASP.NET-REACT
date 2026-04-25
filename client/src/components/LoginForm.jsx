import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoginForm = ({ handleLogin, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();
    handleLogin({ email, password });
    setEmail('');
    setPassword('');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3.5 pl-12 text-white focus:outline-none focus:border-purple-500/80 transition-all"
            placeholder="you@example.com"
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