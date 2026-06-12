import { useState } from 'react';
import { authService } from '../api/authService';

export const useOtpVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState(null);

  const verifyOtp = async (email, otp, registrationData, onSuccess) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.verifyOtp(email, otp, registrationData);
      if (onSuccess) onSuccess(data);
      return data;
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.en || errorData?.description || 'Invalid or expired OTP.';
      setError({ message: errorMessage, code: errorData?.code });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (email, onSuccess) => {
    setIsResending(true);
    setError(null);
    try {
      await authService.resendOtp(email);
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.en || errorData?.description || 'Failed to resend OTP.';
      setError({ message: errorMessage, code: errorData?.code });
      throw err;
    } finally {
      setIsResending(false);
    }
  };

  return { verifyOtp, resendOtp, isLoading, isResending, error, setError };
};
