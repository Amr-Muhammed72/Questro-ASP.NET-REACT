import { useState } from 'react';
import { authService } from '../api/authService';

export const useRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const register = async (userData, onSuccess) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.register(userData);
      if (onSuccess) onSuccess(data);
      return data;
    } catch (err) {
      // apiClient interceptor returns Promise.reject(error.response?.data || error)
      const errorData = err.response?.data || err;
      const errorMessage = errorData?.en || errorData?.description || errorData?.message || 'An unexpected error occurred during registration.';
      const details = errorData?.details || [];
      console.error('Registration error response:', errorData);
      setError({ message: errorMessage, details, code: errorData?.code });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error, setError };
};
