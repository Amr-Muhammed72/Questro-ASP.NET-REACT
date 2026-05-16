import { useState } from 'react';
import { passwordResetService } from '../api/passwordResetService';

export const useForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatError = (err, defaultMsg) => {
    const errorData = err.response?.data;
    return errorData?.en || errorData?.description || defaultMsg;
  };

  const requestOtp = async (email, onSuccess) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await passwordResetService.requestOtp(email);
      if (onSuccess) onSuccess(data);
      return data;
    } catch (err) {
      setError({ message: formatError(err, 'Failed to request password reset.'), code: err.response?.data?.code });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email, otp, onSuccess) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await passwordResetService.verifyOtp(email, otp);
      if (onSuccess) onSuccess(data);
      return data;
    } catch (err) {
      setError({ message: formatError(err, 'Invalid or expired OTP.'), code: err.response?.data?.code });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (resetToken, newPassword, confirmPassword, onSuccess) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await passwordResetService.resetPassword(resetToken, newPassword, confirmPassword);
      if (onSuccess) onSuccess(data);
      return data;
    } catch (err) {
      setError({ message: formatError(err, 'Failed to reset password.'), code: err.response?.data?.code });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { requestOtp, verifyOtp, resetPassword, isLoading, error, setError };
};
