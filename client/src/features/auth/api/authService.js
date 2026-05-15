import { apiClient } from '../../../lib/apiClient';

export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - { userName, firstName, lastName, email, password, confirmPassword, gender, birthDate }
   */
  register: async (userData) => {
    const response = await apiClient.post('/Auth/register', userData);
    return response.data;
  },

  /**
   * Log in user (Initial step, expects 200 OK to proceed to OTP)
   * @param {Object} credentials - { email, password }
   */
  login: async (credentials) => {
    const response = await apiClient.post('/Auth/logIn', credentials);
    return response.data;
  },

  /**
   * Verify OTP to complete login/register
   * @param {string} email
   * @param {string} otp
   * @returns accessToken and user details
   */
  verifyOtp: async (email, otp) => {
    const response = await apiClient.post('/Auth/Verify', { email, otp });
    return response.data;
  },

  /**
   * Resend OTP
   * @param {string} email
   */
  resendOtp: async (email) => {
    const response = await apiClient.post('/OTP/Resend-OTP', { email });
    return response.data;
  },

  /**
   * Refresh the access token using the HttpOnly cookie
   */
  refreshToken: async () => {
    const response = await apiClient.post('/Auth/refresh-token');
    return response.data;
  },

  /**
   * Log out the user (clears refresh token in backend and cookie)
   */
  logout: async () => {
    const response = await apiClient.post('/Auth/logOut');
    return response.data;
  }
};
