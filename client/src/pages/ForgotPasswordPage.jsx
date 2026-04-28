import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import passwordService from '../services/passwordReset';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import bgImage from '../assets/main-background.png'; 

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (email) => {
    setIsLoading(true);
    try {
      await passwordService.requestOtp(email);
      return true; 
    } catch (error) {
      console.error('Failed to send OTP');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Handle the OTP verification and return the token
  const handleVerifyOtp = async (email, otp) => {
    setIsLoading(true);
    try {
      const response = await passwordService.verifyOtp(email, otp);
      return response.resetToken; // Return the token to the form!
    } catch (error) {
      console.error('Invalid OTP');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (email, resetToken, newPassword) => {
    setIsLoading(true);
    try {
      await passwordService.resetPassword(email, resetToken, newPassword);
      console.log('Password reset successfully!');
      // Navigate to login here
    } catch (error) {
      console.error('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundStyle = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div style={backgroundStyle} className="relative w-full min-h-screen flex items-center justify-center px-4 font-sans bg-black/40 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-lg p-8 shadow-2xl">
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg text-white mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
        </div>

        <ForgotPasswordForm 
          handleRequestOtp={handleRequestOtp} 
          handleVerifyOtp={handleVerifyOtp}
          handleResetPassword={handleResetPassword} 
          isLoading={isLoading} 
        />
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <Link 
             to="/login"
             className="w-full flex items-center justify-center space-x-2 text-sm text-zinc-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;