import React, { useState } from 'react';
import { Mail, Lock, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 characters').max(6),
});

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[0-9]/, 'At least one number')
    .regex(/[^A-Za-z0-9]/, 'At least one special character'),
  confirmNewPassword: z.string()
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"]
});

const ForgotPasswordForm = () => {
  const [step, setStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { requestOtp, verifyOtp, resetPassword, isLoading, error, setError } = useForgotPassword();
  const navigate = useNavigate();

  const { register: registerEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors } } = useForm({
    resolver: zodResolver(emailSchema)
  });

  const { register: registerOtp, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors } } = useForm({
    resolver: zodResolver(otpSchema)
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors } } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  const onEmailSubmit = async (data) => {
    try {
      await requestOtp(data.email);
      setResetEmail(data.email);
      setStep(2);
    } catch (err) {
      // Handled by hook error state
    }
  };

  const onOtpSubmit = async (data) => {
    try {
      const response = await verifyOtp(resetEmail, data.otp);
      if (response.resetToken) {
        setResetToken(response.resetToken);
        setStep(3);
      }
    } catch (err) {
      // Handled by hook error state
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await resetPassword(resetToken, data.newPassword, data.confirmNewPassword);
      navigate('/login');
    } catch (err) {
      // Handled by hook error state
    }
  };

  const renderError = (err) => (
    <AnimatePresence>
      {err && (
        <motion.p 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-red-400 text-xs mt-1.5 flex items-center gap-1 font-medium"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {err.message}
        </motion.p>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl shadow-lg shadow-red-500/5"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Request Failed</p>
              <p>{error?.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* STEP 1: EMAIL */}
      {step === 1 && (
        <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4">
          <p className="text-sm text-zinc-400 mb-4">Enter your email address to receive an OTP.</p>
          <div>
            <div className="relative">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors ${emailErrors.email ? 'text-red-400' : 'text-zinc-500'}`} />
              <input
                type="email"
                {...registerEmail('email')}
                className={`w-full bg-zinc-900/50 border rounded-xl px-4 py-3 pl-12 text-white focus:outline-none transition-all ${
                  emailErrors.email ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' : 'border-zinc-700/50 focus:border-purple-500/80'
                }`}
                placeholder="you@example.com"
              />
            </div>
            {renderError(emailErrors.email)}
          </div>
          <button type="submit" disabled={isLoading} className="w-full mt-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]">
            {isLoading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {/* STEP 2: VERIFY OTP */}
      {step === 2 && (
        <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
          <p className="text-sm text-zinc-400 mb-4">Enter the code sent to <span className="text-white font-medium">{resetEmail}</span>.</p>
          <div>
            <div className="relative">
              <KeyRound className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors ${otpErrors.otp ? 'text-red-400' : 'text-zinc-500'}`} />
              <input
                type="text"
                {...registerOtp('otp')}
                className={`w-full bg-zinc-900/50 border rounded-xl px-4 py-3 pl-12 text-white focus:outline-none transition-all tracking-widest ${
                  otpErrors.otp ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' : 'border-zinc-700/50 focus:border-purple-500/80'
                }`}
                placeholder="123456" maxLength={6}
              />
            </div>
            {renderError(otpErrors.otp)}
          </div>
          <button type="submit" disabled={isLoading} className="w-full mt-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]">
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      )}

      {/* STEP 3: NEW PASSWORD WITH TOKEN */}
      {step === 3 && (
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <p className="text-sm text-zinc-400 mb-4">Please choose a new password.</p>
          <div>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors ${passwordErrors.newPassword ? 'text-red-400' : 'text-zinc-500'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                {...registerPassword('newPassword')}
                className={`w-full bg-zinc-900/50 border rounded-xl px-4 py-3 pl-12 pr-12 text-white focus:outline-none transition-all ${
                  passwordErrors.newPassword ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' : 'border-zinc-700/50 focus:border-purple-500/80'
                }`}
                placeholder="New Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {renderError(passwordErrors.newPassword)}
          </div>
          <div>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors ${passwordErrors.confirmNewPassword ? 'text-red-400' : 'text-zinc-500'}`} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...registerPassword('confirmNewPassword')}
                className={`w-full bg-zinc-900/50 border rounded-xl px-4 py-3 pl-12 pr-12 text-white focus:outline-none transition-all ${
                  passwordErrors.confirmNewPassword ? 'border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20' : 'border-zinc-700/50 focus:border-purple-500/80'
                }`}
                placeholder="Confirm New Password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {renderError(passwordErrors.confirmNewPassword)}
          </div>
          <button type="submit" disabled={isLoading} className="w-full mt-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]">
            {isLoading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;