import React, { useState } from 'react';
import { Key, ArrowLeft } from 'lucide-react';
import { useOtpVerification } from '../hooks/useOtpVerification';
import { useAuth } from '../store/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const OtpForm = ({ email, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const { verifyOtp, resendOtp, isLoading, isResending, error } = useOtpVerification();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = await verifyOtp(email, otp);
      
      if (data && data.accessToken) {
        login(data.accessToken);
        navigate('/');
      } else if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(email);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg">
          {error.message}
        </div>
      )}
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

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          {isResending ? 'Resending...' : 'Resend OTP'}
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