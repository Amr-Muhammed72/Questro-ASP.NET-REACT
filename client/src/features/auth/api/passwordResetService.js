import { apiClient } from '../../../lib/apiClient';

export const passwordResetService = {
  /**
   * Step 1: Request OTP for password reset
   * @param {string} email
   */
  requestOtp: async (email) => {
    const response = await apiClient.post('/ForgotPassword/forgot-password', { email });
    return response.data;
  },

  /**
   * Step 2: Verify reset OTP to get the reset token
   * @param {string} email
   * @param {string} otp
   * @returns { resetToken }
   */
  verifyOtp: async (email, otp) => {
    const response = await apiClient.post('/ForgotPassword/verify-reset-otp', { email, otp });
    return response.data;
  },

  /**
   * Step 3: Reset password using the token
   * @param {string} resetToken
   * @param {string} newPassword
   * @param {string} confirmPassword
   */
  resetPassword: async (resetToken, newPassword, confirmPassword) => {
    const response = await apiClient.post('/ForgotPassword/reset-password', {
      resetToken,
      newPassword,
      confirmPassword
    });
    return response.data;
  }
};
