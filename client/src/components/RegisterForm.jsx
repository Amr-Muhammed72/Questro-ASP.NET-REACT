import React, { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';

const RegisterForm = ({ handleRegister, isLoading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      console.error('Passwords do not match');
      return;
    }
    handleRegister({ name, email, password });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Full Name</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={name}
            onChange={({ target }) => setName(target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 pl-12 text-white focus:outline-none focus:border-purple-500/80 transition-all"
            required
            placeholder="Ayman Ahmed"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 pl-12 text-white focus:outline-none focus:border-purple-500/80 transition-all"
            required
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
          <input
            type="password"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 pl-12 text-white focus:outline-none focus:border-purple-500/80 transition-all"
            required
            placeholder="••••••••"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
          <input
            type="password"
            value={confirmPassword}
            onChange={({ target }) => setConfirmPassword(target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 pl-12 text-white focus:outline-none focus:border-purple-500/80 transition-all"
            required
            placeholder="••••••••"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all hover:shadow-purple-500/25 shadow-lg"
      >
        {isLoading ? 'Forging Realm...' : 'Create Account'}
      </button>
    </form>
  );
};

export default RegisterForm;