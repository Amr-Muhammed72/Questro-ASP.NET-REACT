import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Baby, AlertCircle } from 'lucide-react';
import { useCreateChild } from '../hooks/useFamily';
import { RestrictionToggles } from './RestrictionToggles';

const childSchema = z.object({
  userName: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  birthDate: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ChildForm = ({ onClose }) => {
  const [blockedMovieGenreIds, setBlockedMovieGenreIds] = useState([]);
  const [blockedGameGenreIds, setBlockedGameGenreIds] = useState([]);
  const [apiError, setApiError] = useState('');

  const createChildMutation = useCreateChild();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(childSchema),
  });

  // Handle Escape key and prevent background scrolling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const onSubmit = (data) => {
    setApiError('');
    
    // Format the payload exactly as the backend expects
    const payload = {
      userName: data.userName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      // Format date to ISO string if provided
      birthDate: data.birthDate ? new Date(data.birthDate).toISOString() : null,
      blockedMovieGenreIds: blockedMovieGenreIds.length > 0 ? blockedMovieGenreIds : null,
      blockedGameGenreIds: blockedGameGenreIds.length > 0 ? blockedGameGenreIds : null,
    };

    createChildMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
      },
      onError: (error) => {
        // Handle explicit backend error codes based on API docs
        if (error?.code === 'User.UserNameAlreadyExists') {
          setApiError('This username is already taken. Please try another.');
        } else if (error?.code === 'User.EmailAlreadyExists') {
          setApiError('This email is already registered.');
        } else if (error?.code === 'Family.ChildCannotHaveChildren') {
          setApiError('Child accounts cannot create sub-accounts.');
        } else {
          setApiError(error?.details || error?.message || 'An unexpected error occurred while creating the account.');
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900/90 border border-white/10 rounded-3xl shadow-2xl shadow-purple-900/20 backdrop-blur-xl">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-zinc-900/95 border-b border-white/10 backdrop-blur-md rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-purple-500/30 rounded-xl">
              <Baby className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Add Child Account</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          
          {apiError && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm font-medium">{apiError}</p>
            </div>
          )}

          {/* Account Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Account Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-400 ml-1">Username *</label>
                <input
                  {...register('userName')}
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="e.g. kid_gamer_99"
                />
                {errors.userName && <p className="text-red-400 text-xs ml-1">{errors.userName.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-400 ml-1">Email * (Use plus-alias e.g. parent+child@email.com)</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="parent+ali@example.com"
                />
                {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-400 ml-1">Password *</label>
                <input
                  {...register('password')}
                  type="password"
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-400 ml-1">Confirm Password *</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-red-400 text-xs ml-1">{errors.confirmPassword.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-400 ml-1">First Name</label>
                <input
                  {...register('firstName')}
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-400 ml-1">Last Name</label>
                <input
                  {...register('lastName')}
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-400 ml-1">Birth Date</label>
                <input
                  {...register('birthDate')}
                  type="date"
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Restrictions */}
          <div className="p-5 bg-black/20 border border-white/5 rounded-2xl">
            <RestrictionToggles
              blockedMovieGenreIds={blockedMovieGenreIds}
              onChangeBlockedMovieGenres={setBlockedMovieGenreIds}
              blockedGameGenreIds={blockedGameGenreIds}
              onChangeBlockedGameGenres={setBlockedGameGenreIds}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-zinc-300 bg-transparent hover:bg-zinc-800 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createChildMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(138,43,226,0.3)] hover:shadow-[0_0_25px_rgba(138,43,226,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createChildMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
