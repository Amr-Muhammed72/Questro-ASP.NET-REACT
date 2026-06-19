import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import ForgotPasswordForm from '../features/auth/components/ForgotPasswordForm';
import PremiumBackground from '../components/ui/PremiumBackground';

const ForgotPasswordPage = () => {
  return (
    <PremiumBackground>
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative z-10 my-12 mx-4">
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg text-white mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
        </div>

        <ForgotPasswordForm />
        
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
    </PremiumBackground>
  );
};

export default ForgotPasswordPage;

