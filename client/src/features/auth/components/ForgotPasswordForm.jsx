import React, { useState } from 'react';
import { Mail, Lock, KeyRound } from 'lucide-react';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordForm = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [matchError, setMatchError] = useState(null);

  const { requestOtp, verifyOtp, resetPassword, isLoading, error, setError } = useForgotPassword();
  const navigate = useNavigate();

  const onEmailSubmit = async (event) => {
    event.preventDefault();
    try {
      await requestOtp(email);
      setStep(2);
    } catch (err) {
      // Handled by hook error state
    }
  };

  const onOtpSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = await verifyOtp(email, otp);
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setStep(3);
      }
    } catch (err) {
      // Handled by hook error state
    }
  };

  const onPasswordSubmit = async (event) => {
    event.preventDefault();
    setMatchError(null);
    if (newPassword !== confirmNewPassword) {
      setMatchError("Passwords do not match!");
      return;
    }      
    try {
      await resetPassword(resetToken, newPassword, confirmNewPassword);
      navigate('/login');
    } catch (err) {
      // Handled by hook error state
    }
  };

  return (
    <div className="space-y-4">
      {(error || matchError) && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg">
          {matchError || error?.message}
        </div>
      )}
      
      {/* STEP 1: EMAIL */}
      {step === 1 && (
        <form onSubmit={onEmailSubmit} className="space-y-4">
          <p className="text-sm text-zinc-400 mb-4">Enter your email address to receive an OTP.</p>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={({ target }) => setEmail(target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 pl-12 text-white focus:outline-none focus:border-purple-500/80 transition-all"
              required placeholder="you@example.com"
            />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all">
            {isLoading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {/* STEP 2: VERIFY OTP */}
      {step === 2 && (
        <form onSubmit={onOtpSubmit} className="space-y-4">
          <p className="text-sm text-zinc-400 mb-4">Enter the code sent to <span className="text-white font-medium">{email}</span>.</p>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              value={otp}
              onChange={({ target }) => setOtp(target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 pl-12 text-white focus:outline-none focus:border-purple-500/80 transition-all tracking-widest"
              required placeholder="123456" maxLength={6}
            />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all">
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      )}

      {/* STEP 3: NEW PASSWORD WITH TOKEN */}
      {step === 3 && (
        <form onSubmit={onPasswordSubmit} className="space-y-4">
          <p className="text-sm text-zinc-400 mb-4">Please choose a new password.</p>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
            <input
              type="password"
              value={newPassword}
              onChange={({ target }) => setNewPassword(target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 pl-12 text-white focus:outline-none focus:border-purple-500/80 transition-all"
              required placeholder="New Password"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 pointer-events-none" />
            <input
              type="password"
              value={confirmNewPassword}
              onChange={({ target }) => setConfirmNewPassword(target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 pl-12 text-white focus:outline-none focus:border-purple-500/80 transition-all"
              required placeholder="Confirm New Password"
            />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all">
            {isLoading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;