import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, User, UserCircle, Calendar, Hash, ChevronDown, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Must be at least 2 characters'),
  lastName: z.string().min(2, 'Must be at least 2 characters'),
  userName: z.string().min(3, 'Must be at least 3 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  gender: z.enum(['Male', 'Female', 'Other']),
  birthDate: z.string().min(1, 'Birth date is required').refine(val => {
    if (!val) return false;
    const date = new Date(val);
    return date < new Date();
  }, { message: 'Birth date must be in the past' }),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[0-9]/, 'At least one number')
    .regex(/[^A-Za-z0-9]/, 'At least one special character'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const RegisterForm = ({ handleRegister, isLoading }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dropdownRef = useRef(null);

  const { register, handleSubmit, setValue, watch, setError, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      userName: '',
      email: '',
      gender: 'Male',
      birthDate: '',
      password: '',
      confirmPassword: '',
    }
  });

  const selectedGender = watch('gender');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onSubmit = async (data) => {
    // Format birthDate to match backend expectations
    const formattedData = {
      ...data,
      birthDate: `${data.birthDate}T00:00:00`
    };

    try {
      await handleRegister(formattedData);
    } catch (err) {
      // Catch backend errors thrown by useRegister and map them to fields
      const errorData = err.response?.data || err;
      const code = errorData?.code;
      const message = errorData?.en || errorData?.description || 'An error occurred';

      if (code === 'User.EmailAlreadyExists') {
        setError('email', { type: 'server', message });
      } else if (code === 'User.UserNameAlreadyExists') {
        setError('userName', { type: 'server', message });
      } else if (code === 'User.PasswordsDoNotMatch') {
        setError('confirmPassword', { type: 'server', message });
      }
      // You can add more specific field errors here if needed
    }
  };

  const renderError = (error) => (
    <AnimatePresence>
      {error && (
        <motion.p 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-red-400 text-xs mt-1.5 flex items-center gap-1 font-medium"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error.message}
        </motion.p>
      )}
    </AnimatePresence>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">First Name</label>
          <div className="relative">
            <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${errors.firstName ? 'text-red-400' : 'text-zinc-500'}`} />
            <input
              type="text"
              {...register('firstName')}
              className={`w-full bg-zinc-900/50 border rounded-xl px-3 py-2.5 pl-9 text-white focus:outline-none transition-all text-sm ${
                errors.firstName ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' : 'border-zinc-700/50 focus:border-purple-500/80'
              }`}
              placeholder="First"
            />
          </div>
          {renderError(errors.firstName)}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Last Name</label>
          <div className="relative">
            <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${errors.lastName ? 'text-red-400' : 'text-zinc-500'}`} />
            <input
              type="text"
              {...register('lastName')}
              className={`w-full bg-zinc-900/50 border rounded-xl px-3 py-2.5 pl-9 text-white focus:outline-none transition-all text-sm ${
                errors.lastName ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' : 'border-zinc-700/50 focus:border-purple-500/80'
              }`}
              placeholder="Last"
            />
          </div>
          {renderError(errors.lastName)}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Username</label>
        <div className="relative">
          <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${errors.userName ? 'text-red-400' : 'text-zinc-500'}`} />
          <input
            type="text"
            {...register('userName')}
            className={`w-full bg-zinc-900/50 border rounded-xl px-3 py-2.5 pl-9 text-white focus:outline-none transition-all text-sm ${
              errors.userName ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' : 'border-zinc-700/50 focus:border-purple-500/80'
            }`}
            placeholder="user293"
          />
        </div>
        {renderError(errors.userName)}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Email Address</label>
        <div className="relative">
          <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${errors.email ? 'text-red-400' : 'text-zinc-500'}`} />
          <input
            type="email"
            {...register('email')}
            className={`w-full bg-zinc-900/50 border rounded-xl px-3 py-2.5 pl-9 text-white focus:outline-none transition-all text-sm ${
              errors.email ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' : 'border-zinc-700/50 focus:border-purple-500/80'
            }`}
            placeholder="you@example.com"
          />
        </div>
        {renderError(errors.email)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div ref={dropdownRef}>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Gender</label>
          <div className="relative">
            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 z-10 pointer-events-none" />
            
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full bg-zinc-900/50 border rounded-xl px-3 py-2.5 pl-9 text-left text-white transition-all text-sm flex items-center justify-between
                ${isDropdownOpen ? 'border-purple-500/80 outline-none ring-1 ring-purple-500/20' : 'border-zinc-700/50'}`}
            >
              {selectedGender}
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-xl overflow-hidden z-50 shadow-2xl">
                {['Male', 'Female', 'Other'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setValue('gender', option, { shouldValidate: true });
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${selectedGender === option ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-300 hover:bg-purple-500/10 hover:text-white'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          {renderError(errors.gender)}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Birth Date</label>
          <div className="relative h-[42px]">
            <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10 transition-colors ${errors.birthDate ? 'text-red-400' : 'text-zinc-500'}`} />
            <input
              type="date"
              {...register('birthDate')}
              className={`absolute inset-0 w-full h-full bg-zinc-900/50 border rounded-xl px-3 pl-9 text-white focus:outline-none transition-all text-sm [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 hover:border-zinc-500/50 ${
                errors.birthDate ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' : 'border-zinc-700/50 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/20'
              }`}
            />
          </div>
          {renderError(errors.birthDate)}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
        <div className="relative">
          <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${errors.password ? 'text-red-400' : 'text-zinc-500'}`} />
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            className={`w-full bg-zinc-900/50 border rounded-xl px-3 py-2.5 pl-9 pr-10 text-white focus:outline-none transition-all text-sm ${
              errors.password ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' : 'border-zinc-700/50 focus:border-purple-500/80'
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {renderError(errors.password)}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Confirm Password</label>
        <div className="relative">
          <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-zinc-500'}`} />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            className={`w-full bg-zinc-900/50 border rounded-xl px-3 py-2.5 pl-9 pr-10 text-white focus:outline-none transition-all text-sm ${
              errors.confirmPassword ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' : 'border-zinc-700/50 focus:border-purple-500/80'
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {renderError(errors.confirmPassword)}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-6 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all hover:shadow-purple-500/25 shadow-lg active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Forging Realm...
          </span>
        ) : 'Create Account'}
      </button>
    </form>
  );
};

export default RegisterForm;
