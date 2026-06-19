import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { setToken } from '../../../lib/apiClient';
import { authService } from '../api/authService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authService.login(data);
      
      setToken(response.accessToken);
      login(response.accessToken);

      navigate('/home');
    } catch (error) {
      // apiClient interceptor rejects with error.response?.data or error
      const errorData = error.response?.data || error;
      const backendMessage = errorData?.en || errorData?.description || errorData?.message;
      
      if (backendMessage) {
        setErrorMessage(backendMessage);
      } else if (error.response?.status === 401 || error.status === 401) {
        setErrorMessage('Invalid credentials. Please check your email and password.');
      } else {
        setErrorMessage('An error occurred during login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl shadow-lg shadow-red-500/5"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Login Failed</p>
              <p>{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Email or Username</label>
        <div className="relative">
          <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors ${errors.email ? 'text-red-400' : 'text-zinc-500'}`} />
          <input
            type="text"
            {...register('email')}
            className={`w-full bg-zinc-900/50 border rounded-xl px-4 py-3.5 pl-12 text-white focus:outline-none transition-all ${
              errors.email 
                ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' 
                : 'border-zinc-700/50 focus:border-purple-500/80'
            }`}
            placeholder="Email or Username"
          />
        </div>
        <AnimatePresence>
          {errors.email && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-xs mt-1.5 flex items-center gap-1 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-zinc-300">Password</label>
          <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium">Forgot password?</Link>
        </div>
        <div className="relative">
          <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors ${errors.password ? 'text-red-400' : 'text-zinc-500'}`} />
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            className={`w-full bg-zinc-900/50 border rounded-xl px-4 py-3.5 pl-12 pr-12 text-white focus:outline-none transition-all ${
              errors.password 
                ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' 
                : 'border-zinc-700/50 focus:border-purple-500/80'
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <AnimatePresence>
          {errors.password && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-xs mt-1.5 flex items-center gap-1 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-purple-500/25 active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Entering Realm...
          </span>
        ) : 'Sign In'}
      </button>
    </form>
  );
};

export default LoginForm;