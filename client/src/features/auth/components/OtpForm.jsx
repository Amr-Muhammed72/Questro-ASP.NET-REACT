import React, { useState, useEffect } from 'react';
import { Key, ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import { useOtpVerification } from '../hooks/useOtpVerification';
import { useAuth } from '../store/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../api/authService';
import { setToken } from '../../../lib/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

const OtpForm = ({ email, registrationData, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const { verifyOtp, resendOtp, isLoading, isResending, error } = useOtpVerification();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [timeLeft, setTimeLeft] = useState(() => {
    const savedTime = localStorage.getItem(`otpResendTimeout_${email}`);
    if (savedTime) {
      const remaining = Math.floor((parseInt(savedTime, 10) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    const initialTime = 180;
    localStorage.setItem(`otpResendTimeout_${email}`, (Date.now() + initialTime * 1000).toString());
    return initialTime;
  });

  useEffect(() => {
    if (timeLeft <= 0) {
      localStorage.removeItem(`otpResendTimeout_${email}`);
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, email]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      let data = await verifyOtp(email, otp, registrationData);

      // Auto-login if registrationData has password and we didn't get a token
      if ((!data || !data.accessToken) && registrationData?.password) {
        try {
          data = await authService.login({ email, password: registrationData.password });
        } catch (loginErr) {
          console.error("Auto-login failed:", loginErr);
        }
      }

      if (data && data.accessToken) {
        setToken(data.accessToken);
        login(data.accessToken);
        navigate('/survey');
      } else if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleResend = async () => {
    try {
      const isRegisterPhase = !!registrationData;
      await resendOtp(email, isRegisterPhase);
      
      const initialTime = 180;
      localStorage.setItem(`otpResendTimeout_${email}`, (Date.now() + initialTime * 1000).toString());
      setTimeLeft(initialTime);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
              <p className="font-semibold text-red-300">
                {error.type === 'resend' ? 'Failed to Resend OTP' : 'OTP Verification Failed'}
              </p>
              <p>{error.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Enter 6-digit OTP sent to {email}
        </label>
        <div className="relative">
          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={otp}
            onChange={({ target }) => setOtp(target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3.5 pl-12 text-white focus:outline-none focus:border-purple-500/80 transition-all"
            placeholder="123456"
            maxLength={6}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || otp.length < 6}
        className="w-full mt-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all"
      >
        {isLoading ? 'Verifying...' : 'Verify OTP'}
      </button>

      <div className="flex flex-col items-center justify-center mt-6 space-y-2">
        <p className="text-sm text-zinc-400">Didn't receive the code?</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || timeLeft > 0}
          className={`flex items-center space-x-2 text-sm font-medium px-4 py-2 rounded-full transition-all ${
            timeLeft > 0 
              ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed' 
              : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300'
          }`}
        >
          {isResending ? (
            <span>Resending...</span>
          ) : timeLeft > 0 ? (
            <>
              <Clock className="w-4 h-4" />
              <span>Resend available in {formatTime(timeLeft)}</span>
            </>
          ) : (
            <span>Resend OTP</span>
          )}
        </button>
      </div>

      <div className="text-center mt-2">
        <Link 
          to="/login"
          className="w-full flex items-center justify-center space-x-2 text-sm text-zinc-400 hover:text-cyan-400 transition-colors mt-6 pt-4 border-t border-zinc-800/50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to login</span>
        </Link>
      </div>
    </form>
  );
};

export default OtpForm;