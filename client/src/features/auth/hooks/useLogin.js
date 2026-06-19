import { useState } from 'react';
import { authService } from '../api/authService';

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (credentials, onSuccess) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login(credentials);
      if (onSuccess) onSuccess(data);
      return data;
    } catch (err) {
      const errorData = err.response?.data || err;
      let errorMessage = errorData?.en || errorData?.description || errorData?.message || 'Invalid email or password.';
      
      if (errorData?.code === 'User.LockedOut') {
        errorMessage = 'Your account has been locked. Please try again later.';
      } else if (errorData?.code === 'User.InvalidCredentials') {
        errorMessage = errorData?.en || 'Authentication failed. Please check your credentials.';
      }
      
      setError({ message: errorMessage, code: errorData?.code });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error, setError };
};
