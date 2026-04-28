import React, { useState } from 'react';
import { Mail, Lock, KeyRound } from 'lucide-react';

const ForgotPasswordForm = ({ handleRequestOtp, handleVerifyOtp, handleResetPassword, isLoading }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState(''); // New state for the token!
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  // Step 1: Send the OTP
  const onEmailSubmit = async (event) => {
    event.preventDefault();
    
    const success = true; //await handleRequestOtp(email);
    if (success) setStep(2);
  };

  // Step 2: Verify OTP and get the token
  const onOtpSubmit = async (event) => {
    event.preventDefault();
    const token = true; // await handleVerifyOtp(email, otp);
    if (token) {
      setResetToken(token); // Save the token securely in state
      setStep(3); // Move to final step
    }
  };

  // Step 3: Set New Password using the token
  const onPasswordSubmit = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('Passwords do not match!');
      return;
    }      
    await handleResetPassword(email, resetToken, newPassword);
    // navigate('/login'); // Redirect to login after successful reset
  };

  return (
    <div className="space-y-4">
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